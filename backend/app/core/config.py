from pydantic_settings import BaseSettings
from typing import List
from pathlib import Path

# 프로젝트 루트: backend/app/core/config.py → 3단계 위
_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    APP_ENV: str = "development"
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]

    # ── Database (개별 항목으로 관리) ──────────────────────
    DB_HOST: str = "mysql"
    DB_PORT: int = 3306
    DB_USER: str = "afbuser"
    DB_PASSWORD: str = "afbpassword"
    DB_NAME: str = "afb_db"

    @property
    def DATABASE_URL(self) -> str:
        return f"mysql+aiomysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    REDIS_URL: str = "redis://redis:6379/0"
    CELERY_BROKER_URL: str = "redis://redis:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/0"

    MINIO_ENDPOINT: str = "minio:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET_PHOTOS: str = "afb-photos"
    MINIO_BUCKET_VIDEOS: str = "afb-videos"
    MINIO_SECURE: bool = False

    KAKAO_CLIENT_ID: str = ""
    KAKAO_REDIRECT_URI: str = "http://localhost:3000/auth/callback/kakao"

    NAVER_CLIENT_ID: str = ""
    NAVER_CLIENT_SECRET: str = ""
    NAVER_REDIRECT_URI: str = "http://localhost:3000/auth/callback/naver"

    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:3000/auth/callback/google"

    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL: str = "claude-haiku-4-5-20251001"

    class Config:
        env_file = str(_ROOT / ".env")
        case_sensitive = True
        extra = "ignore"


settings = Settings()
