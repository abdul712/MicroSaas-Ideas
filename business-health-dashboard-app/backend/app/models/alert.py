"""
Alert model for intelligent business health alerting system
"""

from sqlalchemy import String, Text, Numeric, Boolean, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from typing import Optional
from datetime import datetime, timezone
import enum

from app.core.database import Base


class AlertSeverity(enum.Enum):
    """Alert severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AlertStatus(enum.Enum):
    """Alert status lifecycle"""
    ACTIVE = "active"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"
    SUPPRESSED = "suppressed"


class AlertCategory(enum.Enum):
    """Alert categories matching health score categories"""
    FINANCIAL = "financial"
    CUSTOMER = "customer"
    OPERATIONAL = "operational"
    GROWTH = "growth"
    RISK = "risk"
    SYSTEM = "system"


class Alert(Base):
    """
    Intelligent alert system for business health monitoring
    """
    __tablename__ = "alerts"
    
    # Foreign key to organization (for multi-tenancy)
    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Alert basic information
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Alert classification
    severity: Mapped[AlertSeverity] = mapped_column(
        SQLEnum(AlertSeverity, name="alert_severity"),
        nullable=False,
        index=True
    )
    category: Mapped[AlertCategory] = mapped_column(
        SQLEnum(AlertCategory, name="alert_category"),
        nullable=False,
        index=True
    )
    
    # Alert status and lifecycle
    status: Mapped[AlertStatus] = mapped_column(
        SQLEnum(AlertStatus, name="alert_status"),
        default=AlertStatus.ACTIVE,
        nullable=False,
        index=True
    )
    
    # Metric context
    metric_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    threshold_value: Mapped[Optional[float]] = mapped_column(Numeric(15, 2), nullable=True)
    current_value: Mapped[Optional[float]] = mapped_column(Numeric(15, 2), nullable=True)
    threshold_operator: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)  # >, <, >=, <=, ==
    
    # Alert conditions and rules
    condition_expression: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    rule_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # AI/ML insights
    is_anomaly: Mapped[bool] = mapped_column(default=False, nullable=False)
    confidence_score: Mapped[Optional[float]] = mapped_column(Numeric(3, 2), nullable=True)  # 0.0 to 1.0
    predicted_impact: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # low, medium, high
    
    # Timing information
    triggered_at: Mapped[datetime] = mapped_column(nullable=False, index=True)
    acknowledged_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    
    # Resolution information
    acknowledged_by: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    resolved_by: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    resolution_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Notification settings
    notification_sent: Mapped[bool] = mapped_column(default=False, nullable=False)
    notification_channels: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # email,slack,sms
    escalation_level: Mapped[int] = mapped_column(default=0, nullable=False)
    
    # Auto-resolution settings
    auto_resolve: Mapped[bool] = mapped_column(default=False, nullable=False)
    auto_resolve_after_hours: Mapped[Optional[int]] = mapped_column(nullable=True)
    
    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="alerts")
    acknowledged_by_user: Mapped[Optional["User"]] = relationship("User", foreign_keys=[acknowledged_by])
    resolved_by_user: Mapped[Optional["User"]] = relationship("User", foreign_keys=[resolved_by])
    
    def __repr__(self) -> str:
        return f"<Alert(id={self.id}, title={self.title}, severity={self.severity.value}, status={self.status.value})>"
    
    def to_dict(self, include_relationships: bool = False) -> dict:
        """Convert alert to dictionary"""
        data = {
            "id": self.id,
            "organization_id": self.organization_id,
            "title": self.title,
            "description": self.description,
            "severity": self.severity.value,
            "category": self.category.value,
            "status": self.status.value,
            "metric_type": self.metric_type,
            "threshold_value": float(self.threshold_value) if self.threshold_value else None,
            "current_value": float(self.current_value) if self.current_value else None,
            "threshold_operator": self.threshold_operator,
            "condition_expression": self.condition_expression,
            "rule_id": self.rule_id,
            "is_anomaly": self.is_anomaly,
            "confidence_score": float(self.confidence_score) if self.confidence_score else None,
            "predicted_impact": self.predicted_impact,
            "triggered_at": self.triggered_at.isoformat() if self.triggered_at else None,
            "acknowledged_at": self.acknowledged_at.isoformat() if self.acknowledged_at else None,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "acknowledged_by": self.acknowledged_by,
            "resolved_by": self.resolved_by,
            "resolution_notes": self.resolution_notes,
            "notification_sent": self.notification_sent,
            "notification_channels": self.notification_channels,
            "escalation_level": self.escalation_level,
            "auto_resolve": self.auto_resolve,
            "auto_resolve_after_hours": self.auto_resolve_after_hours,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        
        if include_relationships:
            data.update({
                "acknowledged_by_user": self.acknowledged_by_user.to_dict() if self.acknowledged_by_user else None,
                "resolved_by_user": self.resolved_by_user.to_dict() if self.resolved_by_user else None,
            })
        
        return data
    
    @property
    def is_active(self) -> bool:
        """Check if alert is currently active"""
        return self.status == AlertStatus.ACTIVE
    
    @property
    def is_resolved(self) -> bool:
        """Check if alert is resolved"""
        return self.status == AlertStatus.RESOLVED
    
    @property
    def is_high_priority(self) -> bool:
        """Check if alert is high priority (high or critical severity)"""
        return self.severity in [AlertSeverity.HIGH, AlertSeverity.CRITICAL]
    
    @property
    def age_hours(self) -> float:
        """Get alert age in hours"""
        if not self.triggered_at:
            return 0
        
        now = datetime.now(timezone.utc)
        if self.triggered_at.tzinfo is None:
            triggered_at = self.triggered_at.replace(tzinfo=timezone.utc)
        else:
            triggered_at = self.triggered_at
            
        delta = now - triggered_at
        return delta.total_seconds() / 3600
    
    @property
    def severity_color(self) -> str:
        """Get color code for severity"""
        colors = {
            AlertSeverity.LOW: "#10B981",      # green
            AlertSeverity.MEDIUM: "#F59E0B",   # amber
            AlertSeverity.HIGH: "#EF4444",     # red
            AlertSeverity.CRITICAL: "#DC2626"  # dark red
        }
        return colors.get(self.severity, "#6B7280")  # gray default
    
    @property
    def severity_icon(self) -> str:
        """Get icon for severity"""
        icons = {
            AlertSeverity.LOW: "information-circle",
            AlertSeverity.MEDIUM: "exclamation-triangle",
            AlertSeverity.HIGH: "exclamation-circle",
            AlertSeverity.CRITICAL: "fire"
        }
        return icons.get(self.severity, "bell")
    
    def acknowledge(self, user_id: str, notes: str = None) -> None:
        """Acknowledge the alert"""
        if self.status == AlertStatus.ACTIVE:
            self.status = AlertStatus.ACKNOWLEDGED
            self.acknowledged_at = datetime.now(timezone.utc)
            self.acknowledged_by = user_id
            if notes:
                self.resolution_notes = notes
    
    def resolve(self, user_id: str, notes: str = None) -> None:
        """Resolve the alert"""
        if self.status in [AlertStatus.ACTIVE, AlertStatus.ACKNOWLEDGED]:
            self.status = AlertStatus.RESOLVED
            self.resolved_at = datetime.now(timezone.utc)
            self.resolved_by = user_id
            if notes:
                self.resolution_notes = notes
    
    def suppress(self) -> None:
        """Suppress the alert"""
        if self.status == AlertStatus.ACTIVE:
            self.status = AlertStatus.SUPPRESSED
    
    def escalate(self) -> None:
        """Escalate the alert to next level"""
        self.escalation_level += 1
    
    def should_auto_resolve(self) -> bool:
        """Check if alert should be auto-resolved"""
        if not self.auto_resolve or not self.auto_resolve_after_hours:
            return False
        
        return self.age_hours >= self.auto_resolve_after_hours
    
    @classmethod
    def create_threshold_alert(
        cls,
        organization_id: str,
        title: str,
        metric_type: str,
        current_value: float,
        threshold_value: float,
        threshold_operator: str,
        severity: AlertSeverity = AlertSeverity.MEDIUM,
        category: AlertCategory = AlertCategory.OPERATIONAL,
        description: str = None,
        rule_id: str = None
    ) -> "Alert":
        """Create a threshold-based alert"""
        
        if description is None:
            description = f"{metric_type} is {current_value} which {threshold_operator} {threshold_value}"
        
        return cls(
            organization_id=organization_id,
            title=title,
            description=description,
            severity=severity,
            category=category,
            metric_type=metric_type,
            threshold_value=threshold_value,
            current_value=current_value,
            threshold_operator=threshold_operator,
            rule_id=rule_id,
            triggered_at=datetime.now(timezone.utc)
        )
    
    @classmethod
    def create_anomaly_alert(
        cls,
        organization_id: str,
        title: str,
        metric_type: str,
        current_value: float,
        confidence_score: float,
        predicted_impact: str = "medium",
        severity: AlertSeverity = AlertSeverity.HIGH,
        category: AlertCategory = AlertCategory.OPERATIONAL,
        description: str = None
    ) -> "Alert":
        """Create an anomaly detection alert"""
        
        if description is None:
            description = f"Anomaly detected in {metric_type}: current value {current_value} is unusual"
        
        return cls(
            organization_id=organization_id,
            title=title,
            description=description,
            severity=severity,
            category=category,
            metric_type=metric_type,
            current_value=current_value,
            is_anomaly=True,
            confidence_score=confidence_score,
            predicted_impact=predicted_impact,
            triggered_at=datetime.now(timezone.utc)
        )
    
    @classmethod
    def get_severity_thresholds(cls) -> dict:
        """Get default severity thresholds for different metrics"""
        return {
            "revenue": {
                "critical": {"operator": "<", "value": 0.5, "period": "week"},  # 50% drop
                "high": {"operator": "<", "value": 0.7, "period": "week"},      # 30% drop
                "medium": {"operator": "<", "value": 0.85, "period": "week"}    # 15% drop
            },
            "cash_flow": {
                "critical": {"operator": "<", "value": 0, "period": "month"},   # Negative cash flow
                "high": {"operator": "<", "value": 0.2, "period": "month"},     # 80% drop
                "medium": {"operator": "<", "value": 0.5, "period": "month"}    # 50% drop
            },
            "churn_rate": {
                "critical": {"operator": ">", "value": 0.1, "period": "month"}, # 10% monthly churn
                "high": {"operator": ">", "value": 0.07, "period": "month"},    # 7% monthly churn
                "medium": {"operator": ">", "value": 0.05, "period": "month"}   # 5% monthly churn
            }
        }