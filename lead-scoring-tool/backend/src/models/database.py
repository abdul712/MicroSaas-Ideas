"""
Lead Scoring Tool - Database Models
SQLAlchemy models for all entities with comprehensive relationships
"""

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import (
    Boolean, Column, DateTime, Enum, Float, ForeignKey, Integer, 
    JSON, String, Text, UniqueConstraint, Index, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

Base = declarative_base()


# Enums
class UserRole(str, enum.Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MANAGER = "manager"
    USER = "user"
    VIEWER = "viewer"


class LeadStatus(str, enum.Enum):
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    UNQUALIFIED = "unqualified"
    CONVERTED = "converted"
    LOST = "lost"


class LeadSource(str, enum.Enum):
    WEBSITE = "website"
    EMAIL = "email"
    SOCIAL = "social"
    REFERRAL = "referral"
    PAID_ADS = "paid_ads"
    ORGANIC = "organic"
    DIRECT = "direct"
    IMPORT = "import"
    API = "api"


class ActivityType(str, enum.Enum):
    EMAIL_OPEN = "email_open"
    EMAIL_CLICK = "email_click"
    WEBSITE_VISIT = "website_visit"
    PAGE_VIEW = "page_view"
    DOWNLOAD = "download"
    FORM_SUBMIT = "form_submit"
    MEETING_SCHEDULED = "meeting_scheduled"
    CALL_MADE = "call_made"
    DEMO_ATTENDED = "demo_attended"
    PROPOSAL_VIEWED = "proposal_viewed"
    SOCIAL_ENGAGEMENT = "social_engagement"


class ModelType(str, enum.Enum):
    XGBOOST = "xgboost"
    RANDOM_FOREST = "random_forest"
    LOGISTIC_REGRESSION = "logistic_regression"
    NEURAL_NETWORK = "neural_network"
    ENSEMBLE = "ensemble"


class IntegrationType(str, enum.Enum):
    SALESFORCE = "salesforce"
    HUBSPOT = "hubspot"
    PIPEDRIVE = "pipedrive"
    MAILCHIMP = "mailchimp"
    SENDGRID = "sendgrid"
    LINKEDIN = "linkedin"
    GOOGLE_ADS = "google_ads"
    FACEBOOK_ADS = "facebook_ads"


# Base Model with common fields
class TimestampMixin:
    """Mixin for timestamp fields"""
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class UUIDMixin:
    """Mixin for UUID primary key"""
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)


# Organization and User Models
class Organization(Base, UUIDMixin, TimestampMixin):
    """Organization/Company model for multi-tenancy"""
    __tablename__ = "organizations"
    
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    industry = Column(String(100), nullable=True)
    size = Column(String(50), nullable=True)  # startup, small, medium, large, enterprise
    website = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    
    # Subscription and billing
    plan_type = Column(String(50), default="starter", nullable=False)  # starter, professional, business, enterprise
    subscription_status = Column(String(50), default="active", nullable=False)  # active, suspended, cancelled
    trial_ends_at = Column(DateTime(timezone=True), nullable=True)
    stripe_customer_id = Column(String(100), nullable=True)
    
    # Settings and configuration
    settings = Column(JSONB, default={}, nullable=False)
    scoring_config = Column(JSONB, default={}, nullable=False)
    integration_config = Column(JSONB, default={}, nullable=False)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    users = relationship("User", back_populates="organizations", secondary="user_organizations")
    leads = relationship("Lead", back_populates="organization", cascade="all, delete-orphan")
    scoring_models = relationship("ScoringModel", back_populates="organization", cascade="all, delete-orphan")
    integrations = relationship("Integration", back_populates="organization", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index("idx_org_slug", "slug"),
        Index("idx_org_plan", "plan_type"),
        Index("idx_org_status", "subscription_status"),
    )


class User(Base, UUIDMixin, TimestampMixin):
    """User model with authentication and profile data"""
    __tablename__ = "users"
    
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    
    # Profile information
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    phone = Column(String(20), nullable=True)
    timezone = Column(String(50), default="UTC", nullable=False)
    
    # Authentication
    email_verified = Column(Boolean, default=False, nullable=False)
    email_verification_token = Column(String(255), nullable=True)
    password_reset_token = Column(String(255), nullable=True)
    password_reset_expires = Column(DateTime(timezone=True), nullable=True)
    
    # MFA
    mfa_enabled = Column(Boolean, default=False, nullable=False)
    mfa_secret = Column(String(255), nullable=True)
    
    # Login tracking
    last_login = Column(DateTime(timezone=True), nullable=True)
    login_count = Column(Integer, default=0, nullable=False)
    
    # Preferences
    preferences = Column(JSONB, default={}, nullable=False)
    notification_settings = Column(JSONB, default={}, nullable=False)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    organizations = relationship("Organization", back_populates="users", secondary="user_organizations")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")
    
    __table_args__ = (
        Index("idx_user_email", "email"),
        Index("idx_user_active", "is_active"),
        CheckConstraint("email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'", name="valid_email"),
    )
    
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"


class UserOrganization(Base, TimestampMixin):
    """Many-to-many relationship between users and organizations"""
    __tablename__ = "user_organizations"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), primary_key=True)
    
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    permissions = Column(JSONB, default={}, nullable=False)
    invited_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    invited_at = Column(DateTime(timezone=True), nullable=True)
    joined_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    is_active = Column(Boolean, default=True, nullable=False)
    
    __table_args__ = (
        Index("idx_user_org_role", "role"),
        Index("idx_user_org_active", "is_active"),
    )


