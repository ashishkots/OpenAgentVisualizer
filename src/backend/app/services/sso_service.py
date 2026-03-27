"""SSO service: SAML 2.0 + OIDC authorization-code flows.

SAML uses python3-saml for AuthnRequest generation and assertion validation.
OIDC uses authlib for the authorization code exchange.
Client secrets are encrypted at rest with Fernet (same pattern as IntegrationConfig).
"""
from __future__ import annotations

import logging
import secrets
import uuid
import xml.etree.ElementTree as ET
from typing import Optional
from urllib.parse import urlencode

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.integrations import encrypt_api_key, decrypt_api_key
from app.core.security import create_access_token, hash_password
from app.core.utils import utcnow
from app.models.sso import SSOConfig, SSOSession
from app.models.user import User, Workspace, WorkspaceMember

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _saml_available() -> bool:
    try:
        import onelogin.saml2.auth  # noqa: F401
        return True
    except ImportError:
        return False


def _authlib_available() -> bool:
    try:
        import authlib.integrations.httpx_client  # noqa: F401
        return True
    except ImportError:
        return False


# ---------------------------------------------------------------------------
# SAML helpers
# ---------------------------------------------------------------------------


def build_saml_auth_request(config: SSOConfig, acs_url: str) -> str:
    """Build a SAML SP-initiated AuthnRequest redirect URL.

    Returns the IdP SSO URL with a base64-encoded SAMLRequest query param.
    Falls back to a minimal hand-crafted request when python3-saml is not
    installed (useful during testing / development without the native lib).
    """
    if _saml_available():
        from onelogin.saml2.auth import OneLogin_Saml2_Auth
        from onelogin.saml2.settings import OneLogin_Saml2_Settings

        saml_settings = _build_saml_settings(config, acs_url)
        auth = OneLogin_Saml2_Auth(
            {"https": "on", "http_host": "localhost", "script_name": "/", "get_data": {}, "post_data": {}},
            old_settings=saml_settings,
        )
        return auth.login()

    # Fallback: minimal AuthnRequest (for testing without python3-saml)
    import base64
    import zlib

    request_id = f"_{uuid.uuid4().hex}"
    issue_instant = utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    authn_request = (
        f'<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" '
        f'ID="{request_id}" Version="2.0" IssueInstant="{issue_instant}" '
        f'AssertionConsumerServiceURL="{acs_url}" ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">'
        f'<saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">'
        f"{config.entity_id or acs_url}"
        f"</saml:Issuer></samlp:AuthnRequest>"
    )
    deflated = zlib.compress(authn_request.encode())[2:-4]
    encoded = base64.b64encode(deflated).decode()
    return f"{config.sso_url}?SAMLRequest={encoded}"


def _build_saml_settings(config: SSOConfig, acs_url: str) -> dict:
    """Build python3-saml settings dict from SSOConfig."""
    sp_entity_id = f"{settings.OAV_PUBLIC_URL}/api/v1/auth/sso/metadata"
    return {
        "strict": True,
        "debug": False,
        "sp": {
            "entityId": sp_entity_id,
            "assertionConsumerService": {
                "url": acs_url,
                "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST",
            },
            "NameIDFormat": "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
        },
        "idp": {
            "entityId": config.entity_id or "",
            "singleSignOnService": {
                "url": config.sso_url or "",
                "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect",
            },
            "x509cert": (config.certificate or "").replace("\n", ""),
        },
    }


def validate_saml_response(
    config: SSOConfig, acs_url: str, saml_response: str
) -> dict:
    """Validate a base64-encoded SAML response and return user attributes.

    Returns:
        dict with keys: email (str), name (Optional[str])

    Raises:
        ValueError: if assertion is invalid or email cannot be extracted.
    """
    if _saml_available():
        from onelogin.saml2.auth import OneLogin_Saml2_Auth

        saml_settings = _build_saml_settings(config, acs_url)
        auth = OneLogin_Saml2_Auth(
            {
                "https": "on",
                "http_host": "localhost",
                "script_name": "/",
                "get_data": {},
                "post_data": {"SAMLResponse": saml_response},
            },
            old_settings=saml_settings,
        )
        auth.process_response()
        errors = auth.get_errors()
        if errors:
            raise ValueError(f"SAML validation errors: {errors}")

        attrs = auth.get_attributes()
        name_id = auth.get_nameid()
        email = name_id or _extract_attr(attrs, ["email", "emailAddress", "mail"])
        if not email:
            raise ValueError("SAML assertion does not contain an email address")

        name = _extract_attr(attrs, ["displayName", "cn", "name"])
        return {"email": email, "name": name}

    # Fallback: minimal parsing (dev/test without python3-saml)
    import base64

    decoded = base64.b64decode(saml_response).decode(errors="replace")
    try:
        root = ET.fromstring(decoded)
    except ET.ParseError as exc:
        raise ValueError(f"Invalid SAML XML: {exc}") from exc

    ns = {
        "saml": "urn:oasis:names:tc:SAML:2.0:assertion",
        "samlp": "urn:oasis:names:tc:SAML:2.0:protocol",
    }
    # Try NameID first
    name_id_el = root.find(".//saml:NameID", ns)
    email = name_id_el.text if name_id_el is not None else None

    if not email:
        # Try Attribute/@Name=email
        for attr in root.findall(".//saml:Attribute", ns):
            attr_name = attr.get("Name", "").lower()
            if "email" in attr_name:
                val = attr.find("saml:AttributeValue", ns)
                if val is not None:
                    email = val.text
                    break

    if not email:
        raise ValueError("Cannot extract email from SAML response")

    return {"email": email, "name": None}


