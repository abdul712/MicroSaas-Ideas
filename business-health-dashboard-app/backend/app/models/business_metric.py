"""
Business metrics model for time-series data storage
"""

from sqlalchemy import String, Numeric, JSON, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from typing import Optional, Dict, Any
from datetime import datetime, timezone
import enum

from app.core.database import Base


class MetricType(enum.Enum):
    """Different types of business metrics"""
    # Financial metrics
    REVENUE = "revenue"
    EXPENSES = "expenses"
    PROFIT = "profit"
    CASH_FLOW = "cash_flow"
    BURN_RATE = "burn_rate"
    RUNWAY_MONTHS = "runway_months"
    
    # Customer metrics
    TOTAL_CUSTOMERS = "total_customers"
    NEW_CUSTOMERS = "new_customers"
    LOST_CUSTOMERS = "lost_customers"
    CUSTOMER_ACQUISITION_COST = "customer_acquisition_cost"
    CUSTOMER_LIFETIME_VALUE = "customer_lifetime_value"
    CHURN_RATE = "churn_rate"
    RETENTION_RATE = "retention_rate"
    
    # Sales metrics
    TOTAL_SALES = "total_sales"
    CONVERSION_RATE = "conversion_rate"
    AVERAGE_ORDER_VALUE = "average_order_value"
    SALES_CYCLE_LENGTH = "sales_cycle_length"
    
    # Operational metrics
    EMPLOYEE_COUNT = "employee_count"
    PRODUCTIVITY_SCORE = "productivity_score"
    SYSTEM_UPTIME = "system_uptime"
    SUPPORT_TICKETS = "support_tickets"
    RESPONSE_TIME = "response_time"
    
    # Marketing metrics
    WEBSITE_TRAFFIC = "website_traffic"
    LEAD_COUNT = "lead_count"
    MARKETING_SPEND = "marketing_spend"
    COST_PER_LEAD = "cost_per_lead"
    
    # Growth metrics
    GROWTH_RATE = "growth_rate"
    MARKET_SHARE = "market_share"
    PRODUCT_USAGE = "product_usage"


class MetricCategory(enum.Enum):
    """Categories for organizing metrics"""
    FINANCIAL = "financial"
    CUSTOMER = "customer"
    OPERATIONAL = "operational"
    GROWTH = "growth"
    MARKETING = "marketing"


