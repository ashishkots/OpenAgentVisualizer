"""SSO router: SAML 2.0 + OIDC login flows and admin config endpoints."""
from __future__ import annotations

import secrets
import logging
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Form, Response
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.integrations import encrypt_api_key
from app.core.config import settings
from app.models.sso import SSOConfig
from app.models.user import User, Workspace
from app.schemas.sso import SSOConfigCreate, SSOConfigRead, SSOTestResult
from app.services import sso_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["sso"])

_OIDC_STATE_STORE: dict[str, str] = {}  # state -> workspace_id (in-memory; use Redis in prod)


# ---------------------------------------------------------------------------
# SSO login initiation
# ---------------------------------------------------------------------------


@router.get(
    "/api/v1/auth/sso/{workspace_slug}/login",
    summary="Initiate SSO login for a workspace",
)
async def sso_login(
    workspace_slug: str,
    db: AsyncSession = Depends(get_db),
) -> RedirectResponse:
    """Detect provider type and redirect to IdP."""
    workspace = await db.scalar(
        select(Workspace).where(Workspace.slug == workspace_slug)
    )
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    config = await db.scalar(
        select(SSOConfig).where(
            SSOConfig.workspace_id == workspace.id,
            SSOConfig.enabled == True,  # noqa: E712
        )
    )
    if not config:
        raise HTTPException(status_code=404, detail="SSO not configured for this workspace")

    acs_url = f"{settings.OAV_PUBLIC_URL}/api/v1/auth/sso/callback/saml"

    if config.provider_type == "saml":
        redirect_url = sso_service.build_saml_auth_request(config, acs_url)
        return RedirectResponse(url=redirect_url)

    # OIDC
    state = secrets.token_urlsafe(32)
    nonce = secrets.token_urlsafe(32)
    _OIDC_STATE_STORE[state] = workspace.id
    redirect_url = sso_service.build_oidc_auth_url(config, state=state, nonce=nonce)
    return RedirectResponse(url=redirect_url)


# ---------------------------------------------------------------------------
# SAML ACS callback
# ---------------------------------------------------------------------------


