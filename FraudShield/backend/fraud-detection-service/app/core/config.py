"""
FraudShield Configuration Management
Comprehensive configuration settings with environment variable support
"""

import logging
import os
from functools import lru_cache
from typing import List, Optional, Union, Any, Dict
from enum import Enum

from pydantic import BaseSettings, validator, Field
from pydantic.networks import AnyHttpUrl


class EnvironmentType(str, Enum):
    """Environment types for the application."""
    DEVELOPMENT = "development"
    TESTING = "testing"
    STAGING = "staging"
    PRODUCTION = "production"


class LogLevel(str, Enum):
    """Logging levels."""
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class Settings(BaseSettings):
    """Comprehensive settings for FraudShield fraud detection service."""
    
    # Application Configuration
    ENVIRONMENT: EnvironmentType = EnvironmentType.DEVELOPMENT
    DEBUG: bool = False
    LOG_LEVEL: LogLevel = LogLevel.INFO
    
    # API Configuration
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_RATE_LIMIT: int = 1000
    API_RATE_LIMIT_WINDOW: int = 3600  # 1 hour
    CORS_ORIGINS: List[AnyHttpUrl] = []
    
    @validator("CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    # Database Configuration
    DATABASE_URL: str = Field(..., env="DATABASE_URL")
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20
    
    # Redis Configuration
    REDIS_URL: str = Field(..., env="REDIS_URL")
    REDIS_MAX_CONNECTIONS: int = 50
    REDIS_SOCKET_TIMEOUT: int = 5
    REDIS_HEALTH_CHECK_INTERVAL: int = 30
    
    # InfluxDB Configuration (Time Series)
    INFLUXDB_URL: str = Field(default="http://localhost:8086", env="INFLUXDB_URL")
    INFLUXDB_TOKEN: str = Field(..., env="INFLUXDB_TOKEN")
    INFLUXDB_ORG: str = Field(default="fraudshield", env="INFLUXDB_ORG")
    INFLUXDB_BUCKET: str = Field(default="transactions", env="INFLUXDB_BUCKET")
    
    # Kafka Configuration
    KAFKA_BOOTSTRAP_SERVERS: str = Field(default="localhost:9092", env="KAFKA_BOOTSTRAP_SERVERS")
    KAFKA_CLIENT_ID: str = "fraudshield-app"
    KAFKA_AUTO_COMMIT_INTERVAL: int = 1000
    KAFKA_SESSION_TIMEOUT: int = 30000
    
    # Security Configuration
    JWT_SECRET: str = Field(..., env="JWT_SECRET")
    JWT_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_EXPIRE_DAYS: int = 30
    BCRYPT_ROUNDS: int = 12
    
    # Encryption Configuration
    ENCRYPTION_KEY: str = Field(..., env="ENCRYPTION_KEY")
    DATA_TOKENIZATION_KEY: str = Field(..., env="DATA_TOKENIZATION_KEY")
    
    # ML Service Configuration
    ML_SERVICE_URL: str = Field(default="http://localhost:8001", env="ML_SERVICE_URL")
    MODEL_CACHE_TTL: int = 3600
    FEATURE_STORE_TTL: int = 300
    MODEL_RETRAIN_INTERVAL: int = 86400
    MODEL_ACCURACY_THRESHOLD: float = 0.95
    
    # Rules Engine Configuration
    RULES_ENGINE_URL: str = Field(default="http://localhost:3001", env="RULES_ENGINE_URL")
    DEFAULT_RISK_THRESHOLD: int = 75
    HIGH_RISK_THRESHOLD: int = 85
    AUTO_DECLINE_THRESHOLD: int = 95
    
    # External Service Integration
    STRIPE_PUBLISHABLE_KEY: Optional[str] = None
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    
    PAYPAL_CLIENT_ID: Optional[str] = None
    PAYPAL_CLIENT_SECRET: Optional[str] = None
    
    SQUARE_APPLICATION_ID: Optional[str] = None
    SQUARE_ACCESS_TOKEN: Optional[str] = None
    
    # E-commerce Platform Integration
    SHOPIFY_API_KEY: Optional[str] = None
    SHOPIFY_API_SECRET: Optional[str] = None
    
    WOOCOMMERCE_CONSUMER_KEY: Optional[str] = None
    WOOCOMMERCE_CONSUMER_SECRET: Optional[str] = None
    
    # Email Configuration
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: str = "noreply@fraudshield.com"
    SMTP_FROM_NAME: str = "FraudShield"
    
    # Monitoring Configuration
    PROMETHEUS_ENABLED: bool = True
    PROMETHEUS_PORT: int = 9090
    METRICS_ENDPOINT: str = "/metrics"
    
    # Logging Configuration
    LOG_FORMAT: str = "json"
    LOG_FILE_PATH: Optional[str] = None
    LOG_MAX_SIZE: str = "10MB"
    LOG_BACKUP_COUNT: int = 5
    
    # Feature Flags
    ENABLE_BEHAVIORAL_ANALYTICS: bool = True
    ENABLE_DEVICE_FINGERPRINTING: bool = True
    ENABLE_VELOCITY_CHECKS: bool = True
    ENABLE_GEOGRAPHIC_ANALYSIS: bool = True
    ENABLE_EMAIL_VALIDATION: bool = True
    ENABLE_PHONE_VALIDATION: bool = True
    ENABLE_SOCIAL_MEDIA_VERIFICATION: bool = False
    
    # Performance Configuration
    MAX_CONCURRENT_REQUESTS: int = 1000
    REQUEST_TIMEOUT: int = 30
    BATCH_PROCESSING_SIZE: int = 1000
    WORKER_PROCESSES: int = 4
    
    # Data Retention Configuration
    TRANSACTION_DATA_RETENTION_DAYS: int = 2555  # 7 years for PCI compliance
    LOG_DATA_RETENTION_DAYS: int = 90
    METRICS_DATA_RETENTION_DAYS: int = 365
    
    # Alert Configuration
    ALERT_EMAIL_RECIPIENTS: List[str] = []
    ALERT_SLACK_WEBHOOK: Optional[str] = None
    ALERT_THRESHOLD_HIGH_RISK_VOLUME: int = 100
    ALERT_THRESHOLD_MODEL_ACCURACY_DROP: float = 0.05
    
    @validator("ALERT_EMAIL_RECIPIENTS", pre=True)
    def assemble_alert_emails(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and v:
            return [email.strip() for email in v.split(",")]
        elif isinstance(v, list):
            return v
        return []
    
    # Development/Testing Configuration
    MOCK_EXTERNAL_APIS: bool = False
    ENABLE_TEST_DATA_GENERATION: bool = True
    TEST_TRANSACTION_VOLUME: int = 1000
    FAKER_SEED: int = 12345
    
    # PCI DSS Compliance Configuration
    ENABLE_DATA_MASKING: bool = True
    ENABLE_AUDIT_LOGGING: bool = True
    AUDIT_LOG_RETENTION_YEARS: int = 7
    ENABLE_ENCRYPTION_AT_REST: bool = True
    ENABLE_ENCRYPTION_IN_TRANSIT: bool = True
    
    # Business Configuration
    DEFAULT_CURRENCY: str = "USD"
    SUPPORTED_CURRENCIES: List[str] = ["USD", "EUR", "GBP", "CAD", "AUD"]
    MIN_TRANSACTION_AMOUNT: float = 0.01
    MAX_TRANSACTION_AMOUNT: float = 50000
    
    @validator("SUPPORTED_CURRENCIES", pre=True)
    def assemble_currencies(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [currency.strip() for currency in v.split(",")]
        return v
    
    # Rate Limiting Configuration
    RATE_LIMIT_REDIS_PREFIX: str = "fraudshield_rate_limit"
    RATE_LIMIT_SKIP_SUCCESSFUL: bool = True
    RATE_LIMIT_STORE_TYPE: str = "redis"
    
    # Cache Configuration
    CACHE_DEFAULT_TTL: int = 300
    CACHE_FEATURES_TTL: int = 60
    CACHE_MODELS_TTL: int = 3600
    CACHE_RULES_TTL: int = 1800
    
    # Webhook Configuration
    WEBHOOK_SECRET: Optional[str] = None
    WEBHOOK_TIMEOUT: int = 10
    WEBHOOK_RETRY_ATTEMPTS: int = 3
    WEBHOOK_RETRY_DELAY: int = 1
    
    # Analytics Configuration
    ANALYTICS_BATCH_SIZE: int = 1000
    ANALYTICS_FLUSH_INTERVAL: int = 60
    ENABLE_REAL_TIME_ANALYTICS: bool = True
    ENABLE_HISTORICAL_ANALYTICS: bool = True
    
    # Computed Properties
    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.ENVIRONMENT == EnvironmentType.PRODUCTION
    
    @property
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.ENVIRONMENT == EnvironmentType.DEVELOPMENT
    
    @property
    def is_testing(self) -> bool:
        """Check if running in testing environment."""
        return self.ENVIRONMENT == EnvironmentType.TESTING
    
    @property
    def database_dsn(self) -> str:
        """Get formatted database DSN."""
        return self.DATABASE_URL
    
    @property
    def redis_dsn(self) -> str:
        """Get formatted Redis DSN."""
        return self.REDIS_URL
    
    @property
    def kafka_bootstrap_servers_list(self) -> List[str]:
        """Get Kafka bootstrap servers as list."""
        return [server.strip() for server in self.KAFKA_BOOTSTRAP_SERVERS.split(",")]
    
    def get_feature_flags(self) -> Dict[str, bool]:
        """Get all feature flags as dictionary."""
        return {
            "behavioral_analytics": self.ENABLE_BEHAVIORAL_ANALYTICS,
            "device_fingerprinting": self.ENABLE_DEVICE_FINGERPRINTING,
            "velocity_checks": self.ENABLE_VELOCITY_CHECKS,
            "geographic_analysis": self.ENABLE_GEOGRAPHIC_ANALYSIS,
            "email_validation": self.ENABLE_EMAIL_VALIDATION,
            "phone_validation": self.ENABLE_PHONE_VALIDATION,
            "social_media_verification": self.ENABLE_SOCIAL_MEDIA_VERIFICATION,
        }
    
    def get_risk_thresholds(self) -> Dict[str, int]:
        """Get risk threshold configuration."""
        return {
            "default": self.DEFAULT_RISK_THRESHOLD,
            "high_risk": self.HIGH_RISK_THRESHOLD,
            "auto_decline": self.AUTO_DECLINE_THRESHOLD,
        }
    
    def get_cache_config(self) -> Dict[str, int]:
        """Get cache TTL configuration."""
        return {
            "default": self.CACHE_DEFAULT_TTL,
            "features": self.CACHE_FEATURES_TTL,
            "models": self.CACHE_MODELS_TTL,
            "rules": self.CACHE_RULES_TTL,
        }
    
    class Config:
        """Pydantic configuration."""
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        validate_assignment = True
        
        # Custom env prefix
        env_prefix = ""
        
        # Fields that should not be logged
        secret_fields = {
            "JWT_SECRET",
            "ENCRYPTION_KEY", 
            "DATA_TOKENIZATION_KEY",
            "DATABASE_URL",
            "REDIS_URL",
            "STRIPE_SECRET_KEY",
            "STRIPE_WEBHOOK_SECRET",
            "PAYPAL_CLIENT_SECRET",
            "SQUARE_ACCESS_TOKEN",
            "SHOPIFY_API_SECRET",
            "WOOCOMMERCE_CONSUMER_SECRET",
            "SMTP_PASSWORD",
            "WEBHOOK_SECRET",
        }


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    Using lru_cache to avoid re-reading environment variables on every request.
    """
    return Settings()


def get_logging_config(settings: Settings) -> Dict[str, Any]:
    """Get logging configuration based on settings."""
    
    config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "json": {
                "()": "pythonjsonlogger.jsonlogger.JsonFormatter",
                "format": "%(asctime)s %(name)s %(levelname)s %(message)s",
            },
            "standard": {
                "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
            },
        },
        "handlers": {
            "default": {
                "level": settings.LOG_LEVEL,
                "formatter": settings.LOG_FORMAT,
                "class": "logging.StreamHandler",
                "stream": "ext://sys.stdout",
            },
        },
        "loggers": {
            "": {
                "handlers": ["default"],
                "level": settings.LOG_LEVEL,
                "propagate": False,
            },
            "uvicorn": {
                "handlers": ["default"],
                "level": "INFO",
                "propagate": False,
            },
            "uvicorn.error": {
                "level": "INFO",
                "handlers": ["default"],
                "propagate": False,
            },
            "uvicorn.access": {
                "handlers": ["default"],
                "level": "INFO",
                "propagate": False,
            },
        },
    }
    
    # Add file handler if log file path is specified
    if settings.LOG_FILE_PATH:
        config["handlers"]["file"] = {
            "level": settings.LOG_LEVEL,
            "formatter": settings.LOG_FORMAT,
            "class": "logging.handlers.RotatingFileHandler",
            "filename": settings.LOG_FILE_PATH,
            "maxBytes": int(settings.LOG_MAX_SIZE.replace("MB", "")) * 1024 * 1024,
            "backupCount": settings.LOG_BACKUP_COUNT,
        }
        config["loggers"][""]["handlers"].append("file")
    
    return config


# Export main settings instance
settings = get_settings()