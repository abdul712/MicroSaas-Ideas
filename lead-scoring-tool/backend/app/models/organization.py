"""
Organization Model - Multi-tenant Organization Management
"""

from sqlalchemy import Column, String, DateTime, Boolean, Text, JSON, Integer, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from typing import Optional, Dict, Any

from app.core.database import Base


class SubscriptionTier(str, enum.Enum):
    """Subscription tier enumeration."""
    STARTER = "starter"
    PROFESSIONAL = "professional" 
    BUSINESS = "business"
    ENTERPRISE = "enterprise"


class OrganizationStatus(str, enum.Enum):
    """Organization status enumeration."""
    ACTIVE = "active"
    SUSPENDED = "suspended"
    TRIAL = "trial"
    CANCELED = "canceled"


class Organization(Base):
    """
    Organization model for multi-tenant architecture.
    Each organization represents a customer account.
    """
    __tablename__ = "organizations"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # Basic Information
    name = Column(String(255), nullable=False, index=True)
    slug = Column(String(100), nullable=False, unique=True, index=True)
    domain = Column(String(255), nullable=True, index=True)
    description = Column(Text, nullable=True)
    
    # Contact Information
    contact_email = Column(String(255), nullable=False)
    contact_phone = Column(String(50), nullable=True)
    
    # Address Information
    address_line1 = Column(String(255), nullable=True)
    address_line2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)
    country = Column(String(100), nullable=True)
    
    # Subscription and Billing
    subscription_tier = Column(
        Enum(SubscriptionTier), 
        nullable=False, 
        default=SubscriptionTier.STARTER,
        index=True
    )
    status = Column(
        Enum(OrganizationStatus),
        nullable=False,
        default=OrganizationStatus.TRIAL,
        index=True
    )
    trial_ends_at = Column(DateTime(timezone=True), nullable=True)
    subscription_starts_at = Column(DateTime(timezone=True), nullable=True)
    subscription_ends_at = Column(DateTime(timezone=True), nullable=True)
    
    # Billing Information
    stripe_customer_id = Column(String(255), nullable=True, unique=True)
    stripe_subscription_id = Column(String(255), nullable=True, unique=True)
    billing_email = Column(String(255), nullable=True)
    
    # Usage Limits and Tracking
    lead_limit = Column(Integer, nullable=False, default=1000)
    user_limit = Column(Integer, nullable=False, default=3)
    api_request_limit = Column(Integer, nullable=False, default=10000)
    
    current_lead_count = Column(Integer, nullable=False, default=0)
    current_user_count = Column(Integer, nullable=False, default=0)
    monthly_api_requests = Column(Integer, nullable=False, default=0)
    
    # Feature Flags
    features = Column(JSON, nullable=False, default=dict)
    
    # Settings and Configuration
    settings = Column(JSON, nullable=False, default=dict)
    timezone = Column(String(50), nullable=False, default='UTC')
    
    # Security and Compliance
    data_retention_days = Column(Integer, nullable=False, default=2555)  # 7 years
    gdpr_compliance_enabled = Column(Boolean, nullable=False, default=True)
    ccpa_compliance_enabled = Column(Boolean, nullable=False, default=True)
    
    # Audit Fields
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )
    created_by = Column(UUID(as_uuid=True), nullable=True)
    
    # Soft Delete
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True, index=True)
    
    # Relationships
    users = relationship("User", back_populates="organization", lazy="dynamic")
    leads = relationship("Lead", back_populates="organization", lazy="dynamic") 
    scoring_models = relationship("ScoringModel", back_populates="organization", lazy="dynamic")
    integrations = relationship("Integration", back_populates="organization", lazy="dynamic")
    audit_logs = relationship("AuditLog", back_populates="organization", lazy="dynamic")
    
    def __repr__(self) -> str:
        return f"<Organization(id={self.id}, name='{self.name}', tier={self.subscription_tier})>"
    
    @property
    def is_trial(self) -> bool:
        """Check if organization is in trial period."""
        return self.status == OrganizationStatus.TRIAL
    
    @property
    def is_active_subscription(self) -> bool:
        """Check if organization has active subscription."""
        return self.status == OrganizationStatus.ACTIVE
    
    @property
    def is_premium(self) -> bool:
        """Check if organization has premium features."""
        return self.subscription_tier in [
            SubscriptionTier.BUSINESS, 
            SubscriptionTier.ENTERPRISE
        ]
    
    @property
    def can_add_leads(self) -> bool:
        """Check if organization can add more leads."""
        return self.current_lead_count < self.lead_limit
    
    @property
    def can_add_users(self) -> bool:
        """Check if organization can add more users."""
        return self.current_user_count < self.user_limit
    
    def get_feature(self, feature_name: str, default: Any = False) -> Any:
        """Get feature flag value."""
        return self.features.get(feature_name, default)
    
    def set_feature(self, feature_name: str, value: Any) -> None:
        """Set feature flag value."""
        if self.features is None:
            self.features = {}
        self.features[feature_name] = value
    
    def get_setting(self, setting_name: str, default: Any = None) -> Any:
        """Get organization setting value."""
        return self.settings.get(setting_name, default)
    
    def set_setting(self, setting_name: str, value: Any) -> None:
        """Set organization setting value."""
        if self.settings is None:
            self.settings = {}
        self.settings[setting_name] = value
    
    def get_tier_limits(self) -> Dict[str, int]:
        """Get limits based on subscription tier."""
        tier_limits = {
            SubscriptionTier.STARTER: {
                "leads": 1000,
                "users": 3,
                "api_requests": 10000,
                "integrations": 3,
                "webhooks": 5
            },
            SubscriptionTier.PROFESSIONAL: {
                "leads": 10000,
                "users": 10,
                "api_requests": 100000,
                "integrations": 10,
                "webhooks": 20
            },
            SubscriptionTier.BUSINESS: {
                "leads": 50000,
                "users": 50,
                "api_requests": 500000,
                "integrations": 25,
                "webhooks": 100
            },
            SubscriptionTier.ENTERPRISE: {
                "leads": 1000000,
                "users": 1000,
                "api_requests": 10000000,
                "integrations": 100,
                "webhooks": 1000
            }
        }
        return tier_limits.get(self.subscription_tier, tier_limits[SubscriptionTier.STARTER])
    
    def increment_usage(self, metric: str, count: int = 1) -> None:
        """Increment usage counter."""
        if metric == "leads":
            self.current_lead_count += count
        elif metric == "users":
            self.current_user_count += count
        elif metric == "api_requests":
            self.monthly_api_requests += count
    
    def reset_monthly_usage(self) -> None:
        """Reset monthly usage counters."""
        self.monthly_api_requests = 0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert organization to dictionary."""
        return {
            "id": str(self.id),
            "name": self.name,
            "slug": self.slug,
            "domain": self.domain,
            "description": self.description,
            "contact_email": self.contact_email,
            "contact_phone": self.contact_phone,
            "subscription_tier": self.subscription_tier,
            "status": self.status,
            "trial_ends_at": self.trial_ends_at.isoformat() if self.trial_ends_at else None,
            "features": self.features,
            "settings": self.settings,
            "timezone": self.timezone,
            "usage": {
                "leads": f"{self.current_lead_count}/{self.lead_limit}",
                "users": f"{self.current_user_count}/{self.user_limit}",
                "api_requests": f"{self.monthly_api_requests}/{self.api_request_limit}"
            },
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "is_active": self.is_active
        }