class UserSession(Base, UUIDMixin, TimestampMixin):
    """User session management"""
    __tablename__ = "user_sessions"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    refresh_token_hash = Column(String(255), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    
    # Session metadata
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    device_fingerprint = Column(String(255), nullable=True)
    
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="sessions")
    
    __table_args__ = (
        Index("idx_session_user", "user_id"),
        Index("idx_session_token", "refresh_token_hash"),
        Index("idx_session_expires", "expires_at"),
    )


# Lead Management Models
class Lead(Base, UUIDMixin, TimestampMixin):
    """Lead/Contact model with comprehensive data"""
    __tablename__ = "leads"
    
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    
    # Basic information
    email = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    
    # Company information
    company = Column(String(255), nullable=True)
    title = Column(String(100), nullable=True)
    industry = Column(String(100), nullable=True)
    company_size = Column(String(50), nullable=True)
    annual_revenue = Column(Float, nullable=True)
    website = Column(String(255), nullable=True)
    
    # Location
    country = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)
    timezone = Column(String(50), nullable=True)
    
    # Lead metadata
    source = Column(Enum(LeadSource), default=LeadSource.WEBSITE, nullable=False)
    status = Column(Enum(LeadStatus), default=LeadStatus.NEW, nullable=False)
    campaign = Column(String(255), nullable=True)
    utm_source = Column(String(100), nullable=True)
    utm_medium = Column(String(100), nullable=True)
    utm_campaign = Column(String(100), nullable=True)
    utm_content = Column(String(100), nullable=True)
    utm_term = Column(String(100), nullable=True)
    
    # Enrichment data
    enriched_data = Column(JSONB, default={}, nullable=False)
    social_profiles = Column(JSONB, default={}, nullable=False)
    
    # Tracking
    external_id = Column(String(255), nullable=True)  # CRM ID
    tags = Column(JSONB, default=[], nullable=False)
    custom_fields = Column(JSONB, default={}, nullable=False)
    
    # Engagement metrics
    email_opens = Column(Integer, default=0, nullable=False)
    email_clicks = Column(Integer, default=0, nullable=False)
    website_visits = Column(Integer, default=0, nullable=False)
    page_views = Column(Integer, default=0, nullable=False)
    downloads = Column(Integer, default=0, nullable=False)
    meetings_scheduled = Column(Integer, default=0, nullable=False)
    
    # Timestamps
    first_seen = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_activity = Column(DateTime(timezone=True), nullable=True)
    last_contacted = Column(DateTime(timezone=True), nullable=True)
    
    # GDPR/Privacy
    consent_given = Column(Boolean, default=False, nullable=False)
    consent_date = Column(DateTime(timezone=True), nullable=True)
    unsubscribed = Column(Boolean, default=False, nullable=False)
    unsubscribed_date = Column(DateTime(timezone=True), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    organization = relationship("Organization", back_populates="leads")
    scores = relationship("LeadScore", back_populates="lead", cascade="all, delete-orphan")
    activities = relationship("LeadActivity", back_populates="lead", cascade="all, delete-orphan")
    score_history = relationship("ScoreHistory", back_populates="lead", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint("org_id", "email", name="uq_org_lead_email"),
        Index("idx_lead_org", "org_id"),
        Index("idx_lead_email", "email"),
        Index("idx_lead_status", "status"),
        Index("idx_lead_source", "source"),
        Index("idx_lead_company", "company"),
        Index("idx_lead_last_activity", "last_activity"),
        Index("idx_lead_tags", "tags", postgresql_using="gin"),
        Index("idx_lead_custom_fields", "custom_fields", postgresql_using="gin"),
    )
    
    @property
    def full_name(self) -> str:
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.first_name or self.last_name or self.email


class LeadScore(Base, UUIDMixin, TimestampMixin):
    """Current lead scores"""
    __tablename__ = "lead_scores"
    
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)
    model_id = Column(UUID(as_uuid=True), ForeignKey("scoring_models.id"), nullable=False)
    
    # Scores
    total_score = Column(Float, nullable=False)
    demographic_score = Column(Float, nullable=False)
    behavioral_score = Column(Float, nullable=False)
    fit_score = Column(Float, nullable=False)
    
    # Score breakdown
    score_factors = Column(JSONB, default={}, nullable=False)
    model_version = Column(String(50), nullable=False)
    confidence = Column(Float, nullable=True)
    
    # Prediction
    predicted_conversion_probability = Column(Float, nullable=True)
    predicted_value = Column(Float, nullable=True)
    predicted_timeline_days = Column(Integer, nullable=True)
    
    # Explanations
    explanations = Column(JSONB, default={}, nullable=False)
    feature_importance = Column(JSONB, default={}, nullable=False)
    
    # Relationships
    lead = relationship("Lead", back_populates="scores")
    model = relationship("ScoringModel", back_populates="scores")
    
    __table_args__ = (
        UniqueConstraint("lead_id", "model_id", name="uq_lead_model_score"),
        Index("idx_score_lead", "lead_id"),
        Index("idx_score_model", "model_id"),
        Index("idx_score_total", "total_score"),
        Index("idx_score_updated", "updated_at"),
    )


