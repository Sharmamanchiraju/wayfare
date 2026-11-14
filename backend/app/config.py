from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Travel Agent"
    VERSION: str = "1.0.0"
    
    # Database
    DATABASE_URL: str
    
    # LLM
    GROQ_API_KEY: str
    MODEL_NAME: str = "openai/gpt-oss-120b"
    EXTRACTION_MODEL_NAME: str = "openai/gpt-oss-120b"
    CONVERSATIONAL_MODEL_NAME: str = "openai/gpt-oss-20b"
    TEMPERATURE: float = 0.3
    
    model_config = SettingsConfigDict(env_file="../.env", env_file_encoding="utf-8", extra="ignore")

@lru_cache
def get_settings() -> Settings:
    return Settings()
