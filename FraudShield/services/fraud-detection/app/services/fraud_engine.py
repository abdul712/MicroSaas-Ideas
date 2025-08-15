"""
FraudShield Core Fraud Detection Engine
Advanced ML-powered fraud detection with real-time risk assessment.
"""

import asyncio
import time
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
import json
import hashlib

import structlog
import numpy as np
from pydantic import BaseModel, validator

from app.core.config import get_settings
from app.services.feature_engineering import FeatureEngineer
from app.services.behavioral_analyzer import BehavioralAnalyzer
from app.services.risk_calibrator import RiskCalibrator
from app.services.ml_client import MLServiceClient
from app.services.cache_service import CacheService
from app.models.fraud_assessment import (
    TransactionData, 
    FraudAssessmentResult, 
    RiskFactor,
    DecisionType,
    RiskLevel
)

logger = structlog.get_logger(__name__)

class FraudDetectionEngine:
    """
    Core fraud detection engine that orchestrates ML models, behavioral analysis,
    and risk assessment to provide real-time fraud detection decisions.
    """
    
    def __init__(self):
        self.settings = get_settings()
        self.feature_engineer = FeatureEngineer()
        self.behavioral_analyzer = BehavioralAnalyzer()
        self.risk_calibrator = RiskCalibrator()
        self.ml_client: Optional[MLServiceClient] = None
        self.cache_service = CacheService()
        self.is_initialized = False
        
        # Performance metrics
        self.assessment_count = 0
        self.total_processing_time = 0.0
        
    async def initialize(self):
        """Initialize the fraud detection engine."""
        try:
            logger.info("Initializing fraud detection engine")
            
            # Initialize ML service client
            self.ml_client = MLServiceClient(self.settings.ML_SERVICE_URL)
            await self.ml_client.initialize()
            
            # Initialize feature engineer
            await self.feature_engineer.initialize()
            
            # Initialize behavioral analyzer
            await self.behavioral_analyzer.initialize()
            
            # Initialize risk calibrator
            await self.risk_calibrator.initialize()
            
            # Warm up caches
            await self._warmup_caches()
            
            self.is_initialized = True
            logger.info("Fraud detection engine initialized successfully")
            
        except Exception as e:
            logger.error("Failed to initialize fraud detection engine", error=str(e))
            raise
    
    async def assess_transaction(self, transaction_data: TransactionData) -> FraudAssessmentResult:
        """
        Assess a transaction for fraud risk using ML models and behavioral analysis.
        
        Args:
            transaction_data: Transaction information to assess
            
        Returns:
            FraudAssessmentResult: Comprehensive fraud assessment with risk score and decision
        """
        if not self.is_initialized:
            raise RuntimeError("Fraud detection engine not initialized")
        
        start_time = time.time()
        assessment_id = self._generate_assessment_id(transaction_data)
        
        try:
            logger.info(
                "Starting fraud assessment", 
                transaction_id=transaction_data.transaction_id,
                assessment_id=assessment_id
            )
            
            # Check cache for recent assessment
            cached_result = await self._check_cache(transaction_data)
            if cached_result:
                logger.info("Returning cached fraud assessment", assessment_id=assessment_id)
                return cached_result
            
            # Step 1: Feature extraction and engineering
            features = await self.feature_engineer.extract_features(transaction_data)
            logger.debug("Feature extraction completed", feature_count=len(features.ml_features))
            
            # Step 2: Behavioral analysis
            behavioral_score = await self.behavioral_analyzer.analyze(
                customer_id=transaction_data.customer_id,
                transaction_history=features.history_features,
                current_transaction=transaction_data
            )
            logger.debug("Behavioral analysis completed", behavioral_score=behavioral_score)
            
            # Step 3: ML model inference
            ml_predictions = await self._get_ml_predictions(features.ml_features)
            logger.debug("ML inference completed", predictions=ml_predictions)
            
            # Step 4: Risk calibration and scoring
            risk_score = await self.risk_calibrator.calibrate_score(
                ml_predictions=ml_predictions,
                behavioral_score=behavioral_score,
                transaction_data=transaction_data,
                features=features
            )
            logger.debug("Risk calibration completed", risk_score=risk_score)
            
            # Step 5: Decision logic
            decision = self._make_decision(risk_score, transaction_data)
            risk_level = self._determine_risk_level(risk_score)
            
            # Step 6: Generate risk factors and explanations
            risk_factors = await self._generate_risk_factors(
                features, behavioral_score, ml_predictions, risk_score
            )
            
            # Step 7: Get recommended actions
            recommended_actions = self._get_recommended_actions(decision, risk_level, risk_factors)
            
            # Create assessment result
            processing_time = time.time() - start_time
            result = FraudAssessmentResult(
                transaction_id=transaction_data.transaction_id,
                assessment_id=assessment_id,
                risk_score=risk_score,
                risk_level=risk_level,
                decision=decision,
                fraud_probability=ml_predictions.get("ensemble_probability", 0.0),
                behavioral_score=behavioral_score,
                processing_time_ms=int(processing_time * 1000),
                risk_factors=risk_factors,
                recommended_actions=recommended_actions,
                model_version=ml_predictions.get("model_version", "unknown"),
                confidence=ml_predictions.get("confidence", 0.0),
                timestamp=datetime.utcnow()
            )
            
            # Cache the result
            await self._cache_result(transaction_data, result)
            
            # Update metrics
            self._update_metrics(processing_time, decision, risk_level)
            
            logger.info(
                "Fraud assessment completed",
                transaction_id=transaction_data.transaction_id,
                assessment_id=assessment_id,
                risk_score=risk_score,
                decision=decision.value,
                processing_time_ms=int(processing_time * 1000)
            )
            
            return result
            
        except Exception as e:
            processing_time = time.time() - start_time
            logger.error(
                "Fraud assessment failed",
                transaction_id=transaction_data.transaction_id,
                assessment_id=assessment_id,
                error=str(e),
                processing_time_ms=int(processing_time * 1000)
            )
            raise
    
    async def _get_ml_predictions(self, features: np.ndarray) -> Dict[str, Any]:
        """Get predictions from ML service."""
        if not self.ml_client:
            raise RuntimeError("ML client not initialized")
        
        try:
            predictions = await self.ml_client.predict_fraud(features)
            return predictions
        except Exception as e:
            logger.error("ML prediction failed", error=str(e))
            # Fallback to rule-based assessment
            return {
                "ensemble_probability": 0.5,
                "confidence": 0.3,
                "model_version": "fallback",
                "individual_predictions": {}
            }
    
    def _make_decision(self, risk_score: float, transaction_data: TransactionData) -> DecisionType:
        """Make fraud decision based on risk score and business rules."""
        thresholds = self.settings.fraud_thresholds
        
        # High-value transactions have stricter thresholds
        if transaction_data.amount > 1000:
            adjusted_thresholds = {
                "low": thresholds["low"] * 0.8,
                "medium": thresholds["medium"] * 0.8,
                "high": thresholds["high"] * 0.8
            }
        else:
            adjusted_thresholds = thresholds
        
        if risk_score >= adjusted_thresholds["high"]:
            return DecisionType.DECLINE
        elif risk_score >= adjusted_thresholds["medium"]:
            return DecisionType.REVIEW
        elif risk_score >= adjusted_thresholds["low"]:
            return DecisionType.MONITOR
        else:
            return DecisionType.APPROVE
    
    def _determine_risk_level(self, risk_score: float) -> RiskLevel:
        """Determine risk level based on risk score."""
        thresholds = self.settings.fraud_thresholds
        
        if risk_score >= thresholds["high"]:
            return RiskLevel.HIGH
        elif risk_score >= thresholds["medium"]:
            return RiskLevel.MEDIUM
        elif risk_score >= thresholds["low"]:
            return RiskLevel.LOW
        else:
            return RiskLevel.VERY_LOW
    
    async def _generate_risk_factors(
        self, 
        features: Any, 
        behavioral_score: float, 
        ml_predictions: Dict[str, Any], 
        risk_score: float
    ) -> List[RiskFactor]:
        """Generate detailed risk factors explaining the fraud decision."""
        risk_factors = []
        
        # Behavioral risk factors
        if behavioral_score > 50:
            risk_factors.append(RiskFactor(
                factor="behavioral_anomaly",
                score=behavioral_score,
                description=f"Unusual behavioral patterns detected (score: {behavioral_score:.1f})",
                weight=0.3
            ))
        
        # ML model risk factors
        for model_name, prediction in ml_predictions.get("individual_predictions", {}).items():
            if prediction > 0.5:
                risk_factors.append(RiskFactor(
                    factor=f"ml_model_{model_name}",
                    score=prediction * 100,
                    description=f"{model_name.replace('_', ' ').title()} model indicates fraud risk",
                    weight=self.settings.ENSEMBLE_WEIGHTS.get(model_name, 0.1)
                ))
        
        # Feature-based risk factors
        feature_risks = await self._analyze_feature_risks(features)
        risk_factors.extend(feature_risks)
        
        # Sort by score descending
        risk_factors.sort(key=lambda x: x.score, reverse=True)
        
        return risk_factors[:10]  # Return top 10 risk factors
    
    async def _analyze_feature_risks(self, features: Any) -> List[RiskFactor]:
        """Analyze individual features for risk indicators."""
        risk_factors = []
        
        # Geographic risk
        if hasattr(features, 'geo_risk_score') and features.geo_risk_score > 30:
            risk_factors.append(RiskFactor(
                factor="geographic_risk",
                score=features.geo_risk_score,
                description="Transaction from high-risk geographic location",
                weight=0.2
            ))
        
        # Device risk
        if hasattr(features, 'device_risk_score') and features.device_risk_score > 40:
            risk_factors.append(RiskFactor(
                factor="device_risk",
                score=features.device_risk_score,
                description="Suspicious device fingerprint detected",
                weight=0.15
            ))
        
        # Email risk
        if hasattr(features, 'email_risk_score') and features.email_risk_score > 50:
            risk_factors.append(RiskFactor(
                factor="email_risk",
                score=features.email_risk_score,
                description="High-risk email domain or pattern",
                weight=0.1
            ))
        
        return risk_factors
    
    def _get_recommended_actions(
        self, 
        decision: DecisionType, 
        risk_level: RiskLevel, 
        risk_factors: List[RiskFactor]
    ) -> List[str]:
        """Get recommended actions based on assessment results."""
        actions = []
        
        if decision == DecisionType.DECLINE:
            actions.extend([
                "Decline transaction immediately",
                "Add customer to watchlist",
                "Review for potential fraud ring activity"
            ])
        elif decision == DecisionType.REVIEW:
            actions.extend([
                "Hold for manual review",
                "Contact customer for verification",
                "Request additional authentication"
            ])
        elif decision == DecisionType.MONITOR:
            actions.extend([
                "Allow transaction but monitor closely",
                "Flag for next transaction review",
                "Track behavioral patterns"
            ])
        else:  # APPROVE
            actions.append("Approve transaction")
        
        # Add specific actions based on risk factors
        for factor in risk_factors[:3]:  # Top 3 risk factors
            if factor.factor == "behavioral_anomaly":
                actions.append("Verify customer identity through additional channels")
            elif factor.factor.startswith("ml_model"):
                actions.append(f"Review model prediction details for {factor.factor}")
            elif factor.factor == "geographic_risk":
                actions.append("Verify billing/shipping address accuracy")
            elif factor.factor == "device_risk":
                actions.append("Request device verification or two-factor authentication")
        
        return list(set(actions))  # Remove duplicates
    
    def _generate_assessment_id(self, transaction_data: TransactionData) -> str:
        """Generate unique assessment ID."""
        content = f"{transaction_data.transaction_id}_{transaction_data.timestamp}_{time.time()}"
        return hashlib.md5(content.encode()).hexdigest()[:16]
    
    async def _check_cache(self, transaction_data: TransactionData) -> Optional[FraudAssessmentResult]:
        """Check cache for recent assessment of similar transaction."""
        cache_key = self._get_cache_key(transaction_data)
        cached_data = await self.cache_service.get(cache_key)
        
        if cached_data:
            try:
                return FraudAssessmentResult.parse_raw(cached_data)
            except Exception as e:
                logger.warning("Failed to parse cached assessment", error=str(e))
        
        return None
    
    async def _cache_result(self, transaction_data: TransactionData, result: FraudAssessmentResult):
        """Cache assessment result for potential reuse."""
        cache_key = self._get_cache_key(transaction_data)
        cache_ttl = self.settings.FEATURE_CACHE_TTL
        
        try:
            await self.cache_service.set(
                cache_key, 
                result.json(), 
                expire_seconds=cache_ttl
            )
        except Exception as e:
            logger.warning("Failed to cache assessment result", error=str(e))
    
    def _get_cache_key(self, transaction_data: TransactionData) -> str:
        """Generate cache key for transaction assessment."""
        # Use customer ID and normalized amount for cache key
        normalized_amount = int(transaction_data.amount / 10) * 10  # Round to nearest 10
        return f"fraud_assessment:{transaction_data.customer_id}:{normalized_amount}"
    
    async def _warmup_caches(self):
        """Warm up caches with frequently used data."""
        try:
            logger.info("Warming up caches")
            # Warmup feature engineering caches
            await self.feature_engineer.warmup_cache()
            # Warmup behavioral analysis caches
            await self.behavioral_analyzer.warmup_cache()
            logger.info("Cache warmup completed")
        except Exception as e:
            logger.warning("Cache warmup failed", error=str(e))
    
    def _update_metrics(self, processing_time: float, decision: DecisionType, risk_level: RiskLevel):
        """Update performance metrics."""
        self.assessment_count += 1
        self.total_processing_time += processing_time
        
        # Log metrics periodically
        if self.assessment_count % 100 == 0:
            avg_processing_time = self.total_processing_time / self.assessment_count
            logger.info(
                "Fraud detection metrics",
                total_assessments=self.assessment_count,
                avg_processing_time_ms=int(avg_processing_time * 1000)
            )
    
    async def get_performance_metrics(self) -> Dict[str, Any]:
        """Get engine performance metrics."""
        avg_processing_time = (
            self.total_processing_time / self.assessment_count 
            if self.assessment_count > 0 else 0
        )
        
        return {
            "total_assessments": self.assessment_count,
            "average_processing_time_ms": int(avg_processing_time * 1000),
            "is_initialized": self.is_initialized,
            "ml_client_healthy": await self.ml_client.health_check() if self.ml_client else False
        }
    
    async def cleanup(self):
        """Cleanup resources."""
        try:
            if self.ml_client:
                await self.ml_client.close()
            await self.cache_service.close()
            logger.info("Fraud detection engine cleanup completed")
        except Exception as e:
            logger.error("Error during cleanup", error=str(e))