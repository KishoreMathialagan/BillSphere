import os
from dotenv import load_dotenv

# Load .env file explicitly
load_dotenv()

class Settings:
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-for-dev-only")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    SQLALCHEMY_DATABASE_URI: str = os.getenv("DATABASE_URL", "sqlite:///./billsphere.db")

settings = Settings()

# Debug: print which DB is being used on startup
print(f"🔌 Database: {settings.SQLALCHEMY_DATABASE_URI[:50]}...")