class BusinessMetric(Base):
    """
    Time-series business metrics data
    This table will be converted to a TimescaleDB hypertable for optimal time-series performance
    """
    __tablename__ = "business_metrics"
    
    # Foreign key to organization (for multi-tenancy)
    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Metric identification
    metric_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    
    # Metric value and metadata
    value: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    unit: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # USD, %, count, etc.
    
    # Additional metadata for context
    metadata: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    
    # Time dimension (critical for time-series)
    recorded_at: Mapped[datetime] = mapped_column(nullable=False, index=True)
    
    # Data source information
    source: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # manual, api, integration
    source_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # external ID from integration
    
    # Data quality indicators
    confidence: Mapped[Optional[float]] = mapped_column(Numeric(3, 2), nullable=True)  # 0.0 to 1.0
    is_estimated: Mapped[bool] = mapped_column(default=False, nullable=False)
    
    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="business_metrics")
    
    def __repr__(self) -> str:
        return f"<BusinessMetric(id={self.id}, type={self.metric_type}, value={self.value}, recorded_at={self.recorded_at})>"
    
    def to_dict(self) -> dict:
        """Convert metric to dictionary"""
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "metric_type": self.metric_type,
            "category": self.category,
            "value": float(self.value),
            "unit": self.unit,
            "metadata": self.metadata,
            "recorded_at": self.recorded_at.isoformat() if self.recorded_at else None,
            "source": self.source,
            "source_id": self.source_id,
            "confidence": float(self.confidence) if self.confidence else None,
            "is_estimated": self.is_estimated,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
    
    @property
    def formatted_value(self) -> str:
        """Get formatted value with unit"""
        if self.unit == "USD":
            return f"${self.value:,.2f}"
        elif self.unit == "%":
            return f"{self.value:.1f}%"
        elif self.unit == "days":
            return f"{self.value:.0f} days"
        else:
            return f"{self.value:,.2f}"
    
    @classmethod
    def create_metric(
        cls,
        organization_id: str,
        metric_type: str,
        value: float,
        category: str = None,
        unit: str = None,
        metadata: Dict[str, Any] = None,
        recorded_at: datetime = None,
        source: str = "manual",
        source_id: str = None,
        confidence: float = None,
        is_estimated: bool = False
    ) -> "BusinessMetric":
        """Create a new business metric with proper defaults"""
        
        # Auto-determine category if not provided
        if category is None:
            category = cls._get_category_for_metric_type(metric_type)
        
        # Use current time if not provided
        if recorded_at is None:
            recorded_at = datetime.now(timezone.utc)
        
        return cls(
            organization_id=organization_id,
            metric_type=metric_type,
            category=category,
            value=value,
            unit=unit,
            metadata=metadata or {},
            recorded_at=recorded_at,
            source=source,
            source_id=source_id,
            confidence=confidence,
            is_estimated=is_estimated
        )
    
    @staticmethod
    def _get_category_for_metric_type(metric_type: str) -> str:
        """Auto-determine category based on metric type"""
        financial_metrics = [
            "revenue", "expenses", "profit", "cash_flow", "burn_rate", "runway_months"
        ]
        customer_metrics = [
            "total_customers", "new_customers", "lost_customers", "customer_acquisition_cost",
            "customer_lifetime_value", "churn_rate", "retention_rate"
        ]
        operational_metrics = [
            "employee_count", "productivity_score", "system_uptime", "support_tickets", "response_time"
        ]
        growth_metrics = [
            "growth_rate", "market_share", "product_usage"
        ]
        marketing_metrics = [
            "website_traffic", "lead_count", "marketing_spend", "cost_per_lead"
        ]
        
        if metric_type in financial_metrics:
            return MetricCategory.FINANCIAL.value
        elif metric_type in customer_metrics:
            return MetricCategory.CUSTOMER.value
        elif metric_type in operational_metrics:
            return MetricCategory.OPERATIONAL.value
        elif metric_type in growth_metrics:
            return MetricCategory.GROWTH.value
        elif metric_type in marketing_metrics:
            return MetricCategory.MARKETING.value
        else:
            return MetricCategory.OPERATIONAL.value  # default
    
    @classmethod
    def get_metric_definition(cls, metric_type: str) -> dict:
        """Get metric definition with description and typical unit"""
        definitions = {
            # Financial metrics
            "revenue": {
                "name": "Revenue",
                "description": "Total revenue generated",
                "unit": "USD",
                "category": "financial",
                "higher_is_better": True
            },
            "expenses": {
                "name": "Expenses",
                "description": "Total operational expenses",
                "unit": "USD",
                "category": "financial",
                "higher_is_better": False
            },
            "profit": {
                "name": "Profit",
                "description": "Net profit (revenue - expenses)",
                "unit": "USD",
                "category": "financial",
                "higher_is_better": True
            },
            "cash_flow": {
                "name": "Cash Flow",
                "description": "Net cash flow for the period",
                "unit": "USD",
                "category": "financial",
                "higher_is_better": True
            },
            "burn_rate": {
                "name": "Burn Rate",
                "description": "Monthly cash burn rate",
                "unit": "USD",
                "category": "financial",
                "higher_is_better": False
            },
            "runway_months": {
                "name": "Runway",
                "description": "Months of runway remaining",
                "unit": "months",
                "category": "financial",
                "higher_is_better": True
            },
            
            # Customer metrics
            "total_customers": {
                "name": "Total Customers",
                "description": "Total number of customers",
                "unit": "count",
                "category": "customer",
                "higher_is_better": True
            },
            "new_customers": {
                "name": "New Customers",
                "description": "New customers acquired in period",
                "unit": "count",
                "category": "customer",
                "higher_is_better": True
            },
            "customer_acquisition_cost": {
                "name": "Customer Acquisition Cost",
                "description": "Average cost to acquire a customer",
                "unit": "USD",
                "category": "customer",
                "higher_is_better": False
            },
            "customer_lifetime_value": {
                "name": "Customer Lifetime Value",
                "description": "Average lifetime value per customer",
                "unit": "USD",
                "category": "customer",
                "higher_is_better": True
            },
            "churn_rate": {
                "name": "Churn Rate",
                "description": "Percentage of customers lost",
                "unit": "%",
                "category": "customer",
                "higher_is_better": False
            },
            "retention_rate": {
                "name": "Retention Rate",
                "description": "Percentage of customers retained",
                "unit": "%",
                "category": "customer",
                "higher_is_better": True
            }
        }
        
        return definitions.get(metric_type, {
            "name": metric_type.replace("_", " ").title(),
            "description": f"Custom metric: {metric_type}",
            "unit": "count",
            "category": "operational",
            "higher_is_better": True
        })


# Create indexes for optimal query performance
# These will be created automatically when the table is created
__table_args__ = (
    Index('idx_business_metrics_org_type_time', 'organization_id', 'metric_type', 'recorded_at'),
    Index('idx_business_metrics_category_time', 'category', 'recorded_at'),
    Index('idx_business_metrics_time_only', 'recorded_at'),
)