from datetime import datetime, timedelta, timezone
import warnings
from typing import Optional
from passlib.context import CryptContext
from jose import jwt, JWTError
from app.core.config import settings

# Check for weak default secret at module load time
if settings.SECRET_KEY == "changeme-in-production":
    warnings.warn(
        "SECRET_KEY is set to the insecure default. Set a strong SECRET_KEY environment variable before deploying.",
        UserWarning,
        stacklevel=1,
    )

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plaintext password against a hashed password."""
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta_minutes: Optional[int] = None) -> str:
    """
    Create a JWT access token.

    Args:
        data: Dictionary of claims to include in the token
        expires_delta_minutes: Token expiration time in minutes.
                              If None, uses settings.ACCESS_TOKEN_EXPIRE_MINUTES

    Returns:
        Encoded JWT token string
    """
    if "exp" in data:
        warnings.warn(
            "create_access_token: 'exp' key in data will be overwritten by the generated expiry.",
            UserWarning,
            stacklevel=2,
        )
    minutes = expires_delta_minutes if expires_delta_minutes is not None else settings.ACCESS_TOKEN_EXPIRE_MINUTES
    expire = datetime.now(timezone.utc) + timedelta(minutes=minutes)
    return jwt.encode({**data, "exp": expire}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    """
    Decode and validate a JWT access token.

    Args:
        token: JWT token string to decode

    Returns:
        Dictionary of decoded claims

    Raises:
        JWTError: If token is invalid, expired, or has wrong signature
    """
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
