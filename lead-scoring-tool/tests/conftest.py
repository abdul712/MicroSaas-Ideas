"""
Test configuration and fixtures for Lead Scoring Tool
"""

import asyncio
import pytest
import pytest_asyncio
from typing import AsyncGenerator, Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.main import app
from backend.app.core.config import get_settings
from backend.app.core.database import get_db, Base
from backend.app.models.database import User, Organization, Lead

# Test database URL
TEST_DATABASE_URL = "sqlite:///./test.db"

# Create test engine
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
def db_session():
    """Create a test database session."""
    Base.metadata.create_all(bind=engine)
    
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client."""
    def override_get_db():
        try:
            yield db_session
        finally:
            db_session.close()

    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture
def test_organization(db_session):
    """Create a test organization."""
    org = Organization(
        name="Test Organization",
        domain="test.com",
        industry="technology",
        size_category="small"
    )
    db_session.add(org)
    db_session.commit()
    db_session.refresh(org)
    return org


@pytest.fixture
def test_user(db_session, test_organization):
    """Create a test user."""
    user = User(
        organization_id=test_organization.id,
        email="test@test.com",
        first_name="Test",
        last_name="User",
        password_hash="hashed_password",
        role="admin",
        is_active=True,
        is_verified=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_lead(db_session, test_organization):
    """Create a test lead."""
    lead = Lead(
        organization_id=test_organization.id,
        email="lead@example.com",
        first_name="John",
        last_name="Doe",
        company="Example Corp",
        job_title="Marketing Manager",
        source="website",
        status="new",
        current_score=0
    )
    db_session.add(lead)
    db_session.commit()
    db_session.refresh(lead)
    return lead


@pytest.fixture
def auth_headers(test_user):
    """Create authentication headers for test requests."""
    # Mock JWT token for testing
    token = "test_jwt_token"
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sample_lead_data():
    """Sample lead data for testing."""
    return {
        "email": "sample@example.com",
        "first_name": "Jane",
        "last_name": "Smith",
        "company": "Sample Inc",
        "job_title": "CEO",
        "phone": "+1-555-123-4567",
        "source": "email_campaign",
        "custom_fields": {
            "company_size": "50-100",
            "industry": "saas",
            "budget": "high"
        }
    }


@pytest.fixture
def sample_activity_data():
    """Sample activity data for testing."""
    return {
        "activity_type": "email_open",
        "activity_data": {
            "campaign_id": "camp_123",
            "email_subject": "Welcome to our platform",
            "timestamp": "2024-01-01T12:00:00Z"
        },
        "source": "email",
        "source_url": "https://example.com/email/123"
    }


@pytest.fixture
def mock_ml_model():
    """Mock ML model for testing."""
    class MockModel:
        def predict(self, features):
            return [0.75]  # Mock prediction
        
        def predict_proba(self, features):
            return [[0.25, 0.75]]  # Mock probabilities
    
    return MockModel()


@pytest.fixture
def mock_feature_data():
    """Mock feature data for ML testing."""
    return {
        "behavioral_features": {
            "email_open_rate": 0.8,
            "website_visit_frequency": 5,
            "content_consumption_score": 7,
            "demo_request_count": 1,
            "last_activity_days": 2
        },
        "demographic_features": {
            "company_size_score": 8,
            "industry_fit_score": 9,
            "title_seniority_score": 7,
            "geographic_score": 6,
            "technographic_score": 8
        },
        "engagement_features": {
            "social_media_engagement": 3,
            "content_download_count": 2,
            "webinar_attendance": 1,
            "form_submission_count": 2
        }
    }


@pytest.fixture
def sample_scoring_model_config():
    """Sample scoring model configuration."""
    return {
        "name": "Test Scoring Model",
        "description": "Model for testing purposes",
        "model_type": "composite",
        "features": [
            "email_open_rate",
            "website_visit_frequency",
            "company_size_score",
            "industry_fit_score"
        ],
        "weights": {
            "behavioral": 0.4,
            "demographic": 0.3,
            "engagement": 0.3
        },
        "config": {
            "algorithm": "random_forest",
            "hyperparameters": {
                "n_estimators": 100,
                "max_depth": 10,
                "min_samples_split": 2
            }
        }
    }


@pytest.fixture
def sample_integration_config():
    """Sample integration configuration."""
    return {
        "platform": "hubspot",
        "name": "Test HubSpot Integration",
        "description": "Integration for testing",
        "config": {
            "api_key": "test_api_key",
            "portal_id": "12345",
            "sync_frequency": "hourly"
        },
        "webhook_url": "https://api.example.com/webhooks/hubspot"
    }


# Async fixtures
@pytest_asyncio.fixture
async def async_client():
    """Create an async test client."""
    from httpx import AsyncClient
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def mock_redis():
    """Mock Redis connection for testing."""
    class MockRedis:
        def __init__(self):
            self.data = {}
        
        async def get(self, key):
            return self.data.get(key)
        
        async def set(self, key, value, ex=None):
            self.data[key] = value
            return True
        
        async def delete(self, key):
            if key in self.data:
                del self.data[key]
            return True
        
        async def exists(self, key):
            return key in self.data
    
    return MockRedis()


@pytest_asyncio.fixture
async def mock_kafka_producer():
    """Mock Kafka producer for testing."""
    class MockKafkaProducer:
        def __init__(self):
            self.messages = []
        
        async def send(self, topic, value, key=None):
            self.messages.append({
                "topic": topic,
                "value": value,
                "key": key
            })
            return True
        
        async def flush(self):
            return True
    
    return MockKafkaProducer()


@pytest_asyncio.fixture
async def mock_feature_store():
    """Mock feature store for testing."""
    class MockFeatureStore:
        async def get_features(self, lead_id):
            return {
                "behavioral_score": 75,
                "demographic_score": 80,
                "engagement_score": 60
            }
        
        async def store_features(self, lead_id, features):
            return True
        
        async def extract_features(self, lead_data):
            return {
                "email_open_rate": 0.7,
                "website_visits": 5,
                "company_size": 100
            }
    
    return MockFeatureStore()


# Test data generators
def generate_test_leads(count: int = 10):
    """Generate test lead data."""
    leads = []
    for i in range(count):
        leads.append({
            "email": f"test{i}@example.com",
            "first_name": f"Test{i}",
            "last_name": "User",
            "company": f"Company {i}",
            "job_title": "Manager",
            "source": "website",
            "current_score": i * 10
        })
    return leads


def generate_test_activities(lead_id: str, count: int = 5):
    """Generate test activity data."""
    activities = []
    activity_types = ["email_open", "website_visit", "form_submit", "content_download"]
    
    for i in range(count):
        activities.append({
            "lead_id": lead_id,
            "activity_type": activity_types[i % len(activity_types)],
            "activity_data": {
                "timestamp": f"2024-01-{i+1:02d}T12:00:00Z",
                "value": i
            },
            "source": "website"
        })
    return activities


# Performance testing helpers
@pytest.fixture
def performance_test_data():
    """Generate data for performance testing."""
    return {
        "leads": generate_test_leads(1000),
        "activities": generate_test_activities("test_lead_id", 100)
    }


# Mock external services
@pytest.fixture
def mock_external_apis(monkeypatch):
    """Mock external API calls."""
    class MockAPIResponse:
        def __init__(self, json_data, status_code=200):
            self.json_data = json_data
            self.status_code = status_code
        
        def json(self):
            return self.json_data
    
    def mock_hubspot_api(*args, **kwargs):
        return MockAPIResponse({"status": "success"})
    
    def mock_salesforce_api(*args, **kwargs):
        return MockAPIResponse({"records": []})
    
    monkeypatch.setattr("httpx.get", mock_hubspot_api)
    monkeypatch.setattr("httpx.post", mock_hubspot_api)


# Database utilities
@pytest.fixture
def db_utils(db_session):
    """Database utility functions for testing."""
    class DatabaseUtils:
        def __init__(self, session):
            self.session = session
        
        def create_test_data(self):
            """Create comprehensive test data."""
            org = Organization(name="Test Org", domain="test.com")
            self.session.add(org)
            self.session.commit()
            
            user = User(
                organization_id=org.id,
                email="admin@test.com",
                password_hash="hashed",
                role="admin"
            )
            self.session.add(user)
            self.session.commit()
            
            return {"organization": org, "user": user}
        
        def cleanup_test_data(self):
            """Clean up test data."""
            self.session.query(User).delete()
            self.session.query(Organization).delete()
            self.session.commit()
    
    return DatabaseUtils(db_session)