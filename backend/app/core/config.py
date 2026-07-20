import os
from dotenv import load_dotenv

# Load .env file explicitly
load_dotenv()

raw_db_url = os.getenv("DATABASE_URL", "sqlite:///./billsphere.db")
if raw_db_url and raw_db_url.startswith("postgres://"):
    raw_db_url = raw_db_url.replace("postgres://", "postgresql://", 1)

class Settings:
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-for-dev-only")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    SQLALCHEMY_DATABASE_URI: str = raw_db_url

settings = Settings()

# Debug: print which DB is being used on startup
print(f"Database: {settings.SQLALCHEMY_DATABASE_URI[:50]}...")