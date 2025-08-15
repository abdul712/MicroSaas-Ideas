"""
FraudShield Fraud Assessment API Endpoints
Real-time fraud detection and risk assessment endpoints.
"""

import asyncio
import time
from typing import Dict, List, Optional, Any
from datetime import datetime

import structlog
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Request
from fastapi.responses import JSONResponse
from prometheus_client import Counter, Histogram

from app.core.config import get_settings
from app.core.security import get_current_user, require_permissions
from app.services.fraud_engine import FraudDetectionEngine
from app.services.alert_service import AlertService
from app.services.analytics_service import AnalyticsService
from app.models.fraud_assessment import (
    TransactionData,
    FraudAssessmentResult,
    BatchAssessmentRequest,
    BatchAssessmentResult,
    AssessmentFilters,
    AssessmentSummary
)
from app.models.user import User
from app.database.repositories.fraud_assessment_repository import FraudAssessmentRepository

logger = structlog.get_logger(__name__)
router = APIRouter()

# Prometheus metrics
ASSESSMENT_REQUESTS = Counter('fraud_assessment_requests_total', 'Total assessment requests', ['decision', 'risk_level'])
ASSESSMENT_DURATION = Histogram('fraud_assessment_duration_seconds', 'Assessment duration')
BATCH_ASSESSMENT_SIZE = Histogram('batch_assessment_size', 'Batch assessment size')

async def get_fraud_engine() -> FraudDetectionEngine:
    """Dependency to get fraud detection engine."""
    from app.main import app
    if not hasattr(app.state, 'fraud_engine'):
        raise HTTPException(status_code=503, detail="Fraud detection engine not available")
    return app.state.fraud_engine

async def get_alert_service() -> AlertService:
    """Dependency to get alert service."""
    return AlertService()

async def get_analytics_service() -> AnalyticsService:
    """Dependency to get analytics service."""
    return AnalyticsService()

@router.post("/assess", response_model=FraudAssessmentResult)
async def assess_transaction(
    transaction_data: TransactionData,
    background_tasks: BackgroundTasks,
    request: Request,
    fraud_engine: FraudDetectionEngine = Depends(get_fraud_engine),
    alert_service: AlertService = Depends(get_alert_service),
    analytics_service: AnalyticsService = Depends(get_analytics_service),
    current_user: User = Depends(get_current_user)
) -> FraudAssessmentResult:
    """
    Assess a single transaction for fraud risk.
    
    This endpoint provides real-time fraud detection using advanced ML models
    and behavioral analysis to determine the fraud risk of a transaction.
    
    Args:
        transaction_data: Transaction information to assess
        background_tasks: FastAPI background tasks
        request: HTTP request object
        fraud_engine: Fraud detection engine
        alert_service: Alert service for notifications
        analytics_service: Analytics service for metrics
        current_user: Authenticated user
        
    Returns:
        FraudAssessmentResult: Comprehensive fraud assessment with risk score and decision
    """
    start_time = time.time()
    
    try:
        # Validate organization access
        if transaction_data.organization_id != current_user.organization_id:
            raise HTTPException(status_code=403, detail="Access denied to organization data")
        
        # Add request metadata
        transaction_data.ip_address = transaction_data.ip_address or request.client.host
        transaction_data.user_agent = transaction_data.user_agent or request.headers.get("user-agent", "")
        
        logger.info(
            "Starting fraud assessment",
            transaction_id=transaction_data.transaction_id,
            organization_id=transaction_data.organization_id,
            amount=transaction_data.amount,
            user_id=current_user.id
        )
        
        # Perform fraud assessment
        assessment_result = await fraud_engine.assess_transaction(transaction_data)
        
        # Record metrics
        processing_time = time.time() - start_time
        ASSESSMENT_DURATION.observe(processing_time)
        ASSESSMENT_REQUESTS.labels(
            decision=assessment_result.decision.value,
            risk_level=assessment_result.risk_level.value
        ).inc()
        
        # Store assessment in database
        background_tasks.add_task(
            _store_assessment,
            assessment_result,
            transaction_data,
            current_user.id
        )
        
        # Send alerts for high-risk transactions
        if assessment_result.risk_level.value in ['high', 'critical']:
            background_tasks.add_task(
                _send_fraud_alerts,
                assessment_result,
                transaction_data,
                alert_service
            )
        
        # Update analytics
        background_tasks.add_task(
            _update_analytics,
            assessment_result,
            transaction_data,
            analytics_service
        )
        
        logger.info(
            "Fraud assessment completed",
            transaction_id=transaction_data.transaction_id,
            assessment_id=assessment_result.assessment_id,
            risk_score=assessment_result.risk_score,
            decision=assessment_result.decision.value,
            processing_time_ms=assessment_result.processing_time_ms
        )
        
        return assessment_result
        
    except HTTPException:
        raise
    except Exception as e:
        processing_time = time.time() - start_time
        logger.error(
            "Fraud assessment failed",
            transaction_id=getattr(transaction_data, 'transaction_id', 'unknown'),
            error=str(e),
            processing_time_ms=int(processing_time * 1000)
        )
        raise HTTPException(status_code=500, detail="Fraud assessment failed")

