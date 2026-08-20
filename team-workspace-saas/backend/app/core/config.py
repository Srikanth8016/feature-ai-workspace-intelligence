import os
from pydantic_settings import BaseSettings

# Dynamically search upwards for a .env file to ensure correct load in nested contexts
current_dir = os.path.dirname(os.path.abspath(__file__))
loaded_env = None
while current_dir and current_dir != os.path.dirname(current_dir):
    potential_env = os.path.join(current_dir, ".env")
    if os.path.exists(potential_env):
        try:
            from dotenv import load_dotenv
            load_dotenv(potential_env)
            loaded_env = potential_env
        except ImportError:
            pass
        break
    current_dir = os.path.dirname(current_dir)

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://neondb_owner:npg_c4DwvM7RpZuF@ep-blue-dust-aqgaltmx-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    )
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")

    class Config:
        env_file = loaded_env or ".env"

settings = Settings()
