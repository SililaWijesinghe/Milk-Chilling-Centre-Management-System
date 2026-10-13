"""Application settings, loaded from environment variables / backend/.env."""
from functools import lru_cache
from pathlib import Path

from pydantic import SecretStr, computed_field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/.env, resolved relative to this file so it works from any CWD.
_ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "MCCMS API"
    app_version: str = "0.1.0"
    api_prefix: str = "/api/v1"

    # Supabase
    supabase_url: str
    supabase_publishable_key: SecretStr
    supabase_secret_key: SecretStr = SecretStr("")  # backend-only, never expose
    supabase_jwks_url: str = ""
    supabase_jwt_audience: str = "authenticated"

    # Database (Supabase Postgres connection string, or local Postgres)
    database_url: str = "postgresql://postgres:postgres@localhost:5432/mccms"
    db_pool_size: int = 5
    db_max_overflow: int = 10
    db_connect_timeout: int = 15

    # CORS: comma-separated list of allowed frontend origins
    cors_origins: str = "http://localhost:5173"

    # Groq LLM
    groq_api_key: SecretStr = SecretStr("")
    groq_model: str = "openai/gpt-oss-120b"

    @model_validator(mode="after")
    def _normalise(self) -> "Settings":
        self.supabase_url = self.supabase_url.rstrip("/")
        # Force the installed psycopg2 driver (SQLAlchemy 2.1 defaults to psycopg3).
        for prefix in ("postgres://", "postgresql://"):
            if self.database_url.startswith(prefix):
                self.database_url = "postgresql+psycopg2://" + self.database_url[len(prefix):]
                break
        if not self.supabase_jwks_url:
            self.supabase_jwks_url = f"{self.supabase_url}/auth/v1/.well-known/jwks.json"
        return self

    @computed_field  # type: ignore[prop-decorator]
    @property
    def supabase_issuer(self) -> str:
        return f"{self.supabase_url}/auth/v1"

    @computed_field  # type: ignore[prop-decorator]
    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
