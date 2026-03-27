from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    APP_NAME: str = "OpenAgentVisualizer"
    SECRET_KEY: str = "changeme-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    ALGORITHM: str = "HS256"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://oav:oav@localhost:5432/oav"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # OTLP
    OTLP_GRPC_PORT: int = 4317
    OTLP_HTTP_PORT: int = 4318

    # Default seed user
    SEED_EMAIL: str = "kotsai@gmail.com"
    SEED_PASSWORD: str = "kots@123"

    # UE5 Pixel Streaming
    UE5_ENABLED: bool = False
    UE5_SIGNALING_URL: str = "ws://localhost:8888"

    # Cross-product integration defaults (per-workspace DB config takes precedence)
    OPENTRACE_BASE_URL: str = ""
    OPENTRACE_API_KEY: str = ""
    OPENMESH_BASE_URL: str = ""
    OPENMESH_API_KEY: str = ""
    OPENMIND_BASE_URL: str = ""
    OPENMIND_API_KEY: str = ""
    OPENSHIELD_BASE_URL: str = ""
    OPENSHIELD_API_KEY: str = ""

    model_config = {"env_file": ".env", "case_sensitive": True}


settings = Settings()

import warnings as _warnings
if settings.SEED_PASSWORD == "kots@123":
    _warnings.warn(
        "SEED_PASSWORD is set to the insecure default. Set a strong SEED_PASSWORD environment variable before deploying.",
        UserWarning,
        stacklevel=1,
    )