class LeadActivity(Base, UUIDMixin, TimestampMixin):
    """Lead activity tracking"""
    __tablename__ = "lead_activities"
    
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)
    
    activity_type = Column(Enum(ActivityType), nullable=False)
    value = Column(Float, nullable=True)  # Generic value field
    metadata = Column(JSONB, default={}, nullable=False)
    
    # Source tracking
    source = Column(String(100), nullable=True)
    campaign = Column(String(255), nullable=True)
    session_id = Column(String(255), nullable=True)
    
    # Timestamp
    occurred_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    lead = relationship("Lead", back_populates="activities")
    
    __table_args__ = (
        Index("idx_activity_lead", "lead_id"),
        Index("idx_activity_type", "activity_type"),
        Index("idx_activity_occurred", "occurred_at"),
        Index("idx_activity_source", "source"),
        Index("idx_activity_metadata", "metadata", postgresql_using="gin"),
    )


class ScoreHistory(Base, UUIDMixin, TimestampMixin):
    """Historical lead scores for tracking changes"""
    __tablename__ = "score_history"
    
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)
    
    # Previous scores
    previous_total_score = Column(Float, nullable=True)
    new_total_score = Column(Float, nullable=False)
    score_change = Column(Float, nullable=False)
    
    # Change details
    factors_changed = Column(JSONB, default={}, nullable=False)
    trigger_event = Column(String(255), nullable=True)
    model_version = Column(String(50), nullable=False)
    
    # Relationships
    lead = relationship("Lead", back_populates="score_history")
    
    __table_args__ = (
        Index("idx_history_lead", "lead_id"),
        Index("idx_history_created", "created_at"),
        Index("idx_history_change", "score_change"),
    )