def _extract_attr(attrs: dict, keys: list[str]) -> Optional[str]:
    for key in keys:
        for attr_key, values in attrs.items():
            if key.lower() in attr_key.lower() and values:
                return values[0]
    return None


# ---------------------------------------------------------------------------
# OIDC helpers
# ---------------------------------------------------------------------------


def build_oidc_auth_url(config: SSOConfig, state: str, nonce: str) -> str:
    """Build the OIDC authorization redirect URL.

    Uses authlib when available; falls back to manual URL construction for
    testing environments that don't have authlib installed.
    """
    redirect_uri = f"{settings.OAV_PUBLIC_URL}/api/v1/auth/sso/callback/oidc"
    params = {
        "response_type": "code",
        "client_id": config.client_id,
        "redirect_uri": redirect_uri,
        "scope": "openid email profile",
        "state": state,
        "nonce": nonce,
    }
    # Build authorization URL from issuer's authorization endpoint
    auth_endpoint = config.sso_url or f"{config.issuer}/authorize"
    return f"{auth_endpoint}?{urlencode(params)}"


async def exchange_oidc_code(
    config: SSOConfig, code: str
) -> dict:
    """Exchange an OIDC authorization code for tokens and return user info.

    Returns:
        dict with keys: email (str), name (Optional[str])

    Raises:
        ValueError: on token exchange failure or missing email claim.
    """
    import httpx

    redirect_uri = f"{settings.OAV_PUBLIC_URL}/api/v1/auth/sso/callback/oidc"
    token_endpoint = f"{config.issuer}/token"

    client_secret = ""
    if config.client_secret_encrypted:
        try:
            client_secret = decrypt_api_key(config.client_secret_encrypted)
        except Exception:
            logger.warning("sso.oidc.decrypt_secret_failed", workspace_id=config.workspace_id)

    if _authlib_available():
        from authlib.integrations.httpx_client import AsyncOAuth2Client

        async with AsyncOAuth2Client(
            client_id=config.client_id,
            client_secret=client_secret,
            redirect_uri=redirect_uri,
        ) as oauth_client:
            token = await oauth_client.fetch_token(token_endpoint, code=code)
            id_token_claims = token.get("userinfo") or {}
            email = id_token_claims.get("email")
            name = id_token_claims.get("name")
            if not email:
                # Try userinfo endpoint
                userinfo_url = f"{config.issuer}/userinfo"
                try:
                    resp = await oauth_client.get(userinfo_url)
                    resp.raise_for_status()
                    userinfo = resp.json()
                    email = userinfo.get("email")
                    name = name or userinfo.get("name")
                except Exception as exc:
                    logger.warning("sso.oidc.userinfo_failed", error=str(exc))
            if not email:
                raise ValueError("OIDC token response does not contain email claim")
            return {"email": email, "name": name}

    # Fallback: raw httpx token exchange
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            token_endpoint,
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": redirect_uri,
                "client_id": config.client_id,
                "client_secret": client_secret,
            },
        )
        resp.raise_for_status()
        token_data = resp.json()

    # Decode JWT id_token without verification (claims only for email)
    import base64
    import json

    id_token = token_data.get("id_token", "")
    parts = id_token.split(".")
    if len(parts) >= 2:
        padding = 4 - len(parts[1]) % 4
        claims_json = base64.urlsafe_b64decode(parts[1] + "=" * padding)
        claims = json.loads(claims_json)
        email = claims.get("email")
        name = claims.get("name")
        if email:
            return {"email": email, "name": name}

    raise ValueError("Cannot extract email from OIDC id_token")


# ---------------------------------------------------------------------------
# User provisioning
# ---------------------------------------------------------------------------


async def auto_provision_user(
    db: AsyncSession,
    email: str,
    name: Optional[str],
    workspace_id: str,
    provider_type: str,
    external_id: str,
) -> tuple[User, str]:
    """Return (user, workspace_id) — creating user + workspace member on first login.

    If user already exists, ensures workspace membership exists.
    Records an SSOSession for the login.
    """
    user = await db.scalar(select(User).where(User.email == email))
    if not user:
        # Auto-provision: create user with a random unusable password
        user = User(
            email=email,
            display_name=name,
            hashed_password=hash_password(secrets.token_urlsafe(32)),
        )
        db.add(user)
        await db.flush()
        logger.info("sso.user_provisioned", email=email, provider=provider_type)

    # Ensure workspace membership
    member = await db.scalar(
        select(WorkspaceMember).where(
            WorkspaceMember.user_id == user.id,
            WorkspaceMember.workspace_id == workspace_id,
        )
    )
    if not member:
        member = WorkspaceMember(
            workspace_id=workspace_id,
            user_id=user.id,
            role="member",
        )
        db.add(member)
        logger.info(
            "sso.workspace_member_added",
            user_id=user.id,
            workspace_id=workspace_id,
        )

    # Record SSO session
    sso_session = SSOSession(
        user_id=user.id,
        provider_type=provider_type,
        external_id=external_id,
    )
    db.add(sso_session)
    await db.commit()
    await db.refresh(user)

    return user, workspace_id


def issue_tokens(user_id: str, workspace_id: str) -> dict:
    """Issue access + refresh JWT pair (same as regular login)."""
    access_token = create_access_token({"sub": user_id, "workspace_id": workspace_id})
    refresh_expires_minutes = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60
    refresh_token = create_access_token(
        data={
            "sub": user_id,
            "workspace_id": workspace_id,
            "type": "refresh",
        },
        expires_delta_minutes=refresh_expires_minutes,
    )
    return {"access_token": access_token, "refresh_token": refresh_token, "workspace_id": workspace_id}