@router.post(
    "/api/v1/auth/sso/callback/saml",
    summary="SAML Assertion Consumer Service (ACS) endpoint",
)
async def saml_callback(
    SAMLResponse: str = Form(...),
    RelayState: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """Validate SAML assertion and issue JWT tokens."""
    # RelayState holds workspace_id when set during login initiation.
    # Find config by workspace_id or fall back to first enabled SAML config.
    config: Optional[SSOConfig] = None
    if RelayState:
        config = await db.scalar(
            select(SSOConfig).where(
                SSOConfig.workspace_id == RelayState,
                SSOConfig.provider_type == "saml",
                SSOConfig.enabled == True,  # noqa: E712
            )
        )

    if config is None:
        config = await db.scalar(
            select(SSOConfig).where(
                SSOConfig.provider_type == "saml",
                SSOConfig.enabled == True,  # noqa: E712
            )
        )

    if config is None:
        raise HTTPException(status_code=400, detail="No enabled SAML configuration found")

    acs_url = f"{settings.OAV_PUBLIC_URL}/api/v1/auth/sso/callback/saml"
    try:
        user_attrs = sso_service.validate_saml_response(config, acs_url, SAMLResponse)
    except ValueError as exc:
        logger.warning("sso.saml.validation_failed", error=str(exc))
        raise HTTPException(status_code=400, detail=str(exc))

    email = user_attrs["email"]
    name = user_attrs.get("name")

    user, workspace_id = await sso_service.auto_provision_user(
        db=db,
        email=email,
        name=name,
        workspace_id=config.workspace_id,
        provider_type="saml",
        external_id=email,
    )

    tokens = sso_service.issue_tokens(user.id, workspace_id)
    response = JSONResponse(content={
        "access_token": tokens["access_token"],
        "token_type": "bearer",
        "workspace_id": workspace_id,
    })
    response.set_cookie(
        key="refresh_token",
        value=tokens["refresh_token"],
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
    )
    return response


# ---------------------------------------------------------------------------
# OIDC callback
# ---------------------------------------------------------------------------


@router.get(
    "/api/v1/auth/sso/callback/oidc",
    summary="OIDC authorization code callback",
)
async def oidc_callback(
    code: str,
    state: str,
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """Exchange OIDC code for tokens and issue JWT."""
    workspace_id = _OIDC_STATE_STORE.pop(state, None)
    if not workspace_id:
        raise HTTPException(status_code=400, detail="Invalid or expired OIDC state parameter")

    config = await db.scalar(
        select(SSOConfig).where(
            SSOConfig.workspace_id == workspace_id,
            SSOConfig.provider_type == "oidc",
            SSOConfig.enabled == True,  # noqa: E712
        )
    )
    if not config:
        raise HTTPException(status_code=400, detail="No enabled OIDC configuration found")

    try:
        user_attrs = await sso_service.exchange_oidc_code(config, code)
    except Exception as exc:
        logger.warning("sso.oidc.exchange_failed", error=str(exc))
        raise HTTPException(status_code=400, detail=f"OIDC code exchange failed: {exc}")

    email = user_attrs["email"]
    name = user_attrs.get("name")

    user, workspace_id = await sso_service.auto_provision_user(
        db=db,
        email=email,
        name=name,
        workspace_id=workspace_id,
        provider_type="oidc",
        external_id=email,
    )

    tokens = sso_service.issue_tokens(user.id, workspace_id)
    response = JSONResponse(content={
        "access_token": tokens["access_token"],
        "token_type": "bearer",
        "workspace_id": workspace_id,
    })
    response.set_cookie(
        key="refresh_token",
        value=tokens["refresh_token"],
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
    )
    return response


# ---------------------------------------------------------------------------
# Admin config endpoints (require auth)
# ---------------------------------------------------------------------------


@router.get(
    "/api/v1/sso/config",
    response_model=SSOConfigRead,
    summary="Get SSO configuration for current workspace",
)
async def get_sso_config(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SSOConfig:
    from app.core.dependencies import get_workspace_id as _get_workspace_id
    workspace_id = await _get_workspace_id(current_user, db)
    config = await db.scalar(
        select(SSOConfig).where(SSOConfig.workspace_id == workspace_id)
    )
    if not config:
        raise HTTPException(status_code=404, detail="No SSO configuration found")
    return config


@router.put(
    "/api/v1/sso/config",
    response_model=SSOConfigRead,
    summary="Create or update SSO configuration",
)
async def upsert_sso_config(
    body: SSOConfigCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SSOConfig:
    from app.core.dependencies import get_workspace_id as _get_workspace_id
    workspace_id = await _get_workspace_id(current_user, db)

    config = await db.scalar(
        select(SSOConfig).where(SSOConfig.workspace_id == workspace_id)
    )
    if config is None:
        config = SSOConfig(workspace_id=workspace_id)
        db.add(config)

    config.provider_type = body.provider_type
    config.entity_id = body.entity_id
    config.sso_url = body.sso_url
    config.certificate = body.certificate
    config.metadata_url = body.metadata_url
    config.client_id = body.client_id
    config.issuer = body.issuer
    config.enabled = body.enabled

    if body.client_secret:
        config.client_secret_encrypted = encrypt_api_key(body.client_secret)

    await db.commit()
    await db.refresh(config)
    return config


@router.delete(
    "/api/v1/sso/config",
    status_code=204,
    summary="Delete SSO configuration",
    response_class=Response,
)
async def delete_sso_config(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.core.dependencies import get_workspace_id as _get_workspace_id
    workspace_id = await _get_workspace_id(current_user, db)
    config = await db.scalar(
        select(SSOConfig).where(SSOConfig.workspace_id == workspace_id)
    )
    if not config:
        raise HTTPException(status_code=404, detail="No SSO configuration found")
    await db.delete(config)
    await db.commit()


@router.post(
    "/api/v1/sso/config/test",
    response_model=SSOTestResult,
    summary="Test SSO configuration connectivity",
)
async def test_sso_config(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SSOTestResult:
    from app.core.dependencies import get_workspace_id as _get_workspace_id
    workspace_id = await _get_workspace_id(current_user, db)
    config = await db.scalar(
        select(SSOConfig).where(SSOConfig.workspace_id == workspace_id)
    )
    if not config:
        raise HTTPException(status_code=404, detail="No SSO configuration found")

    if config.provider_type == "saml":
        # Validate certificate is parseable PEM
        if config.certificate:
            try:
                from cryptography import x509
                from cryptography.hazmat.backends import default_backend
                import base64

                cert_pem = config.certificate.strip()
                if not cert_pem.startswith("-----BEGIN"):
                    cert_pem = (
                        "-----BEGIN CERTIFICATE-----\n"
                        + cert_pem
                        + "\n-----END CERTIFICATE-----"
                    )
                x509.load_pem_x509_certificate(cert_pem.encode(), default_backend())
            except Exception as exc:
                return SSOTestResult(success=False, message=f"Invalid certificate: {exc}")

        # Check metadata URL reachability
        if config.metadata_url:
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    resp = await client.get(config.metadata_url)
                    resp.raise_for_status()
                return SSOTestResult(success=True, message="SAML metadata URL is reachable")
            except Exception as exc:
                return SSOTestResult(success=False, message=f"Metadata URL unreachable: {exc}")

        return SSOTestResult(success=True, message="SAML configuration looks valid")

    # OIDC: check issuer discovery endpoint
    if config.issuer:
        discovery_url = f"{config.issuer.rstrip('/')}/.well-known/openid-configuration"
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(discovery_url)
                resp.raise_for_status()
            return SSOTestResult(success=True, message="OIDC discovery endpoint is reachable")
        except Exception as exc:
            return SSOTestResult(success=False, message=f"OIDC discovery unreachable: {exc}")

    return SSOTestResult(success=False, message="Missing issuer URL for OIDC provider")
