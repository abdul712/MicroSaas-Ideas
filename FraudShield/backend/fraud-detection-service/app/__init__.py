"""
FraudShield Fraud Detection Service
Enterprise-grade AI-powered fraud detection and prevention platform
"""

__version__ = "1.0.0"
__author__ = "FraudShield Team"
__email__ = "dev@fraudshield.com"
__license__ = "MIT"
__description__ = "Enterprise AI-powered fraud detection and prevention platform"

# Service metadata
SERVICE_NAME = "fraud-detection-service"
SERVICE_VERSION = __version__
SERVICE_DESCRIPTION = __description__

# API version
API_VERSION = "v1"
API_PREFIX = f"/api/{API_VERSION}"

# Default configurations
DEFAULT_PAGE_SIZE = 50
MAX_PAGE_SIZE = 1000
DEFAULT_RISK_THRESHOLD = 75
HIGH_RISK_THRESHOLD = 85
AUTO_DECLINE_THRESHOLD = 95

# Fraud detection constants
FRAUD_PROBABILITY_THRESHOLD = 0.7
BEHAVIORAL_ANOMALY_THRESHOLD = 0.8
VELOCITY_CHECK_WINDOW = 3600  # 1 hour in seconds
DEVICE_FINGERPRINT_CACHE_TTL = 86400  # 24 hours

# Model performance thresholds
MIN_MODEL_ACCURACY = 0.90
MIN_MODEL_PRECISION = 0.85
MIN_MODEL_RECALL = 0.80
MAX_FALSE_POSITIVE_RATE = 0.05

# Rate limiting defaults
DEFAULT_RATE_LIMIT = "1000/hour"
AUTHENTICATED_RATE_LIMIT = "5000/hour"
PREMIUM_RATE_LIMIT = "10000/hour"

# Cache TTL settings (in seconds)
FEATURE_CACHE_TTL = 300  # 5 minutes
MODEL_CACHE_TTL = 3600   # 1 hour
RULES_CACHE_TTL = 1800   # 30 minutes
USER_CACHE_TTL = 900     # 15 minutes

# Async processing
MAX_CONCURRENT_REQUESTS = 100
REQUEST_TIMEOUT = 30
BATCH_PROCESSING_SIZE = 1000
QUEUE_MAX_SIZE = 10000

# Monitoring and alerting
HEALTH_CHECK_INTERVAL = 30
METRICS_COLLECTION_INTERVAL = 60
ALERT_COOLDOWN_PERIOD = 300  # 5 minutes

# Security constants
PASSWORD_MIN_LENGTH = 8
TOKEN_EXPIRY_MINUTES = 60
REFRESH_TOKEN_EXPIRY_DAYS = 30
MAX_LOGIN_ATTEMPTS = 5
ACCOUNT_LOCKOUT_DURATION = 3600  # 1 hour

# Data validation
MAX_TRANSACTION_AMOUNT = 1000000  # $1M
MIN_TRANSACTION_AMOUNT = 0.01
MAX_EMAIL_LENGTH = 255
MAX_PHONE_LENGTH = 20
MAX_ADDRESS_LENGTH = 500

# Geographic analysis
SUSPICIOUS_COUNTRY_CODES = ["XX", "A1", "A2", "O1"]  # Anonymous/Satellite/Other
HIGH_RISK_COUNTRIES = []  # Configure based on merchant needs
VPN_DETECTION_ENABLED = True

# Feature flags (can be overridden by environment)
ENABLE_BEHAVIORAL_ANALYTICS = True
ENABLE_DEVICE_FINGERPRINTING = True
ENABLE_VELOCITY_CHECKS = True
ENABLE_GEOGRAPHIC_ANALYSIS = True
ENABLE_EMAIL_VALIDATION = True
ENABLE_PHONE_VALIDATION = True
ENABLE_SOCIAL_MEDIA_VERIFICATION = False

# Export important components
__all__ = [
    "__version__",
    "SERVICE_NAME",
    "SERVICE_VERSION", 
    "API_VERSION",
    "API_PREFIX",
    "DEFAULT_RISK_THRESHOLD",
    "HIGH_RISK_THRESHOLD",
    "AUTO_DECLINE_THRESHOLD"
]