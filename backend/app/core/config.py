from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "SportFolio Backend"
    environment: str = "development"
    mongo_uri: str = "mongodb://localhost:27017"
    mongo_db: str = "sportfolio"

    jwt_secret: str = "CHANGE_ME"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24

    rate_limit: str = "100/minute"

    price_smoothing_eta: float = 0.6

    # Liquidity and platform shares
    investor_income_share: float = 0.10
    liquidity_income_share: float = 0.03
    platform_income_share: float = 0.02


@lru_cache
def get_settings() -> Settings:
    return Settings()
