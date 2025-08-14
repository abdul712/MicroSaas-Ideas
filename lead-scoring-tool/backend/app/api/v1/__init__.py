"""
API v1 Package - Version 1 API routes
"""

from fastapi import APIRouter

from app.api.v1 import auth, leads, scoring, analytics, organizations, users, integrations

# Create main API router
api_router = APIRouter()

# Include all route modules
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["organizations"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(leads.router, prefix="/leads", tags=["leads"])
api_router.include_router(scoring.router, prefix="/scoring", tags=["scoring"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(integrations.router, prefix="/integrations", tags=["integrations"])