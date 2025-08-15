"""
FraudShield Configuration Management
Centralized configuration with environment-based settings and security.
"""

import os
from functools import lru_cache
from typing import Optional, List, Any

from pydantic import BaseSettings, validator, PostgresDsn, AnyHttpUrl
from pydantic.networks import RedisDsn


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # Application Settings
    APP_NAME: str = "FraudShield"
    VERSION: str = "2.1.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"
    
    # Security Settings
    SECRET_KEY: str = "your-super-secure-secret-key-change-in-production"
    JWT_SECRET: str = "your-jwt-secret-key"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 60 * 24  # 24 hours
    ENCRYPTION_KEY: str = "your-32-byte-encryption-key-here"
    
    # Database Configuration
    DATABASE_URL: Optional[PostgresDsn] = "postgresql://fraudshield:secure_password@localhost:5432/fraudshield"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20
    DATABASE_ECHO: bool = False
    
    # Redis Configuration
    REDIS_URL: Optional[RedisDsn] = "redis://:redis_secure@localhost:6379/0"
    REDIS_EXPIRE_SECONDS: int = 3600
    REDIS_MAX_CONNECTIONS: int = 50
    
    # InfluxDB Configuration
    INFLUXDB_URL: str = "http://localhost:8086"
    INFLUXDB_TOKEN: Optional[str] = None
    INFLUXDB_ORG: str = "fraudshield"
    INFLUXDB_BUCKET: str = "fraud_analytics"
    
    # Kafka Configuration
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    KAFKA_FRAUD_TOPIC: str = "fraud_events"
    KAFKA_ALERT_TOPIC: str = "fraud_alerts"
    
    # ML Service Configuration
    ML_SERVICE_URL: str = "http://localhost:8001"
    ML_SERVICE_TIMEOUT: int = 30
    ML_INFERENCE_TIMEOUT: int = 5
    
    # API Rate Limiting
    RATE_LIMIT_REQUESTS: int = 1000
    RATE_LIMIT_WINDOW: int = 3600  # 1 hour
    
    # Fraud Detection Thresholds
    FRAUD_THRESHOLD_LOW: float = 30.0
    FRAUD_THRESHOLD_MEDIUM: float = 60.0
    FRAUD_THRESHOLD_HIGH: float = 80.0
    
    # Feature Engineering
    FEATURE_CACHE_TTL: int = 300  # 5 minutes
    BEHAVIORAL_ANALYSIS_DAYS: int = 30
    VELOCITY_CHECK_HOURS: int = 24
    
    # Model Configuration
    MODEL_CACHE_SIZE: int = 100
    MODEL_REFRESH_INTERVAL: int = 3600  # 1 hour
    ENSEMBLE_WEIGHTS: dict = {
        "random_forest": 0.3,
        "xgboost": 0.4,
        "neural_network": 0.2,
        "isolation_forest": 0.1
    }
    
    # Monitoring and Logging
    LOG_LEVEL: str = "INFO"
    ENABLE_METRICS: bool = True
    ENABLE_TRACING: bool = True
    SENTRY_DSN: Optional[str] = None
    
    # External Services
    GEOIP_DATABASE_PATH: str = "/app/data/geoip/GeoLite2-City.mmdb"
    EMAIL_VALIDATION_API_KEY: Optional[str] = None
    DEVICE_FINGERPRINT_API_KEY: Optional[str] = None
    
    # Security Headers
    CORS_ORIGINS: List[str] = ["*"]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: List[str] = ["*"]
    CORS_ALLOW_HEADERS: List[str] = ["*"]
    
    # Performance Settings
    ASYNC_TIMEOUT: int = 30
    CONNECTION_TIMEOUT: int = 10
    READ_TIMEOUT: int = 30
    THREAD_POOL_SIZE: int = 10
    
    @validator("DATABASE_URL", pre=True)
    def validate_database_url(cls, v: str) -> str:
        """Validate and format database URL."""
        if isinstance(v, str):
            return v
        return str(v)
    
    @validator("REDIS_URL", pre=True)
    def validate_redis_url(cls, v: str) -> str:
        """Validate and format Redis URL."""
        if isinstance(v, str):
            return v
        return str(v)
    
    @validator("ENVIRONMENT")
    def validate_environment(cls, v: str) -> str:
        """Validate environment setting."""
        allowed_environments = ["development", "staging", "production", "testing"]
        if v not in allowed_environments:
            raise ValueError(f"Environment must be one of: {allowed_environments}")
        return v
    
    @validator("FRAUD_THRESHOLD_LOW", "FRAUD_THRESHOLD_MEDIUM", "FRAUD_THRESHOLD_HIGH")
    def validate_fraud_thresholds(cls, v: float) -> float:
        """Validate fraud threshold values."""
        if not 0 <= v <= 100:
            raise ValueError("Fraud thresholds must be between 0 and 100")
        return v
    
    @validator("ENSEMBLE_WEIGHTS")
    def validate_ensemble_weights(cls, v: dict) -> dict:
        """Validate ensemble model weights sum to 1.0."""
        total_weight = sum(v.values())
        if not 0.99 <= total_weight <= 1.01:  # Allow small floating point errors
            raise ValueError("Ensemble weights must sum to 1.0")
        return v
    
    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.ENVIRONMENT == "production"
    
    @property
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.ENVIRONMENT == "development"
    
    @property
    def database_config(self) -> dict:
        """Get database configuration dictionary."""
        return {
            "url": str(self.DATABASE_URL),
            "pool_size": self.DATABASE_POOL_SIZE,
            "max_overflow": self.DATABASE_MAX_OVERFLOW,
            "echo": self.DATABASE_ECHO and self.is_development,
        }
    
    @property
    def redis_config(self) -> dict:
        """Get Redis configuration dictionary."""
        return {
            "url": str(self.REDIS_URL),
            "expire_seconds": self.REDIS_EXPIRE_SECONDS,
            "max_connections": self.REDIS_MAX_CONNECTIONS,
        }
    
    @property
    def ml_config(self) -> dict:
        """Get ML service configuration dictionary."""
        return {
            "url": self.ML_SERVICE_URL,
            "timeout": self.ML_SERVICE_TIMEOUT,
            "inference_timeout": self.ML_INFERENCE_TIMEOUT,
        }
    
    @property
    def fraud_thresholds(self) -> dict:
        """Get fraud detection thresholds."""
        return {
            "low": self.FRAUD_THRESHOLD_LOW,
            "medium": self.FRAUD_THRESHOLD_MEDIUM,
            "high": self.FRAUD_THRESHOLD_HIGH,
        }
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached application settings."""
    return Settings()


# Environment-specific settings
def get_database_url() -> str:
    """Get database URL with fallback for different environments."""
    settings = get_settings()
    return str(settings.DATABASE_URL)


def get_redis_url() -> str:
    """Get Redis URL with fallback for different environments."""
    settings = get_settings()
    return str(settings.REDIS_URL)


def is_testing() -> bool:
    """Check if running in test environment."""
    return get_settings().ENVIRONMENT == "testing"


def is_production() -> bool:
    """Check if running in production environment."""
    return get_settings().is_production