"""
Application configuration and settings management.
"""
from functools import lru_cache
from typing import List, Optional

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Central settings object for the ML service. Values are loaded from the
    environment (or a .env file) and exposed via strongly typed attributes.
    """

    env: str = Field("development", alias="ENV")
    api_key: str = Field("your_ml_api_key_here", alias="API_KEY")
    mongodb_uri: str = Field("mongodb://localhost:27017/agilesafe", alias="MONGODB_URI")
    mongodb_db: str = Field("agilesafe", alias="MONGODB_DB")
    
    @property
    def MONGODB_URI(self) -> str:
        """Alias for mongodb_uri."""
        return self.mongodb_uri
    
    @property
    def DATABASE_NAME(self) -> str:
        """Alias for mongodb_db."""
        return self.mongodb_db
    node_api_url: str = Field("http://localhost:5000/api", alias="NODE_API_URL")
    model_path: str = Field("./app/ml/models", alias="MODEL_PATH")
    log_level: str = Field("INFO", alias="LOG_LEVEL")
    port: int = Field(8000, alias="PORT")
    allowed_origins: str = Field("http://localhost:5173", alias="ALLOWED_ORIGINS")
    training_batch_size: int = Field(64, alias="TRAINING_BATCH_SIZE")
    training_epochs: int = Field(10, alias="TRAINING_EPOCHS")
    vite_ws_url: Optional[str] = Field("http://localhost:5000", alias="VITE_WS_URL")

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "protected_namespaces": ("settings_",),
    }

    @property
    def allowed_origins_list(self) -> List[str]:
        """
        Helper property that returns the configured CORS origins as a list.
        """
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """
    Cached settings accessor to avoid re-parsing the environment on every import.
    """
    return Settings()


settings = get_settings()



