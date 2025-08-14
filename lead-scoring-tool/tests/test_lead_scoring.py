"""
Lead Scoring Tool - Comprehensive Test Suite
Unit, integration, and end-to-end tests for the complete platform
"""

import pytest
import asyncio
from typing import AsyncGenerator
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.core.database import get_session, init_database, close_database
from backend.app.models.organization import Organization
from backend.app.models.user import User
from backend.app.models.lead import Lead, LeadActivity


class TestConfig:
    """Test configuration settings."""
    DATABASE_URL = "postgresql://test:test@localhost:5432/test_lead_scoring"
    REDIS_URL = "redis://localhost:6379/1"
    JWT_SECRET_KEY = "test-secret-key"


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def test_app() -> AsyncGenerator[FastAPI, None]:
    """Create test application instance."""
    # Override settings for testing
    import backend.app.core.config as config
    config.settings.DATABASE_URL = TestConfig.DATABASE_URL
    config.settings.REDIS_URL = TestConfig.REDIS_URL
    config.settings.JWT_SECRET_KEY = TestConfig.JWT_SECRET_KEY
    
    await init_database()
    yield app
    await close_database()


@pytest.fixture
async def client(test_app: FastAPI) -> AsyncGenerator[AsyncClient, None]:
    """Create async test client."""
    async with AsyncClient(app=test_app, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create test database session."""
    async with get_session() as session:
        yield session


@pytest.fixture
async def test_organization(db_session: AsyncSession) -> Organization:
    """Create test organization."""
    org = Organization(
        name="Test Organization",
        slug="test-org",
        contact_email="test@example.com",
        subscription_tier="professional"
    )
    db_session.add(org)
    await db_session.commit()
    await db_session.refresh(org)
    return org


@pytest.fixture
async def test_user(db_session: AsyncSession, test_organization: Organization) -> User:
    """Create test user."""
    user = User(
        email="test@example.com",
        first_name="Test",
        last_name="User",
        organization_id=test_organization.id,
        role="admin",
        status="active"
    )
    user.set_password("testpassword123")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def test_lead(db_session: AsyncSession, test_organization: Organization) -> Lead:
    """Create test lead."""
    lead = Lead(
        email="lead@example.com",
        first_name="Test",
        last_name="Lead",
        company_name="Test Company",
        organization_id=test_organization.id,
        current_score=75,
        status="qualified"
    )
    db_session.add(lead)
    await db_session.commit()
    await db_session.refresh(lead)
    return lead


class TestAuthentication:
    """Test authentication endpoints and JWT functionality."""
    
    async def test_user_registration(self, client: AsyncClient):
        """Test user registration endpoint."""
        registration_data = {
            "email": "newuser@example.com",
            "password": "SecurePassword123",
            "confirm_password": "SecurePassword123",
            "first_name": "New",
            "last_name": "User",
            "organization_name": "New Organization"
        }
        
        response = await client.post("/api/v1/auth/register", json=registration_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["email"] == registration_data["email"]
        assert data["first_name"] == registration_data["first_name"]
        assert "password" not in data  # Password should not be returned
    
    async def test_user_login(self, client: AsyncClient, test_user: User):
        """Test user login endpoint."""
        login_data = {
            "username": test_user.email,
            "password": "testpassword123"
        }
        
        response = await client.post("/api/v1/auth/login", data=login_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
    
    async def test_invalid_login(self, client: AsyncClient):
        """Test login with invalid credentials."""
        login_data = {
            "username": "invalid@example.com",
            "password": "wrongpassword"
        }
        
        response = await client.post("/api/v1/auth/login", data=login_data)
        assert response.status_code == 401
    
    async def test_token_refresh(self, client: AsyncClient, test_user: User):
        """Test token refresh functionality."""
        # First login to get tokens
        login_data = {
            "username": test_user.email,
            "password": "testpassword123"
        }
        
        login_response = await client.post("/api/v1/auth/login", data=login_data)
        tokens = login_response.json()
        
        # Use refresh token
        refresh_data = {
            "refresh_token": tokens["refresh_token"]
        }
        
        response = await client.post("/api/v1/auth/refresh", json=refresh_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"


class TestLeadManagement:
    """Test lead CRUD operations and scoring."""
    
    async def test_create_lead(self, client: AsyncClient, test_user: User):
        """Test lead creation endpoint."""
        # Get auth token
        login_data = {
            "username": test_user.email,
            "password": "testpassword123"
        }
        login_response = await client.post("/api/v1/auth/login", data=login_data)
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        lead_data = {
            "email": "newlead@example.com",
            "first_name": "New",
            "last_name": "Lead",
            "company_name": "New Company",
            "job_title": "CEO",
            "industry": "Technology",
            "company_size": "11-50",
            "status": "new",
            "source": "website"
        }
        
        response = await client.post("/api/v1/leads", json=lead_data, headers=headers)
        assert response.status_code == 201
        
        data = response.json()
        assert data["email"] == lead_data["email"]
        assert data["company_name"] == lead_data["company_name"]
        assert "current_score" in data
    
    async def test_get_leads(self, client: AsyncClient, test_user: User, test_lead: Lead):
        """Test lead listing endpoint."""
        # Get auth token
        login_data = {
            "username": test_user.email,
            "password": "testpassword123"
        }
        login_response = await client.post("/api/v1/auth/login", data=login_data)
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = await client.get("/api/v1/leads", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert len(data["items"]) >= 1
    
    async def test_update_lead_score(self, client: AsyncClient, test_user: User, test_lead: Lead):
        """Test lead score update endpoint."""
        # Get auth token
        login_data = {
            "username": test_user.email,
            "password": "testpassword123"
        }
        login_response = await client.post("/api/v1/auth/login", data=login_data)
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        score_data = {
            "score": 85,
            "explanation": "Updated score based on recent activity"
        }
        
        response = await client.put(
            f"/api/v1/leads/{test_lead.id}/score", 
            json=score_data, 
            headers=headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["current_score"] == score_data["score"]


class TestMLService:
    """Test machine learning service endpoints."""
    
    @pytest.fixture
    def ml_client(self):
        """Create ML service test client."""
        from ml_services.app.main import app as ml_app
        return TestClient(ml_app)
    
    def test_ml_health_check(self, ml_client: TestClient):
        """Test ML service health check."""
        response = ml_client.get("/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "lead-scoring-ml"
    
    def test_predict_lead_score(self, ml_client: TestClient):
        """Test lead score prediction endpoint."""
        lead_data = {
            "features": {
                "email": "test@example.com",
                "company_name": "Test Company",
                "job_title": "CEO",
                "industry": "Technology",
                "company_size": "11-50",
                "annual_revenue": "$1M-$10M",
                "email_engagement_score": 0.75,
                "website_engagement_score": 0.60,
                "total_activities": 15
            }
        }
        
        response = ml_client.post("/api/v1/scoring/predict", json=lead_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "score" in data
        assert "explanation" in data
        assert "confidence" in data
        assert 0 <= data["score"] <= 100
    
    def test_batch_predictions(self, ml_client: TestClient):
        """Test batch prediction endpoint."""
        batch_data = {
            "leads": [
                {
                    "id": "lead1",
                    "features": {
                        "company_name": "Company A",
                        "job_title": "CEO",
                        "industry": "Technology"
                    }
                },
                {
                    "id": "lead2",
                    "features": {
                        "company_name": "Company B", 
                        "job_title": "CTO",
                        "industry": "Healthcare"
                    }
                }
            ]
        }
        
        response = ml_client.post("/api/v1/scoring/batch", json=batch_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "predictions" in data
        assert len(data["predictions"]) == 2


class TestAnalytics:
    """Test analytics and reporting endpoints."""
    
    async def test_lead_analytics(self, client: AsyncClient, test_user: User):
        """Test lead analytics endpoint."""
        # Get auth token
        login_data = {
            "username": test_user.email,
            "password": "testpassword123"
        }
        login_response = await client.post("/api/v1/auth/login", data=login_data)
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = await client.get("/api/v1/analytics/leads", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "total_leads" in data
        assert "qualified_leads" in data
        assert "conversion_rate" in data
        assert "average_score" in data
    
    async def test_score_distribution(self, client: AsyncClient, test_user: User):
        """Test score distribution analytics."""
        # Get auth token
        login_data = {
            "username": test_user.email,
            "password": "testpassword123"
        }
        login_response = await client.post("/api/v1/auth/login", data=login_data)
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = await client.get("/api/v1/analytics/score-distribution", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "distribution" in data
        assert "buckets" in data


class TestIntegrations:
    """Test external integration functionality."""
    
    async def test_crm_integration_setup(self, client: AsyncClient, test_user: User):
        """Test CRM integration setup."""
        # Get auth token
        login_data = {
            "username": test_user.email,
            "password": "testpassword123"
        }
        login_response = await client.post("/api/v1/auth/login", data=login_data)
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        integration_data = {
            "platform": "salesforce",
            "config": {
                "client_id": "test_client_id",
                "client_secret": "test_client_secret",
                "instance_url": "https://test.salesforce.com"
            },
            "enabled": True
        }
        
        response = await client.post(
            "/api/v1/integrations", 
            json=integration_data, 
            headers=headers
        )
        assert response.status_code == 201
        
        data = response.json()
        assert data["platform"] == integration_data["platform"]
        assert data["enabled"] == integration_data["enabled"]


class TestSecurity:
    """Test security features and compliance."""
    
    async def test_unauthorized_access(self, client: AsyncClient):
        """Test that protected endpoints require authentication."""
        response = await client.get("/api/v1/leads")
        assert response.status_code == 401
    
    async def test_invalid_token(self, client: AsyncClient):
        """Test request with invalid token."""
        headers = {"Authorization": "Bearer invalid_token"}
        response = await client.get("/api/v1/leads", headers=headers)
        assert response.status_code == 401
    
    async def test_rate_limiting(self, client: AsyncClient, test_user: User):
        """Test rate limiting functionality."""
        # This test would need to be adapted based on actual rate limiting implementation
        pass
    
    async def test_data_encryption(self, db_session: AsyncSession, test_user: User):
        """Test that sensitive data is properly encrypted."""
        # Verify password is hashed
        assert test_user.hashed_password != "testpassword123"
        assert test_user.verify_password("testpassword123")


class TestPerformance:
    """Test performance requirements."""
    
    async def test_response_times(self, client: AsyncClient, test_user: User):
        """Test that API responses meet performance requirements."""
        import time
        
        # Get auth token
        login_data = {
            "username": test_user.email,
            "password": "testpassword123"
        }
        login_response = await client.post("/api/v1/auth/login", data=login_data)
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        start_time = time.time()
        response = await client.get("/api/v1/leads", headers=headers)
        end_time = time.time()
        
        assert response.status_code == 200
        assert (end_time - start_time) < 1.0  # Response under 1 second
    
    def test_ml_prediction_speed(self, ml_client: TestClient):
        """Test ML prediction response time."""
        import time
        
        lead_data = {
            "features": {
                "company_name": "Test Company",
                "job_title": "CEO",
                "industry": "Technology"
            }
        }
        
        start_time = time.time()
        response = ml_client.post("/api/v1/scoring/predict", json=lead_data)
        end_time = time.time()
        
        assert response.status_code == 200
        assert (end_time - start_time) < 0.5  # ML prediction under 500ms


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])