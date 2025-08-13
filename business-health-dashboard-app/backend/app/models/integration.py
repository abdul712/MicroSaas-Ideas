"""
Integration model for external API connections
"""

from sqlalchemy import String, Text, Boolean, Enum as SQLEnum, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from typing import Optional, Dict, Any
from datetime import datetime, timezone
import enum
import json

from app.core.database import Base


class IntegrationProvider(enum.Enum):
    """Supported integration providers"""
    QUICKBOOKS = "quickbooks"
    STRIPE = "stripe"
    SHOPIFY = "shopify"
    GOOGLE_ANALYTICS = "google_analytics"
    HUBSPOT = "hubspot"
    SALESFORCE = "salesforce"
    MAILCHIMP = "mailchimp"
    SLACK = "slack"
    XERO = "xero"
    PAYPAL = "paypal"
    SQUARE = "square"
    FRESHBOOKS = "freshbooks"


class IntegrationStatus(enum.Enum):
    """Integration connection status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"
    PENDING = "pending"
    EXPIRED = "expired"
    DISCONNECTED = "disconnected"


class SyncStatus(enum.Enum):
    """Data synchronization status"""
    SUCCESS = "success"
    FAILED = "failed"
    IN_PROGRESS = "in_progress"
    PARTIAL = "partial"
    SKIPPED = "skipped"


class Integration(Base):
    """
    External API integration configurations and status
    """
    __tablename__ = "integrations"
    
    # Foreign key to organization (for multi-tenancy)
    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Integration basic information
    provider: Mapped[IntegrationProvider] = mapped_column(
        SQLEnum(IntegrationProvider, name="integration_provider"),
        nullable=False,
        index=True
    )
    provider_account_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    provider_account_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Connection status
    status: Mapped[IntegrationStatus] = mapped_column(
        SQLEnum(IntegrationStatus, name="integration_status"),
        default=IntegrationStatus.PENDING,
        nullable=False,
        index=True
    )
    
    # OAuth and authentication
    access_token: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Encrypted
    refresh_token: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Encrypted
    token_expires_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    
    # Integration configuration
    config: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    
    # Data mapping and synchronization
    field_mappings: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    sync_frequency: Mapped[str] = mapped_column(String(20), default="hourly", nullable=False)  # hourly, daily, weekly
    auto_sync: Mapped[bool] = mapped_column(default=True, nullable=False)
    
    # Synchronization status
    last_sync_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    last_sync_status: Mapped[Optional[SyncStatus]] = mapped_column(
        SQLEnum(SyncStatus, name="sync_status"),
        nullable=True
    )
    last_sync_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sync_metadata: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    
    # Data metrics
    total_records_synced: Mapped[int] = mapped_column(default=0, nullable=False)
    last_sync_records: Mapped[int] = mapped_column(default=0, nullable=False)
    
    # Webhook configuration
    webhook_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    webhook_secret: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    webhook_events: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)  # Comma-separated
    
    # Error handling and retry
    retry_count: Mapped[int] = mapped_column(default=0, nullable=False)
    max_retries: Mapped[int] = mapped_column(default=3, nullable=False)
    error_notifications: Mapped[bool] = mapped_column(default=True, nullable=False)
    
    # Connection timestamps
    connected_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    disconnected_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    
    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="integrations")
    
    def __repr__(self) -> str:
        return f"<Integration(id={self.id}, provider={self.provider.value}, status={self.status.value})>"
    
    def to_dict(self, include_sensitive: bool = False) -> dict:
        """Convert integration to dictionary"""
        data = {
            "id": self.id,
            "organization_id": self.organization_id,
            "provider": self.provider.value,
            "provider_account_id": self.provider_account_id,
            "provider_account_name": self.provider_account_name,
            "status": self.status.value,
            "config": self.config,
            "field_mappings": self.field_mappings,
            "sync_frequency": self.sync_frequency,
            "auto_sync": self.auto_sync,
            "last_sync_at": self.last_sync_at.isoformat() if self.last_sync_at else None,
            "last_sync_status": self.last_sync_status.value if self.last_sync_status else None,
            "last_sync_error": self.last_sync_error,
            "sync_metadata": self.sync_metadata,
            "total_records_synced": self.total_records_synced,
            "last_sync_records": self.last_sync_records,
            "webhook_url": self.webhook_url,
            "webhook_events": self.webhook_events,
            "retry_count": self.retry_count,
            "max_retries": self.max_retries,
            "error_notifications": self.error_notifications,
            "connected_at": self.connected_at.isoformat() if self.connected_at else None,
            "disconnected_at": self.disconnected_at.isoformat() if self.disconnected_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        
        if include_sensitive:
            data.update({
                "token_expires_at": self.token_expires_at.isoformat() if self.token_expires_at else None,
                "webhook_secret": self.webhook_secret,
            })
        
        return data
    
    @property
    def is_connected(self) -> bool:
        """Check if integration is currently connected"""
        return self.status == IntegrationStatus.ACTIVE
    
    @property
    def is_token_expired(self) -> bool:
        """Check if access token is expired"""
        if not self.token_expires_at:
            return False
        
        return datetime.now(timezone.utc) > self.token_expires_at
    
    @property
    def needs_reauth(self) -> bool:
        """Check if integration needs re-authentication"""
        return self.status in [IntegrationStatus.EXPIRED, IntegrationStatus.ERROR] or self.is_token_expired
    
    @property
    def provider_display_name(self) -> str:
        """Get human-readable provider name"""
        names = {
            IntegrationProvider.QUICKBOOKS: "QuickBooks",
            IntegrationProvider.STRIPE: "Stripe",
            IntegrationProvider.SHOPIFY: "Shopify",
            IntegrationProvider.GOOGLE_ANALYTICS: "Google Analytics",
            IntegrationProvider.HUBSPOT: "HubSpot",
            IntegrationProvider.SALESFORCE: "Salesforce",
            IntegrationProvider.MAILCHIMP: "Mailchimp",
            IntegrationProvider.SLACK: "Slack",
            IntegrationProvider.XERO: "Xero",
            IntegrationProvider.PAYPAL: "PayPal",
            IntegrationProvider.SQUARE: "Square",
            IntegrationProvider.FRESHBOOKS: "FreshBooks",
        }
        return names.get(self.provider, self.provider.value.title())
    
    @property
    def sync_health_score(self) -> int:
        """Calculate sync health score (0-100)"""
        if not self.last_sync_at:
            return 0
        
        # Base score
        score = 100
        
        # Penalize for sync failures
        if self.last_sync_status == SyncStatus.FAILED:
            score -= 30
        elif self.last_sync_status == SyncStatus.PARTIAL:
            score -= 15
        
        # Penalize for old syncs
        if self.last_sync_at:
            hours_since_sync = (datetime.now(timezone.utc) - self.last_sync_at).total_seconds() / 3600
            
            if self.sync_frequency == "hourly" and hours_since_sync > 2:
                score -= min(20, int(hours_since_sync - 2) * 2)
            elif self.sync_frequency == "daily" and hours_since_sync > 26:
                score -= min(20, int((hours_since_sync - 26) / 2))
        
        # Penalize for retry attempts
        if self.retry_count > 0:
            score -= min(15, self.retry_count * 5)
        
        return max(0, score)
    
    def connect(self, access_token: str, refresh_token: str = None, expires_at: datetime = None) -> None:
        """Mark integration as connected"""
        self.status = IntegrationStatus.ACTIVE
        self.access_token = access_token  # Should be encrypted before saving
        self.refresh_token = refresh_token  # Should be encrypted before saving
        self.token_expires_at = expires_at
        self.connected_at = datetime.now(timezone.utc)
        self.retry_count = 0
        self.last_sync_error = None
    
    def disconnect(self, reason: str = None) -> None:
        """Disconnect the integration"""
        self.status = IntegrationStatus.DISCONNECTED
        self.access_token = None
        self.refresh_token = None
        self.token_expires_at = None
        self.disconnected_at = datetime.now(timezone.utc)
        if reason:
            self.last_sync_error = reason
    
    def mark_sync_success(self, records_synced: int, metadata: Dict = None) -> None:
        """Mark successful sync"""
        self.last_sync_at = datetime.now(timezone.utc)
        self.last_sync_status = SyncStatus.SUCCESS
        self.last_sync_records = records_synced
        self.total_records_synced += records_synced
        self.last_sync_error = None
        self.retry_count = 0
        
        if metadata:
            self.sync_metadata.update(metadata)
    
    def mark_sync_failed(self, error: str, retry: bool = True) -> None:
        """Mark failed sync"""
        self.last_sync_at = datetime.now(timezone.utc)
        self.last_sync_status = SyncStatus.FAILED
        self.last_sync_error = error
        self.last_sync_records = 0
        
        if retry and self.retry_count < self.max_retries:
            self.retry_count += 1
        else:
            # Max retries reached, mark as error status
            if self.retry_count >= self.max_retries:
                self.status = IntegrationStatus.ERROR
    
    def get_field_mapping(self, external_field: str) -> Optional[str]:
        """Get internal field mapping for external field"""
        return self.field_mappings.get(external_field)
    
    def set_field_mapping(self, external_field: str, internal_field: str) -> None:
        """Set field mapping"""
        if self.field_mappings is None:
            self.field_mappings = {}
        self.field_mappings[external_field] = internal_field
    
    def get_config_value(self, key: str, default=None):
        """Get configuration value"""
        return self.config.get(key, default)
    
    def set_config_value(self, key: str, value: Any) -> None:
        """Set configuration value"""
        if self.config is None:
            self.config = {}
        self.config[key] = value
    
    @classmethod
    def create_integration(
        cls,
        organization_id: str,
        provider: IntegrationProvider,
        provider_account_id: str = None,
        provider_account_name: str = None,
        config: Dict = None,
        field_mappings: Dict = None,
        sync_frequency: str = "hourly"
    ) -> "Integration":
        """Create new integration"""
        
        return cls(
            organization_id=organization_id,
            provider=provider,
            provider_account_id=provider_account_id,
            provider_account_name=provider_account_name,
            config=config or {},
            field_mappings=field_mappings or cls.get_default_field_mappings(provider),
            sync_frequency=sync_frequency,
            status=IntegrationStatus.PENDING
        )
    
    @classmethod
    def get_default_field_mappings(cls, provider: IntegrationProvider) -> Dict[str, str]:
        """Get default field mappings for provider"""
        mappings = {
            IntegrationProvider.STRIPE: {
                "amount": "revenue",
                "created": "recorded_at",
                "customer": "customer_id",
                "description": "description"
            },
            IntegrationProvider.QUICKBOOKS: {
                "TotalAmt": "revenue",
                "TxnDate": "recorded_at",
                "CustomerRef": "customer_id",
                "Line.Amount": "line_amount"
            },
            IntegrationProvider.SHOPIFY: {
                "total_price": "revenue",
                "created_at": "recorded_at",
                "customer.id": "customer_id",
                "order_number": "order_id"
            },
            IntegrationProvider.GOOGLE_ANALYTICS: {
                "sessions": "website_traffic",
                "users": "unique_visitors",
                "bounceRate": "bounce_rate",
                "avgSessionDuration": "session_duration"
            }
        }
        
        return mappings.get(provider, {})
    
    @classmethod
    def get_provider_capabilities(cls, provider: IntegrationProvider) -> Dict[str, Any]:
        """Get capabilities and features for each provider"""
        capabilities = {
            IntegrationProvider.STRIPE: {
                "data_types": ["revenue", "customers", "subscriptions", "invoices"],
                "real_time": True,
                "webhooks": True,
                "oauth": True,
                "api_rate_limit": "100/second"
            },
            IntegrationProvider.QUICKBOOKS: {
                "data_types": ["revenue", "expenses", "customers", "invoices", "cash_flow"],
                "real_time": False,
                "webhooks": True,
                "oauth": True,
                "api_rate_limit": "500/minute"
            },
            IntegrationProvider.SHOPIFY: {
                "data_types": ["revenue", "orders", "customers", "products", "inventory"],
                "real_time": True,
                "webhooks": True,
                "oauth": True,
                "api_rate_limit": "40/second"
            },
            IntegrationProvider.GOOGLE_ANALYTICS: {
                "data_types": ["website_traffic", "user_behavior", "conversions"],
                "real_time": True,
                "webhooks": False,
                "oauth": True,
                "api_rate_limit": "10000/day"
            }
        }
        
        return capabilities.get(provider, {
            "data_types": [],
            "real_time": False,
            "webhooks": False,
            "oauth": True,
            "api_rate_limit": "1000/hour"
        })