@router.post("/assess/batch", response_model=BatchAssessmentResult)
async def assess_batch_transactions(
    batch_request: BatchAssessmentRequest,
    background_tasks: BackgroundTasks,
    fraud_engine: FraudDetectionEngine = Depends(get_fraud_engine),
    current_user: User = Depends(require_permissions(["batch_assess"]))
) -> BatchAssessmentResult:
    """
    Assess multiple transactions in batch for fraud risk.
    
    This endpoint allows for efficient processing of multiple transactions
    with parallel processing and optimized resource usage.
    
    Args:
        batch_request: Batch of transactions to assess
        background_tasks: FastAPI background tasks
        fraud_engine: Fraud detection engine
        current_user: Authenticated user with batch permissions
        
    Returns:
        BatchAssessmentResult: Results for all transactions in the batch
    """
    start_time = time.time()
    
    try:
        # Validate batch size
        if len(batch_request.transactions) > 1000:
            raise HTTPException(status_code=400, detail="Batch size too large (max 1000)")
        
        # Validate all transactions belong to user's organization
        for transaction in batch_request.transactions:
            if transaction.organization_id != current_user.organization_id:
                raise HTTPException(status_code=403, detail="Access denied to organization data")
        
        logger.info(
            "Starting batch fraud assessment",
            batch_size=len(batch_request.transactions),
            organization_id=current_user.organization_id,
            user_id=current_user.id
        )
        
        # Record batch size metric
        BATCH_ASSESSMENT_SIZE.observe(len(batch_request.transactions))
        
        # Process transactions in parallel with concurrency limit
        semaphore = asyncio.Semaphore(10)  # Max 10 concurrent assessments
        assessment_tasks = []
        
        async def assess_with_semaphore(transaction_data: TransactionData):
            async with semaphore:
                return await fraud_engine.assess_transaction(transaction_data)
        
        for transaction in batch_request.transactions:
            task = assess_with_semaphore(transaction)
            assessment_tasks.append(task)
        
        # Execute all assessments
        assessment_results = await asyncio.gather(*assessment_tasks, return_exceptions=True)
        
        # Process results and handle exceptions
        successful_assessments = []
        failed_assessments = []
        
        for i, result in enumerate(assessment_results):
            transaction = batch_request.transactions[i]
            
            if isinstance(result, Exception):
                failed_assessments.append({
                    "transaction_id": transaction.transaction_id,
                    "error": str(result)
                })
                logger.error(
                    "Batch assessment failed for transaction",
                    transaction_id=transaction.transaction_id,
                    error=str(result)
                )
            else:
                successful_assessments.append(result)
        
        # Store successful assessments in background
        if successful_assessments:
            background_tasks.add_task(
                _store_batch_assessments,
                successful_assessments,
                batch_request.transactions[:len(successful_assessments)],
                current_user.id
            )
        
        processing_time = time.time() - start_time
        
        # Create batch result
        batch_result = BatchAssessmentResult(
            batch_id=f"batch_{int(time.time())}_{current_user.id}",
            total_transactions=len(batch_request.transactions),
            successful_assessments=len(successful_assessments),
            failed_assessments=len(failed_assessments),
            processing_time_ms=int(processing_time * 1000),
            results=successful_assessments,
            errors=failed_assessments
        )
        
        logger.info(
            "Batch fraud assessment completed",
            batch_id=batch_result.batch_id,
            total_transactions=batch_result.total_transactions,
            successful=batch_result.successful_assessments,
            failed=batch_result.failed_assessments,
            processing_time_ms=batch_result.processing_time_ms
        )
        
        return batch_result
        
    except HTTPException:
        raise
    except Exception as e:
        processing_time = time.time() - start_time
        logger.error(
            "Batch fraud assessment failed",
            batch_size=len(batch_request.transactions) if batch_request else 0,
            error=str(e),
            processing_time_ms=int(processing_time * 1000)
        )
        raise HTTPException(status_code=500, detail="Batch assessment failed")

