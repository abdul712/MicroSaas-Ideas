"""
FraudShield ML Service
Advanced machine learning service for real-time fraud detection and risk assessment
"""

__version__ = "1.0.0"
__author__ = "FraudShield Team"
__description__ = "AI-powered fraud detection ML service"

# Service metadata
SERVICE_NAME = "ml-service"
SERVICE_VERSION = __version__
SERVICE_DESCRIPTION = __description__

# ML Model configurations
MODEL_VERSIONS = {
    "random_forest": "v1.2.0",
    "xgboost": "v1.1.0", 
    "neural_network": "v1.0.0",
    "isolation_forest": "v1.0.0",
    "ensemble": "v1.3.0"
}

# Feature engineering constants
FEATURE_GROUPS = {
    "transaction": ["amount", "currency", "payment_method", "timestamp"],
    "geographic": ["ip_country", "billing_country", "shipping_country", "distance"],
    "behavioral": ["velocity", "frequency", "pattern_deviation", "anomaly_score"],
    "device": ["fingerprint", "user_agent", "screen_resolution", "timezone"],
    "temporal": ["hour_of_day", "day_of_week", "is_weekend", "is_holiday"],
    "merchant": ["risk_category", "historical_chargeback_rate", "volume_tier"]
}

# Model performance thresholds
PERFORMANCE_THRESHOLDS = {
    "accuracy": 0.95,
    "precision": 0.90,
    "recall": 0.85,
    "f1_score": 0.87,
    "auc_roc": 0.92,
    "false_positive_rate": 0.05,
    "false_negative_rate": 0.15
}

# Model retraining triggers
RETRAIN_TRIGGERS = {
    "accuracy_drop": 0.05,
    "data_drift_threshold": 0.3,
    "performance_degradation_days": 7,
    "minimum_training_samples": 10000,
    "scheduled_retrain_days": 30
}

# Feature store settings
FEATURE_CACHE_TTL = {
    "real_time": 300,      # 5 minutes
    "behavioral": 3600,    # 1 hour
    "historical": 86400,   # 24 hours
    "models": 3600        # 1 hour
}

# Risk assessment levels
RISK_LEVELS = {
    "low": (0, 30),
    "medium": (30, 70),
    "high": (70, 85),
    "critical": (85, 100)
}

# Decision thresholds
DECISION_THRESHOLDS = {
    "approve": 30,
    "review": 70,
    "decline": 85
}

# Model ensemble weights (can be adjusted based on performance)
ENSEMBLE_WEIGHTS = {
    "random_forest": 0.3,
    "xgboost": 0.35,
    "neural_network": 0.25,
    "isolation_forest": 0.1
}

# Export key constants
__all__ = [
    "__version__",
    "SERVICE_NAME",
    "SERVICE_VERSION",
    "MODEL_VERSIONS",
    "FEATURE_GROUPS",
    "PERFORMANCE_THRESHOLDS",
    "RISK_LEVELS",
    "DECISION_THRESHOLDS",
    "ENSEMBLE_WEIGHTS"
]