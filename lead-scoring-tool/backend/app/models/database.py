"""
Database models for the Lead Scoring Tool
"""

import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List
from enum import Enum

from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, JSON,
    ForeignKey, Index, UniqueConstraint, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

Base = declarative_base()


class TimestampMixin:
    """Mixin for created_at and updated_at timestamps"""
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)


class Organization(Base, TimestampMixin):
    """Organization model"""
    __tablename__ = "organizations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    domain = Column(String(255), unique=True)
    industry = Column(String(100))
    size_category = Column(String(50))  # startup, small, medium, large, enterprise
    settings = Column(JSONB, default=dict)
    
    # Billing information
    subscription_tier = Column(String(50), default="starter")
    subscription_status = Column(String(50), default="active")
    billing_email = Column(String(255))
    
    # Relationships
    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    leads = relationship("Lead", back_populates="organization", cascade="all, delete-orphan")
    scoring_models = relationship("ScoringModel", back_populates="organization", cascade="all, delete-orphan")
    integrations = relationship("Integration", back_populates="organization", cascade="all, delete-orphan")


class User(Base, TimestampMixin):
    """User model"""
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    
    email = Column(String(255), unique=True, nullable=False)
    first_name = Column(String(100))
    last_name = Column(String(100))
    password_hash = Column(String(255), nullable=False)
    
    role = Column(String(50), default="user")  # admin, manager, user, viewer
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    last_login_at = Column(DateTime)
    
    # Profile information
    avatar_url = Column(String(500))
    timezone = Column(String(50), default="UTC")
    preferences = Column(JSONB, default=dict)
    
    # Relationships
    organization = relationship("Organization", back_populates="users")
    
    __table_args__ = (
        Index("idx_users_email", "email"),
        Index("idx_users_organization", "organization_id"),
    )


class Lead(Base, TimestampMixin):
    """Lead model"""
    __tablename__ = "leads"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    
    # Contact information
    email = Column(String(255), nullable=False)
    first_name = Column(String(100))
    last_name = Column(String(100))
    company = Column(String(255))
    job_title = Column(String(255))
    phone = Column(String(50))
    
    # Lead metadata
    source = Column(String(100))  # website, email_campaign, social_media, etc.
    status = Column(String(50), default="new")  # new, qualified, unqualified, contacted, converted
    tags = Column(JSONB, default=list)
    
    # Scoring information
    current_score = Column(Integer, default=0)
    max_score = Column(Integer, default=0)
    score_trend = Column(String(20))  # increasing, decreasing, stable
    
    # Activity tracking
    last_activity_at = Column(DateTime)
    first_contact_at = Column(DateTime)
    last_contacted_at = Column(DateTime)
    
    # Additional data
    custom_fields = Column(JSONB, default=dict)
    notes = Column(Text)
    
    # Relationships
    organization = relationship("Organization", back_populates="leads")
    scores = relationship("LeadScore", back_populates="lead", cascade="all, delete-orphan")
    activities = relationship("LeadActivity", back_populates="lead", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint("organization_id", "email", name="uq_organization_lead_email"),
        Index("idx_leads_organization", "organization_id"),
        Index("idx_leads_email", "email"),
        Index("idx_leads_score", "current_score"),
        Index("idx_leads_status", "status"),
        Index("idx_leads_last_activity", "last_activity_at"),
    )


class ScoringModel(Base, TimestampMixin):
    """Scoring model configuration"""
    __tablename__ = "scoring_models"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    
    name = Column(String(255), nullable=False)
    description = Column(Text)
    version = Column(String(20), nullable=False)
    model_type = Column(String(50), nullable=False)  # behavioral, demographic, composite
    
    # Model configuration
    config = Column(JSONB, nullable=False)
    features = Column(JSONB, default=list)
    weights = Column(JSONB, default=dict)
    
    # Model status
    is_active = Column(Boolean, default=False)
    is_training = Column(Boolean, default=False)
    training_status = Column(String(50))  # pending, running, completed, failed
    
    # Performance metrics
    performance_metrics = Column(JSONB, default=dict)
    accuracy_score = Column(Float)
    precision_score = Column(Float)
    recall_score = Column(Float)
    f1_score = Column(Float)
    
    # Model artifacts
    model_path = Column(String(500))
    training_data_path = Column(String(500))
    
    # Relationships
    organization = relationship("Organization", back_populates="scoring_models")
    scores = relationship("LeadScore", back_populates="model")
    
    __table_args__ = (
        Index("idx_scoring_models_organization", "organization_id"),
        Index("idx_scoring_models_active", "is_active"),
        Index("idx_scoring_models_type", "model_type"),
    )


class LeadScore(Base, TimestampMixin):
    """Lead scoring history"""
    __tablename__ = "lead_scores"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"), nullable=False)
    model_id = Column(UUID(as_uuid=True), ForeignKey("scoring_models.id"), nullable=False)
    
    score = Column(Integer, nullable=False)
    confidence = Column(Float)
    score_breakdown = Column(JSONB, nullable=False)
    
    # Score components
    behavioral_score = Column(Integer, default=0)
    demographic_score = Column(Integer, default=0)
    engagement_score = Column(Integer, default=0)
    intent_score = Column(Integer, default=0)
    
    # Metadata
    scored_at = Column(DateTime, default=func.now(), nullable=False)
    trigger_event = Column(String(100))  # activity, manual, scheduled
    
    # Relationships
    lead = relationship("Lead", back_populates="scores")
    model = relationship("ScoringModel", back_populates="scores")
    
    __table_args__ = (
        Index("idx_lead_scores_lead", "lead_id"),
        Index("idx_lead_scores_model", "model_id"),
        Index("idx_lead_scores_scored_at", "scored_at"),
        Index("idx_lead_scores_score", "score"),
    )


class LeadActivity(Base, TimestampMixin):
    """Lead activity tracking"""
    __tablename__ = "lead_activities"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"), nullable=False)
    
    activity_type = Column(String(100), nullable=False)  # email_open, website_visit, form_submit, etc.
    activity_data = Column(JSONB, nullable=False)
    
    # Activity metadata
    source = Column(String(100))  # website, email, social, etc.
    source_url = Column(String(500))
    user_agent = Column(String(500))
    ip_address = Column(String(45))
    
    # Scoring impact
    score_impact = Column(Integer, default=0)
    processed = Column(Boolean, default=False)
    
    # Timestamp
    timestamp = Column(DateTime, default=func.now(), nullable=False)
    
    # Relationships
    lead = relationship("Lead", back_populates="activities")
    
    __table_args__ = (
        Index("idx_lead_activities_lead", "lead_id"),
        Index("idx_lead_activities_type", "activity_type"),
        Index("idx_lead_activities_timestamp", "timestamp"),
        Index("idx_lead_activities_processed", "processed"),
        Index("idx_lead_activities_source", "source"),
    )


class Integration(Base, TimestampMixin):
    """Third-party integrations"""
    __tablename__ = "integrations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    
    platform = Column(String(100), nullable=False)  # hubspot, salesforce, mailchimp, etc.
    name = Column(String(255), nullable=False)
    description = Column(Text)
    
    # Configuration
    config = Column(JSONB, nullable=False)
    credentials = Column(JSONB)  # Encrypted
    webhook_url = Column(String(500))
    
    # Status
    is_active = Column(Boolean, default=True)
    last_sync_at = Column(DateTime)
    sync_status = Column(String(50))  # success, error, in_progress
    sync_error = Column(Text)
    
    # Sync statistics
    total_synced = Column(Integer, default=0)
    last_sync_count = Column(Integer, default=0)
    
    # Relationships
    organization = relationship("Organization", back_populates="integrations")
    
    __table_args__ = (
        Index("idx_integrations_organization", "organization_id"),
        Index("idx_integrations_platform", "platform"),
        Index("idx_integrations_active", "is_active"),
    )


class Webhook(Base, TimestampMixin):
    """Webhook configuration"""
    __tablename__ = "webhooks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    
    name = Column(String(255), nullable=False)
    url = Column(String(500), nullable=False)
    secret = Column(String(255))
    
    # Event configuration
    events = Column(JSONB, default=list)  # lead_scored, lead_qualified, etc.
    is_active = Column(Boolean, default=True)
    
    # Delivery tracking
    last_delivery_at = Column(DateTime)
    delivery_count = Column(Integer, default=0)
    failure_count = Column(Integer, default=0)
    
    # Relationships
    organization = relationship("Organization")
    
    __table_args__ = (
        Index("idx_webhooks_organization", "organization_id"),
        Index("idx_webhooks_active", "is_active"),
    )


class AuditLog(Base, TimestampMixin):
    """Audit log for tracking changes"""
    __tablename__ = "audit_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    action = Column(String(100), nullable=False)  # create, update, delete, login, etc.
    resource_type = Column(String(100), nullable=False)  # lead, user, model, etc.
    resource_id = Column(String(100))
    
    # Change details
    old_values = Column(JSONB)
    new_values = Column(JSONB)
    
    # Request metadata
    ip_address = Column(String(45))
    user_agent = Column(String(500))
    request_id = Column(String(100))
    
    __table_args__ = (
        Index("idx_audit_logs_organization", "organization_id"),
        Index("idx_audit_logs_user", "user_id"),
        Index("idx_audit_logs_action", "action"),
        Index("idx_audit_logs_resource", "resource_type", "resource_id"),
        Index("idx_audit_logs_created_at", "created_at"),
    )