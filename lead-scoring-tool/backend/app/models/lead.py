"""
Lead Models - Core lead management and scoring
"""

from sqlalchemy import (
    Column, String, DateTime, Boolean, Text, JSON, ForeignKey, 
    Integer, Float, Enum, Index
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from typing import Optional, Dict, Any, List

from app.core.database import Base


class LeadStatus(str, enum.Enum):
    """Lead status enumeration."""
    NEW = "new"
    QUALIFIED = "qualified"
    UNQUALIFIED = "unqualified"
    CONTACTED = "contacted"
    CONVERTED = "converted"
    LOST = "lost"


class LeadSource(str, enum.Enum):
    """Lead source enumeration."""
    WEBSITE = "website"
    EMAIL_CAMPAIGN = "email_campaign"
    SOCIAL_MEDIA = "social_media"
    PAID_ADS = "paid_ads"
    REFERRAL = "referral"
    WEBINAR = "webinar"
    TRADE_SHOW = "trade_show"
    COLD_OUTREACH = "cold_outreach"
    ORGANIC_SEARCH = "organic_search"
    DIRECT = "direct"
    IMPORT = "import"
    API = "api"
    OTHER = "other"


class ActivityType(str, enum.Enum):
    """Lead activity type enumeration."""
    PAGE_VIEW = "page_view"
    EMAIL_OPEN = "email_open"
    EMAIL_CLICK = "email_click"
    FORM_SUBMISSION = "form_submission"
    CONTENT_DOWNLOAD = "content_download"
    WEBINAR_ATTENDANCE = "webinar_attendance"
    VIDEO_WATCH = "video_watch"
    SOCIAL_ENGAGEMENT = "social_engagement"
    PHONE_CALL = "phone_call"
    MEETING_BOOKED = "meeting_booked"
    DEMO_REQUESTED = "demo_requested"
    PRICING_PAGE = "pricing_page"
    TRIAL_SIGNUP = "trial_signup"
    PURCHASE = "purchase"


class Lead(Base):
    """
    Lead model - Core entity for lead management and scoring.
    """
    __tablename__ = "leads"
    
    # Composite index for performance
    __table_args__ = (
        Index('idx_org_email', 'organization_id', 'email'),
        Index('idx_org_status_score', 'organization_id', 'status', 'current_score'),
        Index('idx_created_updated', 'created_at', 'updated_at'),
    )

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # Foreign Keys
    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Lead Identification
    email = Column(String(255), nullable=False, index=True)
    external_id = Column(String(255), nullable=True)  # ID from external system
    
    # Personal Information
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    full_name = Column(String(200), nullable=True)
    phone = Column(String(50), nullable=True)
    
    # Company Information
    company_name = Column(String(255), nullable=True, index=True)
    company_domain = Column(String(255), nullable=True, index=True)
    job_title = Column(String(200), nullable=True)
    department = Column(String(100), nullable=True)
    seniority_level = Column(String(50), nullable=True)
    
    # Company Details
    company_size = Column(String(50), nullable=True)  # e.g., "1-10", "11-50", "51-200"
    annual_revenue = Column(String(50), nullable=True)  # e.g., "$1M-$10M"
    industry = Column(String(100), nullable=True, index=True)
    
    # Location Information
    country = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    timezone = Column(String(50), nullable=True)
    
    # Lead Management
    status = Column(Enum(LeadStatus), nullable=False, default=LeadStatus.NEW, index=True)
    source = Column(Enum(LeadSource), nullable=False, default=LeadSource.OTHER, index=True)
    campaign_id = Column(String(255), nullable=True, index=True)
    utm_source = Column(String(255), nullable=True)
    utm_medium = Column(String(255), nullable=True)
    utm_campaign = Column(String(255), nullable=True)
    
    # Scoring Information
    current_score = Column(Integer, nullable=False, default=0, index=True)
    previous_score = Column(Integer, nullable=True)
    demographic_score = Column(Integer, nullable=False, default=0)
    behavioral_score = Column(Integer, nullable=False, default=0)
    fit_score = Column(Integer, nullable=False, default=0)
    
    # Score Details
    score_breakdown = Column(JSON, nullable=True)  # Detailed scoring factors
    score_explanation = Column(Text, nullable=True)  # Human-readable explanation
    last_scored_at = Column(DateTime(timezone=True), nullable=True)
    scoring_model_version = Column(String(50), nullable=True)
    
    # Engagement Metrics
    email_engagement_score = Column(Float, nullable=False, default=0.0)
    website_engagement_score = Column(Float, nullable=False, default=0.0)
    social_engagement_score = Column(Float, nullable=False, default=0.0)
    
    # Activity Tracking
    first_seen = Column(DateTime(timezone=True), nullable=True)
    last_seen = Column(DateTime(timezone=True), nullable=True)
    total_activities = Column(Integer, nullable=False, default=0)
    last_activity_type = Column(Enum(ActivityType), nullable=True)
    
    # Communication Tracking
    emails_sent = Column(Integer, nullable=False, default=0)
    emails_opened = Column(Integer, nullable=False, default=0)
    emails_clicked = Column(Integer, nullable=False, default=0)
    last_email_opened = Column(DateTime(timezone=True), nullable=True)
    last_email_clicked = Column(DateTime(timezone=True), nullable=True)
    
    # Conversion Tracking
    conversion_probability = Column(Float, nullable=True)  # 0.0 to 1.0
    estimated_value = Column(Float, nullable=True)  # Estimated deal value
    actual_value = Column(Float, nullable=True)  # Actual deal value if converted
    converted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Assignment and Ownership
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    assigned_at = Column(DateTime(timezone=True), nullable=True)
    
    # Custom Fields and Tags
    custom_fields = Column(JSON, nullable=True)
    tags = Column(JSON, nullable=True)  # Array of tags
    
    # Data Quality
    data_quality_score = Column(Float, nullable=False, default=0.0)  # 0.0 to 1.0
    missing_fields = Column(JSON, nullable=True)  # List of missing required fields
    
    # Privacy and Consent
    consent_given = Column(Boolean, nullable=False, default=False)
    consent_date = Column(DateTime(timezone=True), nullable=True)
    consent_source = Column(String(255), nullable=True)
    opt_out_date = Column(DateTime(timezone=True), nullable=True)
    
    # Integration Information
    integration_source = Column(String(100), nullable=True)  # CRM, Email platform, etc.
    integration_data = Column(JSON, nullable=True)  # Platform-specific data
    
    # Notes and Comments
    notes = Column(Text, nullable=True)
    
    # Audit Fields
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Soft Delete
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True, index=True)
    
    # Relationships
    organization = relationship("Organization", back_populates="leads")
    assigned_user = relationship("User", foreign_keys=[assigned_to])
    creator = relationship("User", foreign_keys=[created_by])
    updater = relationship("User", foreign_keys=[updated_by])
    
    activities = relationship("LeadActivity", back_populates="lead", lazy="dynamic")
    scores = relationship("LeadScore", back_populates="lead", lazy="dynamic")
    score_history = relationship("LeadScoreHistory", back_populates="lead", lazy="dynamic")
    
    def __repr__(self) -> str:
        return f"<Lead(id={self.id}, email='{self.email}', score={self.current_score})>"
    
    @property
    def display_name(self) -> str:
        """Get display name for the lead."""
        if self.full_name:
            return self.full_name
        elif self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name:
            return self.first_name
        else:
            return self.email
    
    @property
    def is_qualified(self) -> bool:
        """Check if lead is qualified."""
        return self.status == LeadStatus.QUALIFIED
    
    @property
    def is_converted(self) -> bool:
        """Check if lead is converted."""
        return self.status == LeadStatus.CONVERTED
    
    @property
    def engagement_rate(self) -> float:
        """Calculate overall engagement rate."""
        if self.emails_sent == 0:
            return 0.0
        return (self.emails_opened + self.emails_clicked) / (2 * self.emails_sent)
    
    @property
    def days_since_first_seen(self) -> Optional[int]:
        """Get days since first seen."""
        if not self.first_seen:
            return None
        return (func.now() - self.first_seen).days
    
    @property
    def days_since_last_activity(self) -> Optional[int]:
        """Get days since last activity."""
        if not self.last_seen:
            return None
        return (func.now() - self.last_seen).days
    
    def update_score(self, new_score: int, model_version: str = None, explanation: str = None) -> None:
        """Update lead score."""
        self.previous_score = self.current_score
        self.current_score = new_score
        self.last_scored_at = func.now()
        if model_version:
            self.scoring_model_version = model_version
        if explanation:
            self.score_explanation = explanation
    
    def add_tag(self, tag: str) -> None:
        """Add tag to lead."""
        if not self.tags:
            self.tags = []
        if tag not in self.tags:
            self.tags.append(tag)
    
    def remove_tag(self, tag: str) -> None:
        """Remove tag from lead."""
        if self.tags and tag in self.tags:
            self.tags.remove(tag)
    
    def has_tag(self, tag: str) -> bool:
        """Check if lead has tag."""
        return self.tags and tag in self.tags
    
    def set_custom_field(self, field_name: str, value: Any) -> None:
        """Set custom field value."""
        if not self.custom_fields:
            self.custom_fields = {}
        self.custom_fields[field_name] = value
    
    def get_custom_field(self, field_name: str, default: Any = None) -> Any:
        """Get custom field value."""
        if not self.custom_fields:
            return default
        return self.custom_fields.get(field_name, default)
    
    def calculate_data_quality_score(self) -> float:
        """Calculate data quality score based on completeness."""
        required_fields = [
            'email', 'first_name', 'last_name', 'company_name', 
            'job_title', 'industry', 'company_size'
        ]
        
        completed_fields = sum(1 for field in required_fields if getattr(self, field))
        return completed_fields / len(required_fields)
    
    def to_dict(self, include_activities: bool = False) -> Dict[str, Any]:
        """Convert lead to dictionary."""
        data = {
            "id": str(self.id),
            "organization_id": str(self.organization_id),
            "email": self.email,
            "external_id": self.external_id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "full_name": self.full_name,
            "display_name": self.display_name,
            "phone": self.phone,
            "company_name": self.company_name,
            "company_domain": self.company_domain,
            "job_title": self.job_title,
            "department": self.department,
            "industry": self.industry,
            "company_size": self.company_size,
            "annual_revenue": self.annual_revenue,
            "country": self.country,
            "state": self.state,
            "city": self.city,
            "status": self.status,
            "source": self.source,
            "current_score": self.current_score,
            "demographic_score": self.demographic_score,
            "behavioral_score": self.behavioral_score,
            "fit_score": self.fit_score,
            "score_breakdown": self.score_breakdown,
            "score_explanation": self.score_explanation,
            "engagement_rate": self.engagement_rate,
            "conversion_probability": self.conversion_probability,
            "estimated_value": self.estimated_value,
            "tags": self.tags or [],
            "custom_fields": self.custom_fields or {},
            "data_quality_score": self.data_quality_score,
            "consent_given": self.consent_given,
            "first_seen": self.first_seen.isoformat() if self.first_seen else None,
            "last_seen": self.last_seen.isoformat() if self.last_seen else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "is_active": self.is_active
        }
        
        if include_activities:
            data["recent_activities"] = [
                activity.to_dict() for activity in self.activities.limit(10)
            ]
        
        return data


