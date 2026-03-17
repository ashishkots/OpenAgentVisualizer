import pytest
from app.core.security import hash_password, verify_password, create_access_token, decode_token
from jose import JWTError


def test_password_round_trip():
    hashed = hash_password("mysecret")
    assert verify_password("mysecret", hashed)
    assert not verify_password("wrong", hashed)


def test_jwt_round_trip():
    token = create_access_token({"sub": "user-123", "workspace_id": "ws-abc"})
    payload = decode_token(token)
    assert payload["sub"] == "user-123"
    assert payload["workspace_id"] == "ws-abc"


def test_expired_token_raises():
    token = create_access_token({"sub": "x"}, expires_delta_minutes=-1)
    with pytest.raises(JWTError):
        decode_token(token)
