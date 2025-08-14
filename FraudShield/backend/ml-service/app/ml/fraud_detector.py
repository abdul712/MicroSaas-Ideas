"""
FraudShield Fraud Detection Engine
Advanced ML-powered fraud detection with ensemble models and behavioral analytics
"""

import asyncio
import logging
import time
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
from dataclasses import dataclass, asdict

import structlog
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

from app.ml.model_manager import ModelManager
from app.ml.feature_store import FeatureStore
from app.ml.behavioral_analyzer import BehavioralAnalyzer
from app.ml.risk_calibrator import RiskCalibrator
from app.core.config import get_settings
from app import RISK_LEVELS, DECISION_THRESHOLDS, ENSEMBLE_WEIGHTS

logger = structlog.get_logger(__name__)
settings = get_settings()


@dataclass
class FraudAssessmentResult:
    """Structured result from fraud assessment."""
    transaction_id: str
    risk_score: float
    fraud_probability: float
    decision: str
    risk_level: str
    behavioral_score: float
    anomaly_score: float
    risk_factors: List[str]
    model_scores: Dict[str, float]
    feature_importance: Dict[str, float]
    recommended_action: str
    confidence_score: float
    processing_time_ms: float
    timestamp: datetime
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        result = asdict(self)
        result['timestamp'] = self.timestamp.isoformat()
        return result


class FraudDetector:
    """
    Advanced fraud detection engine with ensemble ML models, 
    behavioral analytics, and risk calibration.
    """
    
    def __init__(self, model_manager: ModelManager, feature_store: FeatureStore):
        self.model_manager = model_manager
        self.feature_store = feature_store
        self.behavioral_analyzer = BehavioralAnalyzer()
        self.risk_calibrator = RiskCalibrator()
        
        # Anomaly detection models
        self.isolation_forest = IsolationForest(
            contamination=0.1,
            random_state=42,
            n_jobs=-1
        )
        
        # Performance tracking
        self.prediction_count = 0
        self.total_processing_time = 0.0
        self.accuracy_history = []
        
        # Feature scaler for normalization
        self.scaler = StandardScaler()
        self.scaler_fitted = False
        
        logger.info("Fraud detector initialized")
    
    async def initialize(self):
        """Initialize the fraud detection engine."""
        try:
            # Initialize behavioral analyzer
            await self.behavioral_analyzer.initialize()
            
            # Initialize risk calibrator
            await self.risk_calibrator.initialize()
            
            # Load any pre-trained anomaly detection models
            await self._load_anomaly_models()
            
            logger.info("Fraud detector initialization completed")
            
        except Exception as e:
            logger.error("Failed to initialize fraud detector", error=str(e))
            raise
    
    async def assess_fraud_risk(self, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Comprehensive fraud risk assessment using ensemble models and behavioral analytics.
        
        Args:
            transaction_data: Transaction data for analysis
            
        Returns:
            Comprehensive fraud assessment result
        """
        start_time = time.time()
        transaction_id = transaction_data.get('transaction_id', f'txn_{int(time.time())}')
        
        try:
            logger.info("Starting fraud assessment", transaction_id=transaction_id)
            
            # Step 1: Extract and engineer features
            features = await self._extract_comprehensive_features(transaction_data)
            
            # Step 2: Behavioral analysis
            behavioral_result = await self._analyze_behavioral_patterns(
                transaction_data, features
            )
            
            # Step 3: Run ensemble ML models
            ml_predictions = await self._run_ensemble_models(features)
            
            # Step 4: Anomaly detection
            anomaly_score = await self._detect_anomalies(features)
            
            # Step 5: Risk calibration and scoring
            risk_assessment = await self._calibrate_risk_score(
                ml_predictions, behavioral_result, anomaly_score, transaction_data
            )
            
            # Step 6: Generate final decision
            decision_result = self._generate_decision(risk_assessment)
            
            # Step 7: Explain the decision
            explanation = await self._explain_decision(
                features, ml_predictions, behavioral_result, anomaly_score
            )
            
            # Calculate processing time
            processing_time_ms = (time.time() - start_time) * 1000
            
            # Create comprehensive result
            result = FraudAssessmentResult(
                transaction_id=transaction_id,
                risk_score=risk_assessment['final_score'],
                fraud_probability=ml_predictions['ensemble_probability'],
                decision=decision_result['decision'],
                risk_level=decision_result['risk_level'],
                behavioral_score=behavioral_result['composite_score'],
                anomaly_score=anomaly_score,
                risk_factors=explanation['primary_risk_factors'],
                model_scores=ml_predictions['individual_scores'],
                feature_importance=explanation['feature_importance'],
                recommended_action=decision_result['recommended_action'],
                confidence_score=risk_assessment['confidence'],
                processing_time_ms=processing_time_ms,
                timestamp=datetime.utcnow()
            )
            
            # Update performance metrics
            self._update_performance_metrics(processing_time_ms)
            
            # Log successful assessment
            logger.info(
                "Fraud assessment completed",
                transaction_id=transaction_id,
                risk_score=result.risk_score,
                decision=result.decision,
                processing_time_ms=processing_time_ms
            )
            
            return result.to_dict()
            
        except Exception as e:
            processing_time_ms = (time.time() - start_time) * 1000
            logger.error(
                "Fraud assessment failed",
                transaction_id=transaction_id,
                error=str(e),
                processing_time_ms=processing_time_ms
            )
            raise
    
    async def _extract_comprehensive_features(self, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract comprehensive features for fraud detection."""
        try:
            # Use feature store for feature extraction
            features = await self.feature_store.extract_features(transaction_data)
            
            # Add derived features
            features.update(self._calculate_derived_features(features, transaction_data))
            
            return features
            
        except Exception as e:
            logger.error("Feature extraction failed", error=str(e))
            raise
    
    def _calculate_derived_features(self, base_features: Dict[str, Any], transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate derived features from base features."""
        derived = {}
        
        try:
            # Amount-based features
            amount = transaction_data.get('amount', 0)
            derived['amount_log'] = np.log1p(amount)
            derived['amount_zscore'] = (amount - 100) / 50  # Simplified normalization
            
            # Time-based features
            timestamp = transaction_data.get('timestamp', time.time())
            dt = datetime.fromtimestamp(timestamp)
            derived['is_weekend'] = 1 if dt.weekday() >= 5 else 0
            derived['is_night'] = 1 if dt.hour < 6 or dt.hour > 22 else 0
            
            # Geographic features
            billing_country = transaction_data.get('billing_address', {}).get('country', 'US')
            shipping_country = transaction_data.get('shipping_address', {}).get('country', 'US')
            derived['address_country_mismatch'] = 1 if billing_country != shipping_country else 0
            
            # Payment method risk
            payment_method = transaction_data.get('payment', {}).get('method', 'credit_card')
            derived['payment_risk_score'] = self._get_payment_method_risk(payment_method)
            
        except Exception as e:
            logger.warning("Failed to calculate some derived features", error=str(e))
        
        return derived
    
    def _get_payment_method_risk(self, payment_method: str) -> float:
        """Get risk score for payment method."""
        risk_scores = {
            'credit_card': 0.3,
            'debit_card': 0.2,
            'paypal': 0.4,
            'bank_transfer': 0.1,
            'cryptocurrency': 0.8,
            'gift_card': 0.9,
            'prepaid_card': 0.7
        }
        return risk_scores.get(payment_method.lower(), 0.5)
    
    async def _analyze_behavioral_patterns(self, transaction_data: Dict[str, Any], features: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze behavioral patterns for anomaly detection."""
        try:
            customer_id = transaction_data.get('customer', {}).get('id')
            if not customer_id:
                # Return default behavior analysis for new customers
                return {
                    'composite_score': 50.0,
                    'velocity_score': 50.0,
                    'pattern_score': 50.0,
                    'anomaly_indicators': [],
                    'is_new_customer': True
                }
            
            # Analyze behavioral patterns
            result = await self.behavioral_analyzer.analyze_customer_behavior(
                customer_id, transaction_data, features
            )
            
            return result
            
        except Exception as e:
            logger.warning("Behavioral analysis failed", error=str(e))
            # Return safe default
            return {
                'composite_score': 50.0,
                'velocity_score': 50.0,
                'pattern_score': 50.0,
                'anomaly_indicators': ['analysis_failed'],
                'is_new_customer': False
            }
    
    async def _run_ensemble_models(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Run ensemble ML models for fraud prediction."""
        try:
            # Convert features to array format
            feature_array = self._prepare_feature_array(features)
            
            # Get predictions from all models
            model_predictions = {}
            model_probabilities = {}
            
            # Random Forest
            if await self.model_manager.is_model_available('random_forest'):
                rf_pred = await self.model_manager.predict('random_forest', feature_array)
                model_predictions['random_forest'] = rf_pred['prediction']
                model_probabilities['random_forest'] = rf_pred['probability']
            
            # XGBoost
            if await self.model_manager.is_model_available('xgboost'):
                xgb_pred = await self.model_manager.predict('xgboost', feature_array)
                model_predictions['xgboost'] = xgb_pred['prediction']
                model_probabilities['xgboost'] = xgb_pred['probability']
            
            # Neural Network
            if await self.model_manager.is_model_available('neural_network'):
                nn_pred = await self.model_manager.predict('neural_network', feature_array)
                model_predictions['neural_network'] = nn_pred['prediction']
                model_probabilities['neural_network'] = nn_pred['probability']
            
            # Calculate ensemble prediction
            ensemble_probability = self._calculate_ensemble_probability(model_probabilities)
            ensemble_prediction = 1 if ensemble_probability > 0.5 else 0
            
            return {
                'individual_predictions': model_predictions,
                'individual_scores': model_probabilities,
                'ensemble_prediction': ensemble_prediction,
                'ensemble_probability': ensemble_probability
            }
            
        except Exception as e:
            logger.error("Ensemble model prediction failed", error=str(e))
            # Return safe default predictions
            return {
                'individual_predictions': {},
                'individual_scores': {},
                'ensemble_prediction': 0,
                'ensemble_probability': 0.1
            }
    
    def _prepare_feature_array(self, features: Dict[str, Any]) -> np.ndarray:
        """Prepare feature array for model input."""
        # Define expected feature order (this should match training data)
        expected_features = [
            'amount', 'hour_of_day', 'day_of_week', 'payment_risk_score',
            'address_country_mismatch', 'is_weekend', 'is_night',
            'amount_log', 'amount_zscore'
        ]
        
        # Extract features in correct order
        feature_values = []
        for feature_name in expected_features:
            value = features.get(feature_name, 0.0)
            # Handle non-numeric values
            if isinstance(value, str):
                value = hash(value) % 1000 / 1000.0  # Simple hash for categorical
            feature_values.append(float(value))
        
        return np.array(feature_values).reshape(1, -1)
    
    def _calculate_ensemble_probability(self, model_probabilities: Dict[str, float]) -> float:
        """Calculate weighted ensemble probability."""
        if not model_probabilities:
            return 0.1  # Safe default
        
        weighted_sum = 0.0
        total_weight = 0.0
        
        for model_name, probability in model_probabilities.items():
            weight = ENSEMBLE_WEIGHTS.get(model_name, 0.25)  # Default weight
            weighted_sum += weight * probability
            total_weight += weight
        
        if total_weight == 0:
            return np.mean(list(model_probabilities.values()))
        
        return weighted_sum / total_weight
    
    async def _detect_anomalies(self, features: Dict[str, Any]) -> float:
        """Detect anomalies using unsupervised methods."""
        try:
            feature_array = self._prepare_feature_array(features)
            
            # Use isolation forest for anomaly detection
            anomaly_prediction = self.isolation_forest.predict(feature_array)[0]
            anomaly_score_raw = self.isolation_forest.decision_function(feature_array)[0]
            
            # Convert to 0-100 scale (higher = more anomalous)
            # Isolation forest returns negative scores for anomalies
            anomaly_score = max(0, min(100, (0.5 - anomaly_score_raw) * 100))
            
            return anomaly_score
            
        except Exception as e:
            logger.warning("Anomaly detection failed", error=str(e))
            return 25.0  # Safe default
    
    async def _calibrate_risk_score(self, ml_predictions: Dict[str, Any], 
                                  behavioral_result: Dict[str, Any], 
                                  anomaly_score: float,
                                  transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """Calibrate final risk score using risk calibrator."""
        try:
            return await self.risk_calibrator.calibrate_risk(
                ml_probability=ml_predictions['ensemble_probability'],
                behavioral_score=behavioral_result['composite_score'],
                anomaly_score=anomaly_score,
                transaction_context=transaction_data
            )
        except Exception as e:
            logger.warning("Risk calibration failed", error=str(e))
            # Fallback calculation
            raw_score = (
                ml_predictions['ensemble_probability'] * 40 +
                behavioral_result['composite_score'] * 0.4 +
                anomaly_score * 0.2
            )
            return {
                'final_score': min(100, max(0, raw_score)),
                'confidence': 0.7,
                'calibration_factors': ['fallback_calculation']
            }
    
    def _generate_decision(self, risk_assessment: Dict[str, Any]) -> Dict[str, Any]:
        """Generate final decision based on risk score."""
        risk_score = risk_assessment['final_score']
        
        # Determine decision
        if risk_score < DECISION_THRESHOLDS['approve']:
            decision = 'approve'
            recommended_action = 'process_transaction'
        elif risk_score < DECISION_THRESHOLDS['review']:
            decision = 'review'
            recommended_action = 'manual_review'
        else:
            decision = 'decline'
            recommended_action = 'block_transaction'
        
        # Determine risk level
        risk_level = 'low'
        for level, (min_score, max_score) in RISK_LEVELS.items():
            if min_score <= risk_score < max_score:
                risk_level = level
                break
        
        return {
            'decision': decision,
            'risk_level': risk_level,
            'recommended_action': recommended_action
        }
    
    async def _explain_decision(self, features: Dict[str, Any], 
                              ml_predictions: Dict[str, Any],
                              behavioral_result: Dict[str, Any],
                              anomaly_score: float) -> Dict[str, Any]:
        """Generate explanation for the fraud decision."""
        risk_factors = []
        feature_importance = {}
        
        # Analyze ML model contributions
        for model_name, probability in ml_predictions.get('individual_scores', {}).items():
            if probability > 0.7:
                risk_factors.append(f'high_{model_name}_score')
        
        # Analyze behavioral factors
        if behavioral_result['composite_score'] > 70:
            risk_factors.extend(behavioral_result.get('anomaly_indicators', []))
        
        # Analyze anomaly score
        if anomaly_score > 70:
            risk_factors.append('transaction_anomaly')
        
        # Generate feature importance (simplified)
        feature_importance = {
            'transaction_amount': 0.25,
            'behavioral_patterns': 0.30,
            'geographic_factors': 0.20,
            'temporal_factors': 0.15,
            'payment_method': 0.10
        }
        
        return {
            'primary_risk_factors': risk_factors[:5],  # Top 5 factors
            'feature_importance': feature_importance,
            'explanation_confidence': 0.85
        }
    
    async def _load_anomaly_models(self):
        """Load pre-trained anomaly detection models."""
        try:
            # In a real implementation, you would load pre-trained models
            # For now, we'll use a basic isolation forest
            logger.info("Anomaly detection models initialized")
        except Exception as e:
            logger.error("Failed to load anomaly models", error=str(e))
    
    def _update_performance_metrics(self, processing_time_ms: float):
        """Update performance tracking metrics."""
        self.prediction_count += 1
        self.total_processing_time += processing_time_ms
        
        # Log performance every 100 predictions
        if self.prediction_count % 100 == 0:
            avg_time = self.total_processing_time / self.prediction_count
            logger.info(
                "Fraud detector performance update",
                total_predictions=self.prediction_count,
                average_processing_time_ms=avg_time
            )
    
    async def cleanup(self):
        """Cleanup resources."""
        try:
            if hasattr(self, 'behavioral_analyzer'):
                await self.behavioral_analyzer.cleanup()
            
            if hasattr(self, 'risk_calibrator'):
                await self.risk_calibrator.cleanup()
                
            logger.info("Fraud detector cleanup completed")
        except Exception as e:
            logger.error("Error during fraud detector cleanup", error=str(e))
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get current performance statistics."""
        avg_time = (self.total_processing_time / self.prediction_count 
                   if self.prediction_count > 0 else 0)
        
        return {
            'total_predictions': self.prediction_count,
            'average_processing_time_ms': avg_time,
            'target_processing_time_ms': 100,  # Target < 100ms
            'performance_status': 'good' if avg_time < 100 else 'degraded'
        }