class LeadActivity(Base):
    """
    Lead activity tracking for behavioral scoring.
    """
    __tablename__ = "lead_activities"
    
    __table_args__ = (
        Index('idx_lead_type_timestamp', 'lead_id', 'activity_type', 'timestamp'),
        Index('idx_org_type_timestamp', 'organization_id', 'activity_type', 'timestamp'),
    )

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # Foreign Keys
    lead_id = Column(
        UUID(as_uuid=True),
        ForeignKey("leads.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Activity Information
    activity_type = Column(Enum(ActivityType), nullable=False, index=True)
    activity_value = Column(String(500), nullable=True)  # URL, email subject, etc.
    activity_details = Column(JSON, nullable=True)  # Additional activity data
    
    # Scoring Impact
    points_awarded = Column(Integer, nullable=False, default=0)
    score_multiplier = Column(Float, nullable=False, default=1.0)
    
    # Metadata
    source_system = Column(String(100), nullable=True)  # Website, email platform, etc.
    ip_address = Column(String(45), nullable=True)  # IPv4 or IPv6
    user_agent = Column(String(500), nullable=True)
    
    # Tracking Information
    campaign_id = Column(String(255), nullable=True)
    utm_source = Column(String(255), nullable=True)
    utm_medium = Column(String(255), nullable=True)
    utm_campaign = Column(String(255), nullable=True)
    
    # Timing
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    duration = Column(Integer, nullable=True)  # Duration in seconds
    
    # Audit Fields
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    lead = relationship("Lead", back_populates="activities")
    organization = relationship("Organization")
    
    def __repr__(self) -> str:
        return f"<LeadActivity(id={self.id}, type={self.activity_type}, points={self.points_awarded})>"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert activity to dictionary."""
        return {
            "id": str(self.id),
            "lead_id": str(self.lead_id),
            "activity_type": self.activity_type,
            "activity_value": self.activity_value,
            "activity_details": self.activity_details,
            "points_awarded": self.points_awarded,
            "score_multiplier": self.score_multiplier,
            "source_system": self.source_system,
            "timestamp": self.timestamp.isoformat(),
            "duration": self.duration,
            "campaign_id": self.campaign_id,
            "utm_source": self.utm_source,
            "utm_medium": self.utm_medium,
            "utm_campaign": self.utm_campaign,
            "created_at": self.created_at.isoformat()
        }