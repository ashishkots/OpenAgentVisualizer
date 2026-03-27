"""Shared circuit breaker, base integration client, and encryption helpers.

ADR-007: All cross-product integrations use a shared circuit breaker and consistent
         service pattern.
ADR-008: Integration configuration lives in both environment variables and a database
         table. DB config takes precedence; API keys are Fernet-encrypted at rest.
"""

import base64
import enum
import hashlib
import logging
import time
from typing import Any, Callable

import httpx
from cryptography.fernet import Fernet

from app.core.config import settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Circuit Breaker
# ---------------------------------------------------------------------------


class CircuitState(enum.Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


class CircuitBreakerError(Exception):
    """Raised when a call is attempted while the circuit is OPEN."""


class CircuitBreaker:
    """In-memory circuit breaker.

    State transitions:
        CLOSED  -> OPEN      when consecutive failures >= failure_threshold
        OPEN    -> HALF_OPEN after recovery_timeout seconds have elapsed
        HALF_OPEN -> CLOSED  after success_threshold successful calls
        HALF_OPEN -> OPEN    on any failure

    Args:
        name: Human-readable name for log messages.
        failure_threshold: Consecutive failures before opening. Default 3.
        recovery_timeout: Seconds to wait in OPEN before trying again. Default 60.
        success_threshold: Successes in HALF_OPEN state before closing. Default 1.
    """

    def __init__(
        self,
        name: str,
        failure_threshold: int = 3,
        recovery_timeout: int = 60,
        success_threshold: int = 1,
    ) -> None:
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.success_threshold = success_threshold

        self.state = CircuitState.CLOSED
        self.failure_count: int = 0
        self.success_count: int = 0
        self.last_failure_time: float = 0.0

    @property
    def is_available(self) -> bool:
        """Return True if a call should be attempted."""
        if self.state == CircuitState.CLOSED:
            return True
        if self.state == CircuitState.OPEN:
            elapsed = time.monotonic() - self.last_failure_time
            if elapsed >= self.recovery_timeout:
                self.state = CircuitState.HALF_OPEN
                self.success_count = 0
                logger.info("Circuit %s: OPEN -> HALF_OPEN after %.1fs", self.name, elapsed)
                return True
            return False
        # HALF_OPEN: allow one probe call
        return True

    def record_success(self) -> None:
        """Record a successful call."""
        if self.state == CircuitState.HALF_OPEN:
            self.success_count += 1
            if self.success_count >= self.success_threshold:
                self.state = CircuitState.CLOSED
                self.failure_count = 0
                logger.info("Circuit %s: HALF_OPEN -> CLOSED", self.name)
        else:
            # Reset failure count on any success while CLOSED
            self.failure_count = 0

    def record_failure(self) -> None:
        """Record a failed call."""
        self.failure_count += 1
        self.last_failure_time = time.monotonic()
        if self.state == CircuitState.HALF_OPEN:
            self.state = CircuitState.OPEN
            logger.warning("Circuit %s: HALF_OPEN -> OPEN", self.name)
        elif self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN
            logger.warning(
                "Circuit %s: CLOSED -> OPEN (failures=%d)", self.name, self.failure_count
            )

    async def call(self, func: Callable[..., Any], *args: Any, **kwargs: Any) -> Any:
        """Execute func through the circuit breaker.

        Raises:
            CircuitBreakerError: If the circuit is currently OPEN.
        """
        if not self.is_available:
            raise CircuitBreakerError(f"Circuit '{self.name}' is OPEN — call rejected")
        try:
            result = await func(*args, **kwargs)
            self.record_success()
            return result
        except Exception:
            self.record_failure()
            raise


# ---------------------------------------------------------------------------
# Fernet encryption helpers
# ---------------------------------------------------------------------------


def _derive_fernet_key(secret: str) -> bytes:
    """Derive a 32-byte URL-safe base64-encoded key from the app SECRET_KEY."""
    digest = hashlib.sha256(secret.encode()).digest()
    return base64.urlsafe_b64encode(digest)


def encrypt_api_key(plain_key: str) -> str:
    """Encrypt a plaintext integration API key for at-rest storage."""
    fernet = Fernet(_derive_fernet_key(settings.SECRET_KEY))
    return fernet.encrypt(plain_key.encode()).decode()


def decrypt_api_key(encrypted_key: str) -> str:
    """Decrypt a stored integration API key.

    Raises:
        cryptography.fernet.InvalidToken: If SECRET_KEY has changed or data is corrupt.
    """
    fernet = Fernet(_derive_fernet_key(settings.SECRET_KEY))
    return fernet.decrypt(encrypted_key.encode()).decode()


# ---------------------------------------------------------------------------
# Base Integration Client
# ---------------------------------------------------------------------------


class BaseIntegrationClient:
    """Base HTTP client for cross-product Open* Suite integrations.

    Subclasses must set:
        product_name (str): Canonical product identifier, e.g. "opentrace".
        env_base_url_key (str): Settings attribute for the default base URL.
        env_api_key_key (str): Settings attribute for the default API key.

    Config resolution (ADR-008):
        1. If a DB record exists for (workspace_id, product_name), use it.
        2. Otherwise fall back to environment variables via Settings.
    """

    product_name: str = ""
    env_base_url_key: str = ""
    env_api_key_key: str = ""

    def __init__(self) -> None:
        self.circuit = CircuitBreaker(name=self.product_name)
        self._client = httpx.AsyncClient(timeout=10.0)

    async def _get_config(self, workspace_id: str, db: Any = None) -> tuple[str, str]:
        """Resolve (base_url, api_key) for a workspace.

        DB configuration takes precedence over environment variables.
        Returns empty strings when no configuration is found.
        """
        if db is not None:
            from sqlalchemy import select as sa_select

            from app.models.integration import IntegrationConfig

            config = await db.scalar(
                sa_select(IntegrationConfig).where(
                    IntegrationConfig.workspace_id == workspace_id,
                    IntegrationConfig.product_name == self.product_name,
                    IntegrationConfig.enabled == True,  # noqa: E712
                )
            )
            if config:
                return config.base_url, decrypt_api_key(config.api_key_encrypted)

        base_url: str = getattr(settings, self.env_base_url_key, "") or ""
        api_key: str = getattr(settings, self.env_api_key_key, "") or ""
        return base_url, api_key

    async def _request(
        self,
        method: str,
        path: str,
        workspace_id: str,
        db: Any = None,
        **kwargs: Any,
    ) -> Any:
        """Make an authenticated HTTP request through the circuit breaker.

        Raises:
            ValueError: If no base URL is configured for the workspace.
            CircuitBreakerError: If the circuit is currently OPEN.
            httpx.HTTPStatusError: On non-2xx HTTP responses.
        """
        from app.core.metrics import oav_integration_requests_total

        base_url, api_key = await self._get_config(workspace_id, db)
        if not base_url:
            raise ValueError(
                f"{self.product_name} is not configured for workspace {workspace_id}"
            )

        headers: dict[str, str] = kwargs.pop("headers", {})
        if api_key:
            headers["X-API-Key"] = api_key

        async def _do_request() -> Any:
            resp = await self._client.request(
                method,
                f"{base_url.rstrip('/')}{path}",
                headers=headers,
                **kwargs,
            )
            resp.raise_for_status()
            return resp.json()

        try:
            result = await self.circuit.call(_do_request)
            oav_integration_requests_total.labels(
                integration=self.product_name, status="success"
            ).inc()
            return result
        except CircuitBreakerError:
            oav_integration_requests_total.labels(
                integration=self.product_name, status="circuit_open"
            ).inc()
            raise
        except httpx.HTTPStatusError as exc:
            oav_integration_requests_total.labels(
                integration=self.product_name, status=f"http_{exc.response.status_code}"
            ).inc()
            raise
        except Exception:
            oav_integration_requests_total.labels(
                integration=self.product_name, status="error"
            ).inc()
            raise

    async def health_check(self, workspace_id: str, db: Any = None) -> dict[str, Any]:
        """Ping the integration and return a health dict.

        Returns:
            dict with keys: status, latency_ms, error
        """
        import time as _time

        if not self.circuit.is_available:
            return {
                "status": "circuit_open",
                "latency_ms": None,
                "error": "Circuit breaker is OPEN",
            }

        base_url, _ = await self._get_config(workspace_id, db)
        if not base_url:
            return {
                "status": "not_configured",
                "latency_ms": None,
                "error": "No base URL configured",
            }

        start = _time.monotonic()
        try:
            await self._request("GET", "/api/health", workspace_id=workspace_id, db=db)
            latency_ms = (_time.monotonic() - start) * 1000
            return {"status": "connected", "latency_ms": round(latency_ms, 2), "error": None}
        except CircuitBreakerError as exc:
            return {"status": "circuit_open", "latency_ms": None, "error": str(exc)}
        except Exception as exc:
            latency_ms = (_time.monotonic() - start) * 1000
            return {
                "status": "disconnected",
                "latency_ms": round(latency_ms, 2),
                "error": str(exc),
            }