@router.get("/assessments", response_model=List[FraudAssessmentResult])
async def get_assessments(
    filters: AssessmentFilters = Depends(),
    current_user: User = Depends(get_current_user)
) -> List[FraudAssessmentResult]:
    """
    Retrieve fraud assessments with filtering and pagination.
    
    Args:
        filters: Assessment filters (risk level, date range, etc.)
        current_user: Authenticated user
        
    Returns:
        List of fraud assessments matching the filters
    """
    try:
        repo = FraudAssessmentRepository()
        
        # Add organization filter
        filters.organization_id = current_user.organization_id
        
        assessments = await repo.get_assessments(filters)
        
        logger.info(
            "Retrieved fraud assessments",
            count=len(assessments),
            organization_id=current_user.organization_id,
            user_id=current_user.id
        )
        
        return assessments
        
    except Exception as e:
        logger.error("Failed to retrieve assessments", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve assessments")

@router.get("/assessments/{assessment_id}", response_model=FraudAssessmentResult)
async def get_assessment(
    assessment_id: str,
    current_user: User = Depends(get_current_user)
) -> FraudAssessmentResult:
    """
    Retrieve a specific fraud assessment by ID.
    
    Args:
        assessment_id: Assessment identifier
        current_user: Authenticated user
        
    Returns:
        Fraud assessment details
    """
    try:
        repo = FraudAssessmentRepository()
        assessment = await repo.get_assessment_by_id(assessment_id)
        
        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found")
        
        # Verify organization access
        if assessment.organization_id != current_user.organization_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return assessment
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve assessment {assessment_id}", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve assessment")

@router.get("/summary", response_model=AssessmentSummary)
async def get_assessment_summary(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends(get_analytics_service)
) -> AssessmentSummary:
    """
    Get fraud assessment summary statistics.
    
    Args:
        days: Number of days to include in summary (default: 30)
        current_user: Authenticated user
        analytics_service: Analytics service
        
    Returns:
        Assessment summary with key metrics
    """
    try:
        summary = await analytics_service.get_assessment_summary(
            organization_id=current_user.organization_id,
            days=days
        )
        
        logger.info(
            "Retrieved assessment summary",
            organization_id=current_user.organization_id,
            days=days,
            user_id=current_user.id
        )
        
        return summary
        
    except Exception as e:
        logger.error("Failed to retrieve assessment summary", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve summary")

@router.post("/feedback")
async def submit_assessment_feedback(
    assessment_id: str,
    is_accurate: bool,
    actual_fraud: Optional[bool] = None,
    comments: Optional[str] = None,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: User = Depends(get_current_user)
):
    """
    Submit feedback on a fraud assessment for model improvement.
    
    Args:
        assessment_id: Assessment to provide feedback on
        is_accurate: Whether the assessment was accurate
        actual_fraud: Whether the transaction was actually fraudulent
        comments: Optional feedback comments
        background_tasks: Background tasks
        current_user: Authenticated user
        
    Returns:
        Success confirmation
    """
    try:
        # Store feedback
        background_tasks.add_task(
            _store_assessment_feedback,
            assessment_id,
            is_accurate,
            actual_fraud,
            comments,
            current_user.id
        )
        
        logger.info(
            "Assessment feedback submitted",
            assessment_id=assessment_id,
            is_accurate=is_accurate,
            actual_fraud=actual_fraud,
            user_id=current_user.id
        )
        
        return {"message": "Feedback submitted successfully"}
        
    except Exception as e:
        logger.error("Failed to submit feedback", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to submit feedback")

# Background task functions

async def _store_assessment(
    assessment_result: FraudAssessmentResult,
    transaction_data: TransactionData,
    user_id: str
):
    """Store fraud assessment in database."""
    try:
        repo = FraudAssessmentRepository()
        await repo.store_assessment(assessment_result, transaction_data, user_id)
    except Exception as e:
        logger.error("Failed to store assessment", error=str(e))

async def _store_batch_assessments(
    assessment_results: List[FraudAssessmentResult],
    transaction_data_list: List[TransactionData],
    user_id: str
):
    """Store batch fraud assessments in database."""
    try:
        repo = FraudAssessmentRepository()
        await repo.store_batch_assessments(assessment_results, transaction_data_list, user_id)
    except Exception as e:
        logger.error("Failed to store batch assessments", error=str(e))

async def _send_fraud_alerts(
    assessment_result: FraudAssessmentResult,
    transaction_data: TransactionData,
    alert_service: AlertService
):
    """Send fraud alerts for high-risk transactions."""
    try:
        await alert_service.send_fraud_alert(assessment_result, transaction_data)
    except Exception as e:
        logger.error("Failed to send fraud alert", error=str(e))

async def _update_analytics(
    assessment_result: FraudAssessmentResult,
    transaction_data: TransactionData,
    analytics_service: AnalyticsService
):
    """Update analytics with assessment data."""
    try:
        await analytics_service.record_assessment(assessment_result, transaction_data)
    except Exception as e:
        logger.error("Failed to update analytics", error=str(e))

async def _store_assessment_feedback(
    assessment_id: str,
    is_accurate: bool,
    actual_fraud: Optional[bool],
    comments: Optional[str],
    user_id: str
):
    """Store assessment feedback for model improvement."""
    try:
        repo = FraudAssessmentRepository()
        await repo.store_feedback(assessment_id, is_accurate, actual_fraud, comments, user_id)
    except Exception as e:
        logger.error("Failed to store assessment feedback", error=str(e))