# ML and Scoring Models
class ScoringModel(Base, UUIDMixin, TimestampMixin):
    """ML model configurations and metadata"""
    __tablename__ = "scoring_models"
    
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    version = Column(String(50), nullable=False)
    model_type = Column(Enum(ModelType), nullable=False)
    
    # Model configuration
    algorithm_params = Column(JSONB, default={}, nullable=False)
    feature_config = Column(JSONB, default={}, nullable=False)
    scoring_weights = Column(JSONB, default={}, nullable=False)
    
    # Performance metrics
    accuracy = Column(Float, nullable=True)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    auc_roc = Column(Float, nullable=True)
    
    # Model metadata
    training_data_size = Column(Integer, nullable=True)
    training_date = Column(DateTime(timezone=True), nullable=True)
    last_evaluation_date = Column(DateTime(timezone=True), nullable=True)
    
    # Storage
    model_path = Column(String(500), nullable=True)
    model_artifact_id = Column(String(255), nullable=True)  # MLflow run ID
    
    # Status
    is_active = Column(Boolean, default=False, nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    organization = relationship("Organization", back_populates="scoring_models")
    scores = relationship("LeadScore", back_populates="model")
    
    __table_args__ = (
        UniqueConstraint("org_id", "name", "version", name="uq_org_model_version"),
        Index("idx_model_org", "org_id"),
        Index("idx_model_type", "model_type"),
        Index("idx_model_active", "is_active"),
        Index("idx_model_default", "is_default"),
    )


# Integration Models
class Integration(Base, UUIDMixin, TimestampMixin):
    """Third-party platform integrations"""
    __tablename__ = "integrations"
    
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(255), nullable=False)
    integration_type = Column(Enum(IntegrationType), nullable=False)
    
    # Configuration
    config = Column(JSONB, default={}, nullable=False)
    credentials = Column(JSONB, default={}, nullable=False)  # Encrypted
    mapping_config = Column(JSONB, default={}, nullable=False)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    last_sync = Column(DateTime(timezone=True), nullable=True)
    sync_status = Column(String(50), default="pending", nullable=False)
    sync_error = Column(Text, nullable=True)
    
    # Relationships
    organization = relationship("Organization", back_populates="integrations")
    
    __table_args__ = (
        UniqueConstraint("org_id", "integration_type", name="uq_org_integration_type"),
        Index("idx_integration_org", "org_id"),
        Index("idx_integration_type", "integration_type"),
        Index("idx_integration_active", "is_active"),
        Index("idx_integration_sync", "last_sync"),
    )


# Audit and Compliance
class AuditLog(Base, UUIDMixin, TimestampMixin):
    """Audit trail for compliance and security"""
    __tablename__ = "audit_logs"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=True)
    
    # Event details
    event_type = Column(String(100), nullable=False)
    resource_type = Column(String(100), nullable=False)
    resource_id = Column(String(255), nullable=True)
    action = Column(String(100), nullable=False)
    
    # Request details
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    request_path = Column(String(500), nullable=True)
    request_method = Column(String(10), nullable=True)
    
    # Change tracking
    old_values = Column(JSONB, default={}, nullable=False)
    new_values = Column(JSONB, default={}, nullable=False)
    metadata = Column(JSONB, default={}, nullable=False)
    
    # Status
    status = Column(String(50), nullable=False)  # success, failure, error
    error_message = Column(Text, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")
    
    __table_args__ = (
        Index("idx_audit_user", "user_id"),
        Index("idx_audit_org", "org_id"),
        Index("idx_audit_event", "event_type"),
        Index("idx_audit_resource", "resource_type", "resource_id"),
        Index("idx_audit_created", "created_at"),
        Index("idx_audit_ip", "ip_address"),
    )


# Configuration and Settings
class SystemConfig(Base, UUIDMixin, TimestampMixin):
    """System-wide configuration"""
    __tablename__ = "system_config"
    
    key = Column(String(255), unique=True, nullable=False)
    value = Column(JSONB, nullable=False)
    description = Column(Text, nullable=True)
    is_public = Column(Boolean, default=False, nullable=False)
    
    __table_args__ = (
        Index("idx_config_key", "key"),
        Index("idx_config_public", "is_public"),
    )