"""
Test configuration and fixtures for the Lead Scoring Tool backend
Provides comprehensive test setup with database, authentication, and mock data
"""

import asyncio
import os
import pytest
import pytest_asyncio
from typing import AsyncGenerator, Generator
from unittest.mock import AsyncMock, MagicMock

from fastapi.testclient import TestClient
from httpx import AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.main import app
from src.core.database import get_db, Base
from src.core.config import get_settings
from src.models.database import (
    User, Organization, UserOrganization, Lead, LeadScore, 
    ScoringModel, Integration, UserSession
)
from src.services.auth_service import AuthService
from src.services.scoring_service import ScoringService
from src.services.ml_service import MLService

# Test database URL
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"
TEST_DATABASE_URL_SYNC = "sqlite:///./test.db"

# Create test engines
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

test_engine_sync = create_engine(
    TEST_DATABASE_URL_SYNC,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(
    test_engine_sync, 
    class_=AsyncSession, 
    expire_on_commit=False
)


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a fresh database session for each test."""
    # Create all tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Create session
    async with TestingSessionLocal() as session:
        yield session
    
    # Drop all tables after test
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
def override_get_db(db_session: AsyncSession):
    """Override the database dependency."""
    async def _override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = _override_get_db
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def client(override_get_db) -> Generator[TestClient, None, None]:
    """Create a test client."""
    with TestClient(app) as test_client:
        yield test_client


@pytest_asyncio.fixture
async def async_client(override_get_db) -> AsyncGenerator[AsyncClient, None]:
    """Create an async test client."""
    async with AsyncClient(app=app, base_url="http://test") as async_test_client:
        yield async_test_client


# Test data fixtures
@pytest_asyncio.fixture
async def test_organization(db_session: AsyncSession) -> Organization:
    """Create a test organization."""
    org = Organization(
        name="Test Company",
        slug="test-company",
        industry="Technology",
        size="medium",
        website="https://testcompany.com",
        plan_type="professional",
        settings={
            "scoring_enabled": True,
            "real_time_updates": True,
            "email_notifications": True
        },
        scoring_config={
            "weights": {
                "demographic": 0.3,
                "behavioral": 0.4,
                "fit": 0.3
            },
            "thresholds": {
                "hot": 80,
                "warm": 60,
                "cold": 40
            }
        }
    )
    db_session.add(org)
    await db_session.commit()
    await db_session.refresh(org)
    return org


@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user."""
    user = User(
        email="test@example.com",
        password_hash="$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj9JRUyGqA.m",  # "testpass123"
        first_name="Test",
        last_name="User",
        email_verified=True,
        is_active=True,
        preferences={
            "theme": "light",
            "timezone": "UTC",
            "email_notifications": True
        },
        notification_settings={
            "lead_score_changes": True,
            "weekly_reports": True,
            "system_alerts": True
        }
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def admin_user(db_session: AsyncSession, test_organization: Organization) -> User:
    """Create an admin user."""
    user = User(
        email="admin@example.com",
        password_hash="$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj9JRUyGqA.m",
        first_name="Admin",
        last_name="User",
        email_verified=True,
        is_active=True,
        is_superuser=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    
    # Add to organization as admin
    user_org = UserOrganization(
        user_id=user.id,
        org_id=test_organization.id,
        role="admin",
        permissions={
            "manage_users": True,
            "manage_models": True,
            "view_analytics": True,
            "export_data": True
        }
    )
    db_session.add(user_org)
    await db_session.commit()
    
    return user


@pytest_asyncio.fixture
async def test_user_organization(
    db_session: AsyncSession, 
    test_user: User, 
    test_organization: Organization
) -> UserOrganization:
    """Create a user-organization relationship."""
    user_org = UserOrganization(
        user_id=test_user.id,
        org_id=test_organization.id,
        role="user",
        permissions={
            "view_leads": True,
            "manage_leads": True,
            "view_scores": True
        }
    )
    db_session.add(user_org)
    await db_session.commit()
    await db_session.refresh(user_org)
    return user_org


@pytest_asyncio.fixture
async def test_leads(
    db_session: AsyncSession, 
    test_organization: Organization
) -> list[Lead]:
    """Create test leads."""
    leads = [
        Lead(
            org_id=test_organization.id,
            email="lead1@example.com",
            first_name="John",
            last_name="Doe",
            company="Example Corp",
            title="CEO",
            industry="Technology",
            company_size="medium",
            source="website",
            status="new",
            tags=["hot-prospect", "enterprise"],
            custom_fields={"budget": 50000, "timeline": "Q1"}
        ),
        Lead(
            org_id=test_organization.id,
            email="lead2@example.com",
            first_name="Jane",
            last_name="Smith",
            company="Tech Startup",
            title="CTO",
            industry="Technology",
            company_size="small",
            source="referral",
            status="contacted",
            tags=["warm-lead"],
            custom_fields={"budget": 25000, "timeline": "Q2"}
        ),
        Lead(
            org_id=test_organization.id,
            email="lead3@example.com",
            first_name="Bob",
            last_name="Johnson",
            company="Large Enterprise",
            title="VP Sales",
            industry="Finance",
            company_size="large",
            source="paid_ads",
            status="qualified",
            tags=["enterprise", "high-value"],
            custom_fields={"budget": 100000, "timeline": "immediate"}
        )
    ]
    
    for lead in leads:
        db_session.add(lead)
    
    await db_session.commit()
    
    for lead in leads:
        await db_session.refresh(lead)
    
    return leads


@pytest_asyncio.fixture
async def test_scoring_model(
    db_session: AsyncSession, 
    test_organization: Organization
) -> ScoringModel:
    """Create a test scoring model."""
    model = ScoringModel(
        org_id=test_organization.id,
        name="Test XGBoost Model",
        version="1.0.0",
        model_type="xgboost",
        algorithm_params={
            "max_depth": 6,
            "learning_rate": 0.1,
            "n_estimators": 100
        },
        feature_config={
            "demographic_features": ["company_size", "industry", "title"],
            "behavioral_features": ["email_opens", "website_visits", "downloads"],
            "fit_features": ["budget", "timeline", "authority"]
        },
        scoring_weights={
            "demographic": 0.3,
            "behavioral": 0.4,
            "fit": 0.3
        },
        accuracy=0.87,
        precision=0.84,
        recall=0.89,
        f1_score=0.86,
        auc_roc=0.91,
        is_active=True,
        is_default=True
    )
    db_session.add(model)
    await db_session.commit()
    await db_session.refresh(model)
    return model


@pytest_asyncio.fixture
async def test_lead_scores(
    db_session: AsyncSession,
    test_leads: list[Lead],
    test_scoring_model: ScoringModel
) -> list[LeadScore]:
    """Create test lead scores."""
    scores = []
    score_values = [85, 65, 92]  # hot, warm, hot
    
    for i, lead in enumerate(test_leads):
        score = LeadScore(
            lead_id=lead.id,
            model_id=test_scoring_model.id,
            total_score=score_values[i],
            demographic_score=score_values[i] * 0.3,
            behavioral_score=score_values[i] * 0.4,
            fit_score=score_values[i] * 0.3,
            score_factors={
                "company_size": 8 + i,
                "industry_match": 9,
                "title_authority": 7 + i,
                "engagement_level": 8,
                "budget_fit": 9 - i
            },
            model_version="1.0.0",
            confidence=0.85 + (i * 0.02),
            predicted_conversion_probability=0.3 + (i * 0.1),
            explanations={
                "top_factors": [
                    "High industry match",
                    "Strong title authority",
                    "Good budget fit"
                ],
                "improvement_areas": [
                    "Increase engagement",
                    "Schedule demo"
                ]
            }
        )
        scores.append(score)
        db_session.add(score)
    
    await db_session.commit()
    
    for score in scores:
        await db_session.refresh(score)
    
    return scores


@pytest_asyncio.fixture
async def test_integration(
    db_session: AsyncSession,
    test_organization: Organization
) -> Integration:
    """Create a test integration."""
    integration = Integration(
        org_id=test_organization.id,
        name="Test Salesforce Integration",
        integration_type="salesforce",
        config={
            "api_version": "54.0",
            "sync_frequency": "hourly",
            "field_mapping": {
                "email": "Email",
                "first_name": "FirstName",
                "last_name": "LastName",
                "company": "Company"
            }
        },
        credentials={
            "client_id": "test_client_id",
            "client_secret": "encrypted_secret",
            "refresh_token": "encrypted_token"
        },
        mapping_config={
            "lead_status_mapping": {
                "new": "New",
                "contacted": "Contacted",
                "qualified": "Qualified"
            }
        },
        is_active=True,
        sync_status="success"
    )
    db_session.add(integration)
    await db_session.commit()
    await db_session.refresh(integration)
    return integration


# Authentication fixtures
@pytest_asyncio.fixture
async def auth_service() -> AuthService:
    """Create an auth service instance."""
    return AuthService()


@pytest_asyncio.fixture
async def user_token(auth_service: AuthService, test_user: User) -> str:
    """Create a JWT token for test user."""
    token_data = {
        "sub": str(test_user.id),
        "email": test_user.email,
        "type": "access"
    }
    return await auth_service.create_access_token(token_data)


@pytest_asyncio.fixture
async def admin_token(auth_service: AuthService, admin_user: User) -> str:
    """Create a JWT token for admin user."""
    token_data = {
        "sub": str(admin_user.id),
        "email": admin_user.email,
        "type": "access"
    }
    return await auth_service.create_access_token(token_data)


@pytest.fixture
def auth_headers(user_token: str) -> dict:
    """Create authorization headers."""
    return {"Authorization": f"Bearer {user_token}"}


@pytest.fixture
def admin_headers(admin_token: str) -> dict:
    """Create admin authorization headers."""
    return {"Authorization": f"Bearer {admin_token}"}


# Mock service fixtures
@pytest.fixture
def mock_ml_service() -> AsyncMock:
    """Create a mock ML service."""
    mock_service = AsyncMock(spec=MLService)
    
    # Mock scoring response
    mock_service.score_lead.return_value = {
        "total_score": 85,
        "demographic_score": 25.5,
        "behavioral_score": 34.0,
        "fit_score": 25.5,
        "confidence": 0.87,
        "model_name": "test_model",
        "model_version": "1.0.0",
        "explanations": {
            "top_factors": ["High industry match", "Strong title"],
            "shap_values": {"company_size": 0.15, "industry": 0.12}
        }
    }
    
    # Mock batch scoring
    mock_service.score_leads_batch.return_value = [
        {"lead_id": "1", "score": 85, "confidence": 0.87},
        {"lead_id": "2", "score": 65, "confidence": 0.82},
        {"lead_id": "3", "score": 92, "confidence": 0.91}
    ]
    
    return mock_service


@pytest.fixture
def mock_scoring_service(mock_ml_service) -> AsyncMock:
    """Create a mock scoring service."""
    mock_service = AsyncMock(spec=ScoringService)
    mock_service.ml_service = mock_ml_service
    
    # Mock scoring methods
    mock_service.calculate_lead_score.return_value = {
        "total_score": 85,
        "demographic_score": 25.5,
        "behavioral_score": 34.0,
        "fit_score": 25.5,
        "factors": {"company_size": 8, "industry": 9},
        "updated_at": "2024-01-01T00:00:00Z"
    }
    
    return mock_service


# Test data helpers
class TestDataFactory:
    """Factory for creating test data."""
    
    @staticmethod
    def lead_data(**overrides) -> dict:
        """Create lead data."""
        data = {
            "email": "test@example.com",
            "first_name": "Test",
            "last_name": "Lead",
            "company": "Test Company",
            "title": "CEO",
            "industry": "Technology",
            "company_size": "medium",
            "source": "website",
            "tags": ["test"],
            "custom_fields": {"budget": 50000}
        }
        data.update(overrides)
        return data
    
    @staticmethod
    def user_data(**overrides) -> dict:
        """Create user data."""
        data = {
            "email": "test@example.com",
            "password": "testpass123",
            "first_name": "Test",
            "last_name": "User",
            "timezone": "UTC"
        }
        data.update(overrides)
        return data
    
    @staticmethod
    def organization_data(**overrides) -> dict:
        """Create organization data."""
        data = {
            "name": "Test Organization",
            "slug": "test-org",
            "industry": "Technology",
            "size": "medium",
            "website": "https://test.com"
        }
        data.update(overrides)
        return data


@pytest.fixture
def test_data_factory() -> TestDataFactory:
    """Provide test data factory."""
    return TestDataFactory()


# Configuration fixtures
@pytest.fixture
def test_settings():
    """Override settings for testing."""
    settings = get_settings()
    settings.ENV = "testing"
    settings.DATABASE_URL = TEST_DATABASE_URL
    settings.RATE_LIMIT_ENABLED = False
    settings.JWT_SECRET_KEY = "test-secret-key"
    return settings


# Cleanup fixtures
@pytest.fixture(autouse=True)
def cleanup_files():
    """Clean up test files."""
    yield
    # Clean up test database file
    if os.path.exists("./test.db"):
        os.remove("./test.db")


# Performance testing fixtures
@pytest.fixture
def benchmark_data():
    """Data for performance benchmarks."""
    return {
        "leads": [TestDataFactory.lead_data(email=f"lead{i}@example.com") 
                 for i in range(100)],
        "scoring_requests": 1000,
        "concurrent_users": 10
    }