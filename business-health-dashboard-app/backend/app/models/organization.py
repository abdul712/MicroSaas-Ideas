"""
Organization model for multi-tenant architecture
"""

from sqlalchemy import String, JSON, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional, List
import enum

from app.core.database import Base


class PlanType(enum.Enum):
    """Subscription plan types"""
    STARTER = "starter"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"


class Organization(Base):
    """
    Organization model for multi-tenant SaaS architecture
    Each organization represents a separate tenant with isolated data
    """
    __tablename__ = "organizations"
    
    # Basic organization information
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    
    # Business information
    industry: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    company_size: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Subscription and billing
    plan: Mapped[PlanType] = mapped_column(
        SQLEnum(PlanType, name="plan_type"),
        default=PlanType.STARTER,
        nullable=False
    )
    
    # Configuration and settings
    settings: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    
    # Feature flags
    features: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    
    # Status and lifecycle
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    trial_ends_at: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # ISO datetime string
    
    # Relationships
    users: Mapped[List["User"]] = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    business_metrics: Mapped[List["BusinessMetric"]] = relationship("BusinessMetric", back_populates="organization", cascade="all, delete-orphan")
    health_scores: Mapped[List["HealthScore"]] = relationship("HealthScore", back_populates="organization", cascade="all, delete-orphan")
    alerts: Mapped[List["Alert"]] = relationship("Alert", back_populates="organization", cascade="all, delete-orphan")
    integrations: Mapped[List["Integration"]] = relationship("Integration", back_populates="organization", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Organization(id={self.id}, name={self.name}, plan={self.plan.value})>"
    
    def to_dict(self) -> dict:
        """Convert organization to dictionary"""
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "description": self.description,
            "industry": self.industry,
            "company_size": self.company_size,
            "website": self.website,
            "plan": self.plan.value,
            "settings": self.settings,
            "features": self.features,
            "is_active": self.is_active,
            "trial_ends_at": self.trial_ends_at,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
    
    @property
    def is_trial(self) -> bool:
        """Check if organization is in trial period"""
        if not self.trial_ends_at:
            return False
        
        from datetime import datetime, timezone
        try:
            trial_end = datetime.fromisoformat(self.trial_ends_at)
            return datetime.now(timezone.utc) < trial_end
        except:
            return False
    
    @property
    def plan_limits(self) -> dict:
        """Get plan-specific limits"""
        limits = {
            PlanType.STARTER: {
                "max_users": 3,
                "max_integrations": 3,
                "max_metrics_per_hour": 1000,
                "data_retention_days": 90,
                "support_level": "community",
                "features": ["basic_dashboard", "email_alerts"]
            },
            PlanType.PROFESSIONAL: {
                "max_users": 15,
                "max_integrations": 10,
                "max_metrics_per_hour": 10000,
                "data_retention_days": 365,
                "support_level": "email",
                "features": ["basic_dashboard", "email_alerts", "advanced_analytics", "custom_alerts", "api_access"]
            },
            PlanType.ENTERPRISE: {
                "max_users": 100,
                "max_integrations": 50,
                "max_metrics_per_hour": 100000,
                "data_retention_days": 1095,  # 3 years
                "support_level": "priority",
                "features": ["basic_dashboard", "email_alerts", "advanced_analytics", "custom_alerts", "api_access", "white_labeling", "sso", "advanced_security"]
            }
        }
        
        return limits.get(self.plan, limits[PlanType.STARTER])
    
    def can_add_user(self, current_user_count: int) -> bool:
        """Check if organization can add more users"""
        return current_user_count < self.plan_limits["max_users"]
    
    def can_add_integration(self, current_integration_count: int) -> bool:
        """Check if organization can add more integrations"""
        return current_integration_count < self.plan_limits["max_integrations"]
    
    def has_feature(self, feature_name: str) -> bool:
        """Check if organization has access to a specific feature"""
        plan_features = self.plan_limits["features"]
        custom_features = self.features.get("enabled", [])
        
        return feature_name in plan_features or feature_name in custom_features
    
    def get_setting(self, key: str, default=None):
        """Get a specific setting value"""
        return self.settings.get(key, default)
    
    def update_setting(self, key: str, value):
        """Update a specific setting value"""
        if self.settings is None:
            self.settings = {}
        self.settings[key] = value
    
    @classmethod
    def create_default_settings(cls) -> dict:
        """Create default settings for new organizations"""
        return {
            "dashboard": {
                "default_time_range": "30d",
                "auto_refresh": True,
                "refresh_interval": 300,  # 5 minutes
                "theme": "light",
                "currency": "USD",
                "timezone": "UTC"
            },
            "alerts": {
                "email_enabled": True,
                "slack_enabled": False,
                "sms_enabled": False,
                "daily_digest": True,
                "alert_threshold": "medium"
            },
            "integrations": {
                "auto_sync": True,
                "sync_frequency": "hourly",
                "data_validation": True
            },
            "security": {
                "mfa_required": False,
                "session_timeout": 480,  # 8 hours
                "ip_whitelist": [],
                "audit_logs": True
            }
        }
    
    @classmethod
    def create_default_features(cls) -> dict:
        """Create default features for new organizations"""
        return {
            "enabled": [],
            "beta": [],
            "disabled": []
        }