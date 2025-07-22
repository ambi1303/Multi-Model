"""
Centralized configuration management for all backend services.
This version uses nested Pydantic models for better composition and reduced redundancy.
"""
import os
import sys
import json
from typing import Optional, List
from pydantic import field_validator, ConfigDict
from pydantic_settings import BaseSettings
from functools import lru_cache

# The explicit load_dotenv() call is no longer needed here.
# Pydantic-settings handles it via `env_file` in the model_config.

class DatabaseConfig(BaseSettings):
    """Database configuration settings."""
    url: str
    pool_size: int = 10
    max_overflow: int = 20
    pool_pre_ping: bool = True
    echo: bool = False
    
    model_config = ConfigDict(env_prefix="DATABASE_")


class AuthConfig(BaseSettings):
    """Authentication configuration settings."""
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    service_auth_token: str
    
    model_config = ConfigDict(env_prefix="AUTH_")

class RedisConfig(BaseSettings):
    url: str
    max_connections: int = 10
    retry_on_timeout: bool = True
    decode_responses: bool = True

    model_config = ConfigDict(env_prefix="REDIS_")



class ExternalAPIConfig(BaseSettings):
    """External API configuration settings."""
    groq_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    
    # The prefix will apply to all fields, e.g., API_GROQ_API_KEY
    model_config = ConfigDict(env_prefix="API_")


class ServiceConfig(BaseSettings):
    """Service-specific configuration."""
    name: str = "mental-health-analytics"
    version: str = "2.0.0"
    debug: bool = False
    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 1
    
    # CORS settings
    cors_origins: List[str] = ["*"]
    cors_methods: List[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    cors_headers: List[str] = ["*"]
    
    # Rate limiting
    rate_limit_requests: int = 100
    rate_limit_window: int = 60
    
    # Monitoring
    enable_metrics: bool = True
    log_level: str = "INFO"
    log_format: str = "json"

    @field_validator('cors_origins', 'cors_methods', 'cors_headers', mode='before')
    @classmethod
    def parse_json_lists(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [item.strip() for item in v.split(',')]
        return v
    
    model_config = ConfigDict(env_prefix="SERVICE_")


class GlobalConfig(BaseSettings):
    """Global application configuration, composed of nested settings models."""
    
    # Nested configuration models
    # Pydantic will automatically populate these using their env_prefix
    database: DatabaseConfig
    auth: AuthConfig
    service: ServiceConfig
    apis: ExternalAPIConfig
    redis: RedisConfig

    # Global settings that don't fit into the models above
    environment: str = "development"
    debug: bool = False
    
   
    
    # Service URLs for microservices communication
    video_service_url: Optional[str] = "http://localhost:8001"
    stt_service_url: Optional[str] = "http://localhost:8002"
    chat_service_url: Optional[str] = "http://localhost:8003"
    survey_service_url: Optional[str] = "http://localhost:8004"
    emo_buddy_service_url: Optional[str] = "http://localhost:8005"
    
    @field_validator('environment')
    @classmethod
    def validate_environment(cls, v: str) -> str:
        allowed = ['development', 'staging', 'production']
        if v not in allowed:
            raise ValueError(f'Environment must be one of {allowed}')
        return v
    
    # Pydantic will automatically find and load the .env file
    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        # Allow nested prefixes
        env_nested_delimiter='__' 
    )


@lru_cache()
def get_config() -> GlobalConfig:
    """
    Get the cached global configuration.
    Pydantic raises a ValidationError at startup if required env vars are missing.
    """
    print("→ [DEBUG] Initializing GlobalConfig...", file=sys.stderr)
    config = GlobalConfig()
    print("→ [DEBUG] Loaded DATABASE_URL:", repr(config.database.url), file=sys.stderr)
    return config

# This function is no longer necessary, as validation happens automatically.
# You can simply access the URL via `get_config().database.url`.
# The application will not start if DATABASE_URL is missing.