"""
Centralized configuration management for all backend services
"""
import os
from typing import Optional, List
from pydantic import field_validator, ConfigDict
from pydantic_settings import BaseSettings
from functools import lru_cache
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class DatabaseConfig(BaseSettings):
    """Database configuration settings"""
    url: str
    pool_size: int = 10
    max_overflow: int = 20
    pool_pre_ping: bool = True
    echo: bool = False
    
    model_config = ConfigDict(env_prefix="DATABASE_")


class AuthConfig(BaseSettings):
    """Authentication configuration settings"""
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    
    model_config = ConfigDict(env_prefix="AUTH_")


class ExternalAPIConfig(BaseSettings):
    """External API configuration settings"""
    groq_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    
    model_config = ConfigDict(env_prefix="API_")


class ServiceConfig(BaseSettings):
    """Service-specific configuration"""
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
    
    # Monitoring
    enable_metrics: bool = True
    log_level: str = "INFO"
    log_format: str = "json"
    
    model_config = ConfigDict(env_prefix="SERVICE_")


class GlobalConfig(BaseSettings):
    """Global application configuration"""
    # Environment
    environment: str = "development"
    debug: bool = False
    
    # Database configuration
    database_url: str
    database_pool_size: int = 10
    database_max_overflow: int = 20
    database_pool_pre_ping: bool = True
    database_echo: bool = False
    
    # Authentication configuration
    auth_secret_key: str
    auth_algorithm: str = "HS256"
    auth_access_token_expire_minutes: int = 30
    auth_refresh_token_expire_days: int = 7
    
    # Redis configuration
    redis_url: Optional[str] = "redis://localhost:6379/0"
    redis_max_connections: int = 10
    redis_retry_on_timeout: bool = True
    redis_decode_responses: bool = True
    
    # External API Keys
    api_groq_api_key: Optional[str] = None
    api_gemini_api_key: Optional[str] = None
    api_openai_api_key: Optional[str] = None
    
    # Service configuration
    service_name: str = "mental-health-analytics"
    service_version: str = "2.0.0"
    service_debug: bool = False
    service_host: str = "0.0.0.0"
    service_port: int = 8000
    service_workers: int = 1
    
    # CORS settings
    service_cors_origins: List[str] = ["*"]
    service_cors_methods: List[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    service_cors_headers: List[str] = ["*"]
    
    # Rate limiting
    service_rate_limit_requests: int = 100
    service_rate_limit_window: int = 60
    
    # Monitoring
    service_enable_metrics: bool = True
    service_log_level: str = "INFO"
    service_log_format: str = "json"
    
    # Service URLs for microservices communication
    database_service_url: Optional[str] = "http://localhost:8000"
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
    
    @field_validator('service_cors_origins', 'service_cors_methods', 'service_cors_headers')
    @classmethod
    def parse_json_lists(cls, v):
        if isinstance(v, str):
            import json
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                # If it fails to parse as JSON, split by comma as fallback
                return [item.strip() for item in v.split(',')]
        return v
    
    # Properties to access sub-configurations
    @property
    def database(self) -> DatabaseConfig:
        """Get database configuration"""
        return DatabaseConfig(
            url=self.database_url,
            pool_size=self.database_pool_size,
            max_overflow=self.database_max_overflow,
            pool_pre_ping=self.database_pool_pre_ping,
            echo=self.database_echo
        )
    
    @property
    def auth(self) -> AuthConfig:
        """Get authentication configuration"""
        return AuthConfig(
            secret_key=self.auth_secret_key,
            algorithm=self.auth_algorithm,
            access_token_expire_minutes=self.auth_access_token_expire_minutes,
            refresh_token_expire_days=self.auth_refresh_token_expire_days
        )
    
    @property
    def service(self) -> ServiceConfig:
        """Get service configuration"""
        return ServiceConfig(
            name=self.service_name,
            version=self.service_version,
            debug=self.service_debug,
            host=self.service_host,
            port=self.service_port,
            workers=self.service_workers,
            cors_origins=self.service_cors_origins,
            cors_methods=self.service_cors_methods,
            cors_headers=self.service_cors_headers,
            enable_metrics=self.service_enable_metrics,
            log_level=self.service_log_level,
            log_format=self.service_log_format
        )
    
    @property
    def external_apis(self) -> ExternalAPIConfig:
        """Get external API configuration"""
        return ExternalAPIConfig(
            groq_api_key=self.api_groq_api_key,
            gemini_api_key=self.api_gemini_api_key,
            openai_api_key=self.api_openai_api_key
        )
    
    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )


@lru_cache()
def get_config() -> GlobalConfig:
    """Get cached global configuration"""
    return GlobalConfig()


def get_database_url() -> str:
    """Get database URL with validation"""
    config = get_config()
    if not config.database_url:
        raise ValueError("DATABASE_URL is required but not set")
    return config.database_url 