"""
SQLAlchemy Models Package
Database models for the Lead Scoring Tool
"""

from app.models.organization import Organization
from app.models.user import User
from app.models.lead import Lead, LeadScore, LeadActivity, LeadScoreHistory
from app.models.scoring_model import ScoringModel, ScoringRule, ModelPerformance
from app.models.integration import Integration, IntegrationConfig, WebhookEvent
from app.models.audit import AuditLog, DataProcessingRecord, ConsentRecord

__all__ = [
    # Organization and User Management
    "Organization",
    "User",
    
    # Lead Management
    "Lead",
    "LeadScore", 
    "LeadActivity",
    "LeadScoreHistory",
    
    # ML Models and Scoring
    "ScoringModel",
    "ScoringRule",
    "ModelPerformance",
    
    # External Integrations
    "Integration",
    "IntegrationConfig",
    "WebhookEvent",
    
    # Compliance and Auditing
    "AuditLog",
    "DataProcessingRecord",
    "ConsentRecord",
]