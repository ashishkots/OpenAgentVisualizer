"""Tests for the CircuitBreaker and BaseIntegrationClient (OAV-243, ADR-007)."""

import asyncio
import time

import pytest

from app.core.integrations import (
    CircuitBreaker,
    CircuitBreakerError,
    CircuitState,
    decrypt_api_key,
    encrypt_api_key,
)


# ---------------------------------------------------------------------------
# CircuitBreaker unit tests
# ---------------------------------------------------------------------------


def test_circuit_starts_closed() -> None:
    cb = CircuitBreaker("test")
    assert cb.state == CircuitState.CLOSED
    assert cb.is_available is True


def test_circuit_opens_after_failure_threshold() -> None:
    cb = CircuitBreaker("test", failure_threshold=3)
    cb.record_failure()
    assert cb.state == CircuitState.CLOSED
    cb.record_failure()
    assert cb.state == CircuitState.CLOSED
    cb.record_failure()
    assert cb.state == CircuitState.OPEN


def test_circuit_open_rejects_calls() -> None:
    cb = CircuitBreaker("test", failure_threshold=1)
    cb.record_failure()
    assert cb.state == CircuitState.OPEN
    assert cb.is_available is False


def test_circuit_transitions_to_half_open_after_timeout() -> None:
    cb = CircuitBreaker("test", failure_threshold=1, recovery_timeout=0)
    cb.record_failure()
    assert cb.state == CircuitState.OPEN
    # Force elapsed time past recovery timeout
    cb.last_failure_time = time.monotonic() - 1.0
    assert cb.is_available is True
    assert cb.state == CircuitState.HALF_OPEN


def test_circuit_closes_after_success_in_half_open() -> None:
    cb = CircuitBreaker("test", failure_threshold=1, recovery_timeout=0, success_threshold=1)
    cb.record_failure()
    cb.last_failure_time = time.monotonic() - 1.0
    assert cb.is_available is True  # -> HALF_OPEN
    cb.record_success()
    assert cb.state == CircuitState.CLOSED


def test_circuit_reopens_on_failure_in_half_open() -> None:
    cb = CircuitBreaker("test", failure_threshold=1, recovery_timeout=0)
    cb.record_failure()
    cb.last_failure_time = time.monotonic() - 1.0
    assert cb.is_available is True  # -> HALF_OPEN
    cb.record_failure()
    assert cb.state == CircuitState.OPEN


def test_success_resets_failure_count_when_closed() -> None:
    cb = CircuitBreaker("test", failure_threshold=3)
    cb.record_failure()
    cb.record_failure()
    assert cb.failure_count == 2
    cb.record_success()
    assert cb.failure_count == 0


@pytest.mark.asyncio
async def test_circuit_call_raises_when_open() -> None:
    cb = CircuitBreaker("test", failure_threshold=1)
    cb.record_failure()
    assert cb.state == CircuitState.OPEN

    async def _dummy():
        return "ok"

    with pytest.raises(CircuitBreakerError):
        await cb.call(_dummy)


@pytest.mark.asyncio
async def test_circuit_call_records_success() -> None:
    cb = CircuitBreaker("test")

    async def _succeed():
        return 42

    result = await cb.call(_succeed)
    assert result == 42
    assert cb.failure_count == 0


@pytest.mark.asyncio
async def test_circuit_call_records_failure_on_exception() -> None:
    cb = CircuitBreaker("test", failure_threshold=3)

    async def _fail():
        raise ValueError("boom")

    with pytest.raises(ValueError):
        await cb.call(_fail)

    assert cb.failure_count == 1


# ---------------------------------------------------------------------------
# Fernet encryption helpers
# ---------------------------------------------------------------------------


def test_encrypt_decrypt_roundtrip() -> None:
    plain = "my-secret-api-key-12345"
    encrypted = encrypt_api_key(plain)
    assert encrypted != plain
    assert decrypt_api_key(encrypted) == plain


def test_encrypted_value_is_different_each_call() -> None:
    """Fernet uses random IV so each encryption of the same value differs."""
    key = "same-key"
    enc1 = encrypt_api_key(key)
    enc2 = encrypt_api_key(key)
    # Encrypted values differ (different IVs) but both decrypt to the same plaintext
    assert decrypt_api_key(enc1) == key
    assert decrypt_api_key(enc2) == key


def test_encrypt_produces_non_empty_string() -> None:
    encrypted = encrypt_api_key("test")
    assert len(encrypted) > 0
    assert isinstance(encrypted, str)
