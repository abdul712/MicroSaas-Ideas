"""
User model for authentication and authorization
"""

from sqlalchemy import String, Boolean, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from typing import Optional
import enum
import bcrypt

from app.core.database import Base


class UserRole(enum.Enum):
    """User roles with different permission levels"""
    OWNER = "owner"           # Full access, billing management
    ADMIN = "admin"           # Full dashboard access, user management
    MANAGER = "manager"       # Dashboard access, limited user management
    VIEWER = "viewer"         # Read-only dashboard access
    API_USER = "api_user"     # API access only


class UserStatus(enum.Enum):
    """User account status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"
    SUSPENDED = "suspended"


class User(Base):
    """
    User model for authentication and role-based access control
    """
    __tablename__ = "users"
    
    # Basic user information
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    
    # Authentication
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    email_verification_token: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Password reset
    password_reset_token: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    password_reset_expires: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # ISO datetime string
    
    # Multi-factor authentication
    mfa_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    mfa_secret: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    backup_codes: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)  # JSON array as string
    
    # Organization and role
    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), 
        ForeignKey("organizations.id", ondelete="CASCADE"), 
        nullable=False,
        index=True
    )
    role: Mapped[UserRole] = mapped_column(
        SQLEnum(UserRole, name="user_role"),
        default=UserRole.VIEWER,
        nullable=False
    )
    
    # Account status
    status: Mapped[UserStatus] = mapped_column(
        SQLEnum(UserStatus, name="user_status"),
        default=UserStatus.PENDING,
        nullable=False
    )
    
    # Profile information
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    timezone: Mapped[str] = mapped_column(String(50), default="UTC", nullable=False)
    
    # Session management
    last_login_at: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # ISO datetime string
    last_active_at: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # ISO datetime string
    
    # API access
    api_key: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    api_key_expires: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # ISO datetime string
    
    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="users")
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, role={self.role.value})>"
    
    def to_dict(self, include_sensitive: bool = False) -> dict:
        """Convert user to dictionary"""
        data = {
            "id": self.id,
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "full_name": self.full_name,
            "role": self.role.value,
            "status": self.status.value,
            "is_email_verified": self.is_email_verified,
            "avatar_url": self.avatar_url,
            "phone": self.phone,
            "timezone": self.timezone,
            "organization_id": self.organization_id,
            "last_login_at": self.last_login_at,
            "last_active_at": self.last_active_at,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        
        if include_sensitive:
            data.update({
                "mfa_enabled": self.mfa_enabled,
                "api_key": self.api_key,
                "api_key_expires": self.api_key_expires,
            })
        
        return data
    
    @property
    def full_name(self) -> str:
        """Get user's full name"""
        return f"{self.first_name} {self.last_name}"
    
    @property
    def is_active(self) -> bool:
        """Check if user account is active"""
        return self.status == UserStatus.ACTIVE
    
    @property
    def is_admin(self) -> bool:
        """Check if user has admin privileges"""
        return self.role in [UserRole.OWNER, UserRole.ADMIN]
    
    @property
    def is_owner(self) -> bool:
        """Check if user is organization owner"""
        return self.role == UserRole.OWNER
    
    @property
    def can_manage_users(self) -> bool:
        """Check if user can manage other users"""
        return self.role in [UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER]
    
    @property
    def can_manage_billing(self) -> bool:
        """Check if user can manage billing"""
        return self.role == UserRole.OWNER
    
    @property
    def can_manage_integrations(self) -> bool:
        """Check if user can manage integrations"""
        return self.role in [UserRole.OWNER, UserRole.ADMIN]
    
    @property
    def has_api_access(self) -> bool:
        """Check if user has API access"""
        return self.api_key is not None and self.is_api_key_valid
    
    @property
    def is_api_key_valid(self) -> bool:
        """Check if API key is valid and not expired"""
        if not self.api_key or not self.api_key_expires:
            return False
        
        from datetime import datetime, timezone
        try:
            expires_at = datetime.fromisoformat(self.api_key_expires)
            return datetime.now(timezone.utc) < expires_at
        except:
            return False
    
    def set_password(self, password: str) -> None:
        """Hash and set user password"""
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    def check_password(self, password: str) -> bool:
        """Verify password against hash"""
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
    
    def generate_api_key(self) -> str:
        """Generate new API key for user"""
        import secrets
        from datetime import datetime, timezone, timedelta
        
        # Generate secure API key
        api_key = f"bhd_{secrets.token_urlsafe(32)}"
        
        # Set expiration (1 year from now)
        expires_at = datetime.now(timezone.utc) + timedelta(days=365)
        
        self.api_key = api_key
        self.api_key_expires = expires_at.isoformat()
        
        return api_key
    
    def revoke_api_key(self) -> None:
        """Revoke user's API key"""
        self.api_key = None
        self.api_key_expires = None
    
    def update_last_active(self) -> None:
        """Update last active timestamp"""
        from datetime import datetime, timezone
        self.last_active_at = datetime.now(timezone.utc).isoformat()
    
    def update_last_login(self) -> None:
        """Update last login timestamp"""
        from datetime import datetime, timezone
        self.last_login_at = datetime.now(timezone.utc).isoformat()
        self.update_last_active()
    
    def has_permission(self, permission: str) -> bool:
        """
        Check if user has specific permission
        
        Available permissions:
        - read:dashboard
        - write:dashboard
        - read:users
        - write:users
        - read:billing
        - write:billing
        - read:integrations
        - write:integrations
        - read:api
        - write:api
        """
        role_permissions = {
            UserRole.VIEWER: [
                "read:dashboard"
            ],
            UserRole.API_USER: [
                "read:api",
                "write:api"
            ],
            UserRole.MANAGER: [
                "read:dashboard",
                "write:dashboard",
                "read:users"
            ],
            UserRole.ADMIN: [
                "read:dashboard",
                "write:dashboard",
                "read:users",
                "write:users",
                "read:integrations",
                "write:integrations",
                "read:api",
                "write:api"
            ],
            UserRole.OWNER: [
                "read:dashboard",
                "write:dashboard",
                "read:users",
                "write:users",
                "read:billing",
                "write:billing",
                "read:integrations",
                "write:integrations",
                "read:api",
                "write:api"
            ]
        }
        
        user_permissions = role_permissions.get(self.role, [])
        return permission in user_permissions
    
    @classmethod
    def create_owner(cls, email: str, password: str, first_name: str, last_name: str, organization_id: str) -> "User":
        """Create organization owner user"""
        user = cls(
            email=email,
            first_name=first_name,
            last_name=last_name,
            organization_id=organization_id,
            role=UserRole.OWNER,
            status=UserStatus.ACTIVE,
            is_email_verified=True  # Assume owner email is verified during signup
        )
        user.set_password(password)
        return user