"""
Email Campaign Analytics API
FastAPI backend for email marketing analytics platform
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import os
import logging
from typing import Optional

# Import routers
from routers import (
    auth,
    organizations,
    email_accounts,
    campaigns,
    analytics,
    subscribers,
    reports,
    integrations,
    webhooks
)

# Import database and utilities
from database import init_db, close_db
from middleware import setup_middleware, rate_limit_middleware
from core.config import settings
from core.security import verify_token

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Security
security = HTTPBearer()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    # Startup
    logger.info("Starting Email Campaign Analytics API...")
    await init_db()
    logger.info("Database initialized")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Email Campaign Analytics API...")
    await close_db()
    logger.info("Database connections closed")

# Create FastAPI app
app = FastAPI(
    title="Email Campaign Analytics API",
    description="Advanced email marketing analytics platform with multi-provider integration",
    version="1.0.0",
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
    lifespan=lifespan
)

# Security middleware
app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.ALLOWED_HOSTS)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
)

# Custom middleware
setup_middleware(app)
app.add_middleware(rate_limit_middleware)

# Authentication dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT token and return current user"""
    try:
        token = credentials.credentials
        user_data = verify_token(token)
        return user_data
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Health check endpoint
@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "database": "connected"
    }

@app.get("/", tags=["System"])
async def root():
    """Root endpoint"""
    return {
        "message": "Email Campaign Analytics API",
        "version": "1.0.0",
        "docs_url": "/docs",
        "status": "running"
    }

# API Routes
api_prefix = "/api/v1"

# Public routes (no authentication required)
app.include_router(auth.router, prefix=f"{api_prefix}/auth", tags=["Authentication"])
app.include_router(webhooks.router, prefix=f"{api_prefix}/webhooks", tags=["Webhooks"])

# Protected routes (authentication required)
protected_dependencies = [Depends(get_current_user)]

app.include_router(
    organizations.router, 
    prefix=f"{api_prefix}/organizations", 
    tags=["Organizations"],
    dependencies=protected_dependencies
)

app.include_router(
    email_accounts.router, 
    prefix=f"{api_prefix}/email-accounts", 
    tags=["Email Accounts"],
    dependencies=protected_dependencies
)

app.include_router(
    campaigns.router, 
    prefix=f"{api_prefix}/campaigns", 
    tags=["Campaigns"],
    dependencies=protected_dependencies
)

app.include_router(
    analytics.router, 
    prefix=f"{api_prefix}/analytics", 
    tags=["Analytics"],
    dependencies=protected_dependencies
)

app.include_router(
    subscribers.router, 
    prefix=f"{api_prefix}/subscribers", 
    tags=["Subscribers"],
    dependencies=protected_dependencies
)

app.include_router(
    reports.router, 
    prefix=f"{api_prefix}/reports", 
    tags=["Reports"],
    dependencies=protected_dependencies
)

app.include_router(
    integrations.router, 
    prefix=f"{api_prefix}/integrations", 
    tags=["Integrations"],
    dependencies=protected_dependencies
)

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Handle HTTP exceptions"""
    logger.error(f"HTTP Exception: {exc.status_code} - {exc.detail}")
    return {
        "error": True,
        "message": exc.detail,
        "status_code": exc.status_code
    }

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {exc}")
    return {
        "error": True,
        "message": "Internal server error",
        "status_code": 500
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENVIRONMENT == "development",
        log_level="info"
    )