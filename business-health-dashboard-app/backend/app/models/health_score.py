"""
Health score model for business health calculations
"""

from sqlalchemy import Integer, JSON, ForeignKey, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from typing import Optional, Dict, List
from datetime import datetime, timezone

from app.core.database import Base


class HealthScore(Base):
    """
    Business health scores calculated from metrics
    This table will be converted to a TimescaleDB hypertable for time-series storage
    """
    __tablename__ = "health_scores"
    
    # Foreign key to organization (for multi-tenancy)
    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Overall health score (0-100)
    overall_score: Mapped[int] = mapped_column(
        Integer,
        CheckConstraint("overall_score >= 0 AND overall_score <= 100"),
        nullable=False,
        index=True
    )
    
    # Category scores (0-100 each)
    financial_score: Mapped[int] = mapped_column(
        Integer,
        CheckConstraint("financial_score >= 0 AND financial_score <= 100"),
        nullable=False
    )
    customer_score: Mapped[int] = mapped_column(
        Integer,
        CheckConstraint("customer_score >= 0 AND customer_score <= 100"),
        nullable=False
    )
    operational_score: Mapped[int] = mapped_column(
        Integer,
        CheckConstraint("operational_score >= 0 AND operational_score <= 100"),
        nullable=False
    )
    growth_score: Mapped[int] = mapped_column(
        Integer,
        CheckConstraint("growth_score >= 0 AND growth_score <= 100"),
        nullable=False
    )
    risk_score: Mapped[int] = mapped_column(
        Integer,
        CheckConstraint("risk_score >= 0 AND risk_score <= 100"),
        nullable=False
    )
    
    # Detailed insights and breakdown
    insights: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    
    # Score calculation metadata
    calculation_metadata: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    
    # When this score was calculated
    calculated_at: Mapped[datetime] = mapped_column(nullable=False, index=True)
    
    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="health_scores")
    
    def __repr__(self) -> str:
        return f"<HealthScore(id={self.id}, overall={self.overall_score}, calculated_at={self.calculated_at})>"
    
    def to_dict(self) -> dict:
        """Convert health score to dictionary"""
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "overall_score": self.overall_score,
            "financial_score": self.financial_score,
            "customer_score": self.customer_score,
            "operational_score": self.operational_score,
            "growth_score": self.growth_score,
            "risk_score": self.risk_score,
            "insights": self.insights,
            "calculation_metadata": self.calculation_metadata,
            "calculated_at": self.calculated_at.isoformat() if self.calculated_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
    
    @property
    def score_breakdown(self) -> Dict[str, int]:
        """Get all category scores as a dictionary"""
        return {
            "financial": self.financial_score,
            "customer": self.customer_score,
            "operational": self.operational_score,
            "growth": self.growth_score,
            "risk": self.risk_score
        }
    
    @property
    def health_status(self) -> str:
        """Get health status based on overall score"""
        if self.overall_score >= 80:
            return "excellent"
        elif self.overall_score >= 60:
            return "good"
        elif self.overall_score >= 40:
            return "fair"
        elif self.overall_score >= 20:
            return "poor"
        else:
            return "critical"
    
    @property
    def health_color(self) -> str:
        """Get color code for health status"""
        status_colors = {
            "excellent": "#10B981",  # green
            "good": "#059669",       # emerald
            "fair": "#F59E0B",       # amber
            "poor": "#EF4444",       # red
            "critical": "#DC2626"    # dark red
        }
        return status_colors.get(self.health_status, "#6B7280")  # gray default
    
    @property
    def trend_direction(self) -> Optional[str]:
        """Get trend direction from metadata"""
        return self.calculation_metadata.get("trend", {}).get("direction")
    
    @property
    def trend_percentage(self) -> Optional[float]:
        """Get trend percentage from metadata"""
        return self.calculation_metadata.get("trend", {}).get("percentage")
    
    def get_category_insights(self, category: str) -> List[Dict]:
        """Get insights for a specific category"""
        return self.insights.get(category, {}).get("insights", [])
    
    def get_recommendations(self) -> List[Dict]:
        """Get actionable recommendations"""
        recommendations = []
        for category in ["financial", "customer", "operational", "growth", "risk"]:
            category_recs = self.insights.get(category, {}).get("recommendations", [])
            recommendations.extend(category_recs)
        return recommendations
    
    def get_alerts(self) -> List[Dict]:
        """Get alerts from insights"""
        alerts = []
        for category in ["financial", "customer", "operational", "growth", "risk"]:
            category_alerts = self.insights.get(category, {}).get("alerts", [])
            alerts.extend(category_alerts)
        return alerts
    
    @classmethod
    def calculate_overall_score(
        cls,
        financial_score: int,
        customer_score: int,
        operational_score: int,
        growth_score: int,
        risk_score: int
    ) -> int:
        """
        Calculate overall health score using weighted average
        Weights defined in config: Financial(25%), Customer(25%), Operational(20%), Growth(20%), Risk(10%)
        """
        from app.core.config import HEALTH_SCORE_WEIGHTS
        
        weights = HEALTH_SCORE_WEIGHTS
        weighted_score = (
            financial_score * weights["financial"] +
            customer_score * weights["customer"] +
            operational_score * weights["operational"] +
            growth_score * weights["growth"] +
            (100 - risk_score) * weights["risk"]  # Risk is inverted (lower risk = better health)
        )
        
        return min(max(int(weighted_score), 0), 100)
    
    @classmethod
    def create_health_score(
        cls,
        organization_id: str,
        financial_score: int,
        customer_score: int,
        operational_score: int,
        growth_score: int,
        risk_score: int,
        insights: Dict = None,
        calculation_metadata: Dict = None,
        calculated_at: datetime = None
    ) -> "HealthScore":
        """Create a new health score with calculated overall score"""
        
        overall_score = cls.calculate_overall_score(
            financial_score, customer_score, operational_score, growth_score, risk_score
        )
        
        if calculated_at is None:
            calculated_at = datetime.now(timezone.utc)
        
        return cls(
            organization_id=organization_id,
            overall_score=overall_score,
            financial_score=financial_score,
            customer_score=customer_score,
            operational_score=operational_score,
            growth_score=growth_score,
            risk_score=risk_score,
            insights=insights or {},
            calculation_metadata=calculation_metadata or {},
            calculated_at=calculated_at
        )
    
    @classmethod
    def get_score_insights_template(cls) -> Dict:
        """Get template for score insights structure"""
        return {
            "financial": {
                "score": 0,
                "insights": [],
                "recommendations": [],
                "alerts": [],
                "metrics_used": []
            },
            "customer": {
                "score": 0,
                "insights": [],
                "recommendations": [],
                "alerts": [],
                "metrics_used": []
            },
            "operational": {
                "score": 0,
                "insights": [],
                "recommendations": [],
                "alerts": [],
                "metrics_used": []
            },
            "growth": {
                "score": 0,
                "insights": [],
                "recommendations": [],
                "alerts": [],
                "metrics_used": []
            },
            "risk": {
                "score": 0,
                "insights": [],
                "recommendations": [],
                "alerts": [],
                "metrics_used": []
            }
        }
    
    @classmethod
    def get_calculation_metadata_template(cls) -> Dict:
        """Get template for calculation metadata"""
        return {
            "version": "1.0",
            "algorithm": "weighted_average",
            "weights": {
                "financial": 0.25,
                "customer": 0.25,
                "operational": 0.20,
                "growth": 0.20,
                "risk": 0.10
            },
            "data_quality": {
                "completeness": 0.0,  # Percentage of expected metrics available
                "freshness": 0.0,     # Average age of metrics in hours
                "confidence": 0.0     # Average confidence score of metrics
            },
            "trend": {
                "direction": None,     # "up", "down", "stable"
                "percentage": None,    # Percentage change from previous score
                "period": "30d"        # Comparison period
            },
            "benchmarks": {
                "industry_percentile": None,
                "size_percentile": None
            }
        }