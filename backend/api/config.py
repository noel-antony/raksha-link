"""
RakshaLink API - Configuration

Loads environment variables via python-dotenv and exposes them as typed settings.
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Application settings loaded from environment variables."""

    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "")
    FIREBASE_CREDENTIALS: str = os.getenv("FIREBASE_CREDENTIALS", "")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")


settings = Settings()
