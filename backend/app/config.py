from pydantic_settings import BaseSettings
from pydantic import field_validator


class Settings(BaseSettings):
    database_url: str
    secret_key: str
    openai_api_key: str
    upload_dir: str = "/app/uploads"
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 24

    @field_validator("database_url")
    @classmethod
    def fix_db_scheme(cls, v: str) -> str:
        # Railway provides postgresql://, asyncpg requires postgresql+asyncpg://
        if v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    class Config:
        env_file = ".env"


settings = Settings()
