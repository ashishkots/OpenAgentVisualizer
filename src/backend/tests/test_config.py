def test_config_loads_database_url():
    from app.core.config import settings
    assert settings.DATABASE_URL.startswith("postgresql+asyncpg://")


def test_config_loads_redis_url():
    from app.core.config import settings
    assert settings.REDIS_URL.startswith("redis://")
