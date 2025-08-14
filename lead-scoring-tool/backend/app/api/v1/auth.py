"""
Authentication API Routes
JWT-based authentication with multi-tenant support
"""

from datetime import timedelta
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import structlog

from app.core.database import get_session
from app.core.security import (
    create_access_token, 
    create_refresh_token,
    verify_password,
    get_password_hash
)
from app.models.user import User
from app.models.organization import Organization
from app.schemas.auth import (
    Token, 
    TokenData,
    UserRegister,
    UserLogin,
    PasswordReset,
    PasswordResetConfirm
)
from app.schemas.user import UserResponse
from app.services.email import send_verification_email, send_password_reset_email
from app.core.config import settings

logger = structlog.get_logger(__name__)

router = APIRouter()


@router.post("/register", response_model=UserResponse)
async def register(
    user_data: UserRegister,
    db: AsyncSession = Depends(get_session)
) -> Any:
    """
    Register a new user and organization.
    Creates both organization and admin user in a single transaction.
    """
    logger.info("User registration attempt", email=user_data.email)
    
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    try:
        async with db.begin():
            # Create organization
            organization = Organization(
                name=user_data.organization_name,
                slug=user_data.organization_name.lower().replace(" ", "-"),
                contact_email=user_data.email,
                subscription_tier="starter",
                status="trial"
            )
            db.add(organization)
            await db.flush()  # Get organization ID
            
            # Create admin user
            user = User(
                email=user_data.email,
                first_name=user_data.first_name,
                last_name=user_data.last_name,
                organization_id=organization.id,
                role="owner",
                status="pending"
            )
            user.set_password(user_data.password)
            db.add(user)
            
            await db.commit()
            
            # Send verification email
            await send_verification_email(user.email, user.verification_token)
            
            logger.info(
                "User registration successful",
                user_id=str(user.id),
                organization_id=str(organization.id)
            )
            
            return user.to_dict()
            
    except Exception as e:
        logger.error("Registration failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_session)
) -> Any:
    """
    OAuth2 compatible token login with email and password.
    Returns access token and refresh token.
    """
    logger.info("Login attempt", email=form_data.username)
    
    # Get user by email
    result = await db.execute(
        select(User)
        .where(User.email == form_data.username)
        .where(User.is_active == True)
    )
    user = result.scalar_one_or_none()
    
    if not user or not user.verify_password(form_data.password):
        logger.warning("Login failed - invalid credentials", email=form_data.username)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if user.status != "active":
        logger.warning("Login failed - account not active", email=form_data.username)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account not activated. Please check your email for verification instructions.",
        )
    
    # Update login information
    user.update_login_info()
    await db.commit()
    
    # Create tokens
    access_token_expires = timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    access_token = create_access_token(
        data={"sub": user.email, "org_id": str(user.organization_id)},
        expires_delta=access_token_expires
    )
    
    refresh_token = create_refresh_token(
        data={"sub": user.email, "org_id": str(user.organization_id)}
    )
    
    logger.info("Login successful", user_id=str(user.id))
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.JWT_EXPIRATION_HOURS * 3600,
        "user": user.to_dict()
    }


@router.post("/refresh", response_model=Token)
async def refresh_token(
    token_data: TokenData,
    db: AsyncSession = Depends(get_session)
) -> Any:
    """
    Refresh access token using refresh token.
    """
    # Verify refresh token and get user
    from app.core.security import verify_token
    
    payload = verify_token(token_data.refresh_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    email = payload.get("sub")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    # Get user
    result = await db.execute(
        select(User)
        .where(User.email == email)
        .where(User.is_active == True)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # Create new access token
    access_token_expires = timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    access_token = create_access_token(
        data={"sub": user.email, "org_id": str(user.organization_id)},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "refresh_token": token_data.refresh_token,
        "token_type": "bearer",
        "expires_in": settings.JWT_EXPIRATION_HOURS * 3600,
        "user": user.to_dict()
    }


@router.post("/verify-email")
async def verify_email(
    token: str,
    db: AsyncSession = Depends(get_session)
) -> Dict[str, str]:
    """
    Verify user email address using verification token.
    """
    # Find user by verification token
    result = await db.execute(
        select(User).where(User.verification_token == token)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification token"
        )
    
    if user.is_verified:
        return {"message": "Email already verified"}
    
    # Update user status
    user.is_verified = True
    user.status = "active"
    user.verification_token = None
    
    await db.commit()
    
    logger.info("Email verification successful", user_id=str(user.id))
    
    return {"message": "Email verified successfully"}


@router.post("/forgot-password")
async def forgot_password(
    password_reset: PasswordReset,
    db: AsyncSession = Depends(get_session)
) -> Dict[str, str]:
    """
    Send password reset email to user.
    """
    # Find user by email
    result = await db.execute(
        select(User).where(User.email == password_reset.email)
    )
    user = result.scalar_one_or_none()
    
    # Always return success to prevent email enumeration
    if not user:
        return {"message": "If the email exists, a password reset link has been sent"}
    
    # Generate reset token and send email
    import secrets
    from datetime import datetime, timedelta
    
    user.password_reset_token = secrets.token_urlsafe(32)
    user.password_reset_expires = datetime.utcnow() + timedelta(hours=1)
    
    await db.commit()
    
    await send_password_reset_email(user.email, user.password_reset_token)
    
    logger.info("Password reset requested", user_id=str(user.id))
    
    return {"message": "If the email exists, a password reset link has been sent"}


@router.post("/reset-password")
async def reset_password(
    password_reset: PasswordResetConfirm,
    db: AsyncSession = Depends(get_session)
) -> Dict[str, str]:
    """
    Reset user password using reset token.
    """
    # Find user by reset token
    result = await db.execute(
        select(User)
        .where(User.password_reset_token == password_reset.token)
        .where(User.password_reset_expires > datetime.utcnow())
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Update password and clear reset token
    user.set_password(password_reset.new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    
    await db.commit()
    
    logger.info("Password reset successful", user_id=str(user.id))
    
    return {"message": "Password reset successfully"}


@router.post("/logout")
async def logout() -> Dict[str, str]:
    """
    Logout endpoint (client should discard tokens).
    """
    return {"message": "Successfully logged out"}