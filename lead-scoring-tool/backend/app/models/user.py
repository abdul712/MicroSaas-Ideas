"""
User Model - User Management with Role-Based Access Control
"""

from sqlalchemy import Column, String, DateTime, Boolean, Text, JSON, ForeignKey, Enum, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from passlib.context import CryptContext
import uuid
import enum
from typing import Optional, Dict, Any, List

from app.core.database import Base

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserRole(str, enum.Enum):
    """User role enumeration."""
    OWNER = "owner"          # Organization owner with full access
    ADMIN = "admin"          # Administrator with management access  
    MANAGER = "manager"      # Manager with team management access
    USER = "user"            # Regular user with standard access
    VIEWER = "viewer"        # View-only access


class UserStatus(str, enum.Enum):
    """User status enumeration."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"      # Invitation sent but not accepted
    SUSPENDED = "suspended"


class User(Base):
    """
    User model with role-based access control and multi-tenant support.
    """
    __tablename__ = "users"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # Foreign Keys
    organization_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("organizations.id", ondelete="CASCADE"), 
        nullable=False,
        index=True
    )
    
    # Authentication
    email = Column(String(255), nullable=False, unique=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    is_verified = Column(Boolean, nullable=False, default=False)
    verification_token = Column(String(255), nullable=True)
    
    # Password Reset
    password_reset_token = Column(String(255), nullable=True)
    password_reset_expires = Column(DateTime(timezone=True), nullable=True)
    
    # Profile Information
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    display_name = Column(String(200), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    phone = Column(String(50), nullable=True)
    
    # Job Information
    job_title = Column(String(200), nullable=True)
    department = Column(String(100), nullable=True)
    
    # Access Control
    role = Column(Enum(UserRole), nullable=False, default=UserRole.USER, index=True)
    permissions = Column(JSON, nullable=False, default=list)
    
    # Status and Activity
    status = Column(
        Enum(UserStatus),
        nullable=False, 
        default=UserStatus.PENDING,
        index=True
    )
    
    # Security
    two_factor_enabled = Column(Boolean, nullable=False, default=False)
    two_factor_secret = Column(String(255), nullable=True)
    backup_codes = Column(JSON, nullable=True)
    
    # Session Management
    last_login = Column(DateTime(timezone=True), nullable=True)
    last_activity = Column(DateTime(timezone=True), nullable=True)
    login_count = Column(Integer, nullable=False, default=0)
    
    # API Access
    api_key = Column(String(255), nullable=True, unique=True)
    api_key_created_at = Column(DateTime(timezone=True), nullable=True)
    api_key_last_used = Column(DateTime(timezone=True), nullable=True)
    
    # Preferences and Settings
    preferences = Column(JSON, nullable=False, default=dict)
    timezone = Column(String(50), nullable=False, default='UTC')
    
    # Notification Settings
    email_notifications = Column(Boolean, nullable=False, default=True)
    push_notifications = Column(Boolean, nullable=False, default=True)
    sms_notifications = Column(Boolean, nullable=False, default=False)
    
    # Invitation Information
    invited_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    invited_at = Column(DateTime(timezone=True), nullable=True)
    invitation_token = Column(String(255), nullable=True)
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Audit Fields
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )
    
    # Soft Delete
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True, index=True)
    
    # Relationships
    organization = relationship("Organization", back_populates="users")
    invited_users = relationship("User", backref="inviter", remote_side=[id])
    audit_logs = relationship("AuditLog", back_populates="user", lazy="dynamic")
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}', role={self.role})>"
    
    @property
    def full_name(self) -> str:
        """Get user's full name."""
        return f"{self.first_name} {self.last_name}".strip()
    
    @property
    def is_owner(self) -> bool:
        """Check if user is organization owner."""
        return self.role == UserRole.OWNER
    
    @property
    def is_admin(self) -> bool:
        """Check if user has admin privileges."""
        return self.role in [UserRole.OWNER, UserRole.ADMIN]
    
    @property
    def is_manager(self) -> bool:
        """Check if user has manager privileges."""
        return self.role in [UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER]
    
    @property
    def can_manage_users(self) -> bool:
        """Check if user can manage other users."""
        return self.role in [UserRole.OWNER, UserRole.ADMIN]
    
    @property
    def can_manage_integrations(self) -> bool:
        """Check if user can manage integrations."""
        return self.role in [UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER]
    
    @property
    def can_view_analytics(self) -> bool:
        """Check if user can view analytics."""
        return self.role != UserRole.VIEWER
    
    def set_password(self, password: str) -> None:
        """Hash and set user password."""
        self.hashed_password = pwd_context.hash(password)
    
    def verify_password(self, password: str) -> bool:
        """Verify user password."""
        return pwd_context.verify(password, self.hashed_password)
    
    def has_permission(self, permission: str) -> bool:
        """Check if user has specific permission."""
        if not self.permissions:
            return False
        return permission in self.permissions
    
    def add_permission(self, permission: str) -> None:
        """Add permission to user."""
        if not self.permissions:
            self.permissions = []
        if permission not in self.permissions:
            self.permissions.append(permission)
    
    def remove_permission(self, permission: str) -> None:
        """Remove permission from user."""
        if self.permissions and permission in self.permissions:
            self.permissions.remove(permission)
    
    def get_preference(self, key: str, default: Any = None) -> Any:
        """Get user preference value."""
        if not self.preferences:
            return default
        return self.preferences.get(key, default)
    
    def set_preference(self, key: str, value: Any) -> None:
        """Set user preference value."""
        if not self.preferences:
            self.preferences = {}
        self.preferences[key] = value
    
    def update_last_activity(self) -> None:
        """Update last activity timestamp."""
        self.last_activity = func.now()
    
    def update_login_info(self) -> None:
        """Update login information."""
        self.last_login = func.now()
        self.login_count += 1
        self.update_last_activity()
    
    def generate_api_key(self) -> str:
        """Generate new API key."""
        import secrets
        self.api_key = secrets.token_urlsafe(32)
        self.api_key_created_at = func.now()
        return self.api_key
    
    def revoke_api_key(self) -> None:
        """Revoke API key."""
        self.api_key = None
        self.api_key_created_at = None
        self.api_key_last_used = None
    
    def to_dict(self, include_sensitive: bool = False) -> Dict[str, Any]:
        """Convert user to dictionary."""
        data = {
            "id": str(self.id),
            "organization_id": str(self.organization_id),
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "full_name": self.full_name,
            "display_name": self.display_name,
            "avatar_url": self.avatar_url,
            "phone": self.phone,
            "job_title": self.job_title,
            "department": self.department,
            "role": self.role,
            "status": self.status,
            "is_verified": self.is_verified,
            "two_factor_enabled": self.two_factor_enabled,
            "last_login": self.last_login.isoformat() if self.last_login else None,
            "last_activity": self.last_activity.isoformat() if self.last_activity else None,
            "login_count": self.login_count,
            "preferences": self.preferences,
            "timezone": self.timezone,
            "email_notifications": self.email_notifications,
            "push_notifications": self.push_notifications,
            "sms_notifications": self.sms_notifications,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "is_active": self.is_active
        }
        
        if include_sensitive:
            data.update({
                "permissions": self.permissions,
                "api_key": self.api_key,
                "api_key_created_at": self.api_key_created_at.isoformat() if self.api_key_created_at else None,
                "api_key_last_used": self.api_key_last_used.isoformat() if self.api_key_last_used else None
            })
        
        return data
    
    @classmethod
    def get_role_permissions(cls, role: UserRole) -> List[str]:
        """Get default permissions for a role."""
        role_permissions = {
            UserRole.OWNER: [
                "organization:manage",
                "users:manage", 
                "leads:manage",
                "scoring:manage",
                "integrations:manage",
                "analytics:view",
                "settings:manage",
                "billing:manage"
            ],
            UserRole.ADMIN: [
                "users:manage",
                "leads:manage", 
                "scoring:manage",
                "integrations:manage",
                "analytics:view",
                "settings:manage"
            ],
            UserRole.MANAGER: [
                "leads:manage",
                "scoring:view",
                "integrations:view",
                "analytics:view",
                "users:view"
            ],
            UserRole.USER: [
                "leads:view",
                "leads:create",
                "scoring:view",
                "analytics:view"
            ],
            UserRole.VIEWER: [
                "leads:view",
                "scoring:view"
            ]
        }
        return role_permissions.get(role, [])