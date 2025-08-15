"""
FraudShield Ensemble ML Models
Advanced ensemble classifier combining multiple ML models for fraud detection.
"""

import asyncio
import time
import pickle
from typing import Dict, List, Optional, Any, Tuple
from pathlib import Path
import json

import numpy as np
import pandas as pd
import structlog
from sklearn.ensemble import RandomForestClassifier, IsolationForest, VotingClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.model_selection import cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import xgboost as xgb
import joblib

from ml_service.core.config import get_settings

logger = structlog.get_logger(__name__)

class EnsembleClassifier:
    """
    Advanced ensemble classifier that combines multiple ML models for fraud detection.
    Includes Random Forest, XGBoost, Neural Networks, and Isolation Forest.
    """
    
    def __init__(self, model_manager=None):
        self.settings = get_settings()
        self.model_manager = model_manager
        self.is_ready = False
        
        # Individual models
        self.models = {}
        self.scalers = {}
        self.model_weights = self.settings.ENSEMBLE_WEIGHTS
        
        # Performance tracking
        self.prediction_count = 0
        self.total_inference_time = 0.0
        
        # Model metadata
        self.model_versions = {}
        self.training_metadata = {}
        
    async def initialize(self):
        """Initialize ensemble classifier with pre-trained models."""
        try:
            logger.info("Initializing ensemble classifier")
            
            # Initialize individual models
            await self._initialize_models()
            
            # Load pre-trained models if available
            await self._load_models()
            
            # Validate models
            await self._validate_models()
            
            self.is_ready = True
            logger.info("Ensemble classifier initialized successfully")
            
        except Exception as e:
            logger.error("Failed to initialize ensemble classifier", error=str(e))
            raise
    
    async def _initialize_models(self):
        """Initialize individual ML models with optimized parameters."""
        
        # Random Forest Classifier
        self.models['random_forest'] = RandomForestClassifier(
            n_estimators=100,
            max_depth=20,
            min_samples_split=10,
            min_samples_leaf=5,
            max_features='sqrt',
            random_state=42,
            n_jobs=-1,
            class_weight='balanced'
        )
        
        # XGBoost Classifier
        self.models['xgboost'] = xgb.XGBClassifier(
            n_estimators=100,
            max_depth=8,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            eval_metric='logloss',
            use_label_encoder=False,
            scale_pos_weight=1  # Will be adjusted based on class imbalance
        )
        
        # Neural Network Classifier
        self.models['neural_network'] = MLPClassifier(
            hidden_layer_sizes=(100, 50, 25),
            activation='relu',
            solver='adam',
            alpha=0.001,
            batch_size='auto',
            learning_rate='adaptive',
            max_iter=500,
            random_state=42,
            early_stopping=True,
            validation_fraction=0.1
        )
        
        # Isolation Forest for Anomaly Detection
        self.models['isolation_forest'] = IsolationForest(
            n_estimators=100,
            contamination=0.1,
            random_state=42,
            n_jobs=-1
        )
        
        # Initialize scalers for each model
        for model_name in self.models.keys():
            self.scalers[model_name] = StandardScaler()
        
        logger.info("Individual models initialized", model_count=len(self.models))
    
    async def _load_models(self):
        """Load pre-trained models from storage."""
        try:
            if not self.model_manager:
                logger.warning("No model manager available, using fresh models")
                return
            
            model_paths = await self.model_manager.get_production_model_paths()
            
            for model_name, model_path in model_paths.items():
                if model_name in self.models:
                    try:
                        # Load model
                        loaded_model = joblib.load(model_path)
                        self.models[model_name] = loaded_model
                        
                        # Load scaler
                        scaler_path = model_path.replace('.pkl', '_scaler.pkl')
                        if Path(scaler_path).exists():
                            self.scalers[model_name] = joblib.load(scaler_path)
                        
                        # Load metadata
                        metadata_path = model_path.replace('.pkl', '_metadata.json')
                        if Path(metadata_path).exists():
                            with open(metadata_path, 'r') as f:
                                self.training_metadata[model_name] = json.load(f)
                        
                        logger.info(f"Loaded pre-trained model: {model_name}")
                        
                    except Exception as e:
                        logger.warning(f"Failed to load model {model_name}", error=str(e))
            
            logger.info("Model loading completed", loaded_models=list(self.models.keys()))
            
        except Exception as e:
            logger.error("Failed to load models", error=str(e))
    
    async def _validate_models(self):
        """Validate that models are properly initialized and functional."""
        try:
            # Create dummy data for validation
            dummy_features = np.random.random((10, 50)).astype(np.float32)
            
            for model_name, model in self.models.items():
                try:
                    if model_name == 'isolation_forest':
                        # Isolation Forest uses different interface
                        _ = model.decision_function(dummy_features)
                    else:
                        _ = model.predict_proba(dummy_features)
                    logger.debug(f"Model validation passed: {model_name}")
                except Exception as e:
                    logger.warning(f"Model validation failed: {model_name}", error=str(e))
            
            logger.info("Model validation completed")
            
        except Exception as e:
            logger.error("Model validation failed", error=str(e))
    
    async def predict(self, features: np.ndarray) -> Dict[str, Any]:
        """
        Make fraud prediction using ensemble of models.
        
        Args:
            features: Input feature vector
            
        Returns:
            Dictionary with ensemble prediction results
        """
        if not self.is_ready:
            raise RuntimeError("Ensemble classifier not ready")
        
        start_time = time.time()
        
        try:
            # Ensure features are in correct format
            if features.ndim == 1:
                features = features.reshape(1, -1)
            
            # Get predictions from individual models
            individual_predictions = {}
            model_confidences = {}
            
            for model_name, model in self.models.items():
                try:
                    model_start = time.time()
                    
                    # Scale features for this model
                    scaled_features = self.scalers[model_name].transform(features)
                    
                    if model_name == 'isolation_forest':
                        # Isolation Forest returns anomaly score
                        anomaly_score = model.decision_function(scaled_features)[0]
                        # Convert to probability (higher anomaly score = lower fraud prob)
                        fraud_prob = max(0, min(1, (1 - anomaly_score) / 2))
                        confidence = abs(anomaly_score)
                    else:
                        # Get fraud probability (class 1)
                        probabilities = model.predict_proba(scaled_features)[0]
                        fraud_prob = probabilities[1] if len(probabilities) > 1 else probabilities[0]
                        confidence = max(probabilities) - min(probabilities)
                    
                    individual_predictions[model_name] = fraud_prob
                    model_confidences[model_name] = confidence
                    
                    model_time = time.time() - model_start
                    logger.debug(f"Model {model_name} prediction", 
                               probability=fraud_prob, 
                               confidence=confidence,
                               time_ms=int(model_time * 1000))
                    
                except Exception as e:
                    logger.error(f"Model {model_name} prediction failed", error=str(e))
                    individual_predictions[model_name] = 0.5  # Default neutral prediction
                    model_confidences[model_name] = 0.1
            
            # Calculate ensemble prediction using weighted average
            ensemble_probability = self._calculate_ensemble_prediction(individual_predictions)
            
            # Calculate overall confidence
            ensemble_confidence = self._calculate_ensemble_confidence(
                individual_predictions, model_confidences
            )
            
            # Get feature importance (from Random Forest if available)
            feature_importance = await self._get_feature_importance(features)
            
            # Update metrics
            processing_time = time.time() - start_time
            self._update_metrics(processing_time)
            
            result = {
                "probability": ensemble_probability,
                "confidence": ensemble_confidence,
                "individual_predictions": individual_predictions,
                "model_confidences": model_confidences,
                "feature_importance": feature_importance,
                "model_version": "2.1.0",
                "ensemble_weights": self.model_weights,
                "processing_time_ms": int(processing_time * 1000),
                "models_used": list(individual_predictions.keys())
            }
            
            logger.debug("Ensemble prediction completed",
                        probability=ensemble_probability,
                        confidence=ensemble_confidence,
                        processing_time_ms=int(processing_time * 1000))
            
            return result
            
        except Exception as e:
            processing_time = time.time() - start_time
            logger.error("Ensemble prediction failed", 
                        error=str(e),
                        processing_time_ms=int(processing_time * 1000))
            raise
    
    def _calculate_ensemble_prediction(self, individual_predictions: Dict[str, float]) -> float:
        """Calculate weighted ensemble prediction."""
        weighted_sum = 0.0
        total_weight = 0.0
        
        for model_name, prediction in individual_predictions.items():
            weight = self.model_weights.get(model_name, 0.1)
            weighted_sum += prediction * weight
            total_weight += weight
        
        # Normalize if weights don't sum to 1
        if total_weight > 0:
            ensemble_prediction = weighted_sum / total_weight
        else:
            ensemble_prediction = sum(individual_predictions.values()) / len(individual_predictions)
        
        return max(0.0, min(1.0, ensemble_prediction))
    
    def _calculate_ensemble_confidence(
        self, 
        individual_predictions: Dict[str, float], 
        model_confidences: Dict[str, float]
    ) -> float:
        """Calculate overall ensemble confidence."""
        # Use weighted average of individual confidences
        weighted_confidence = 0.0
        total_weight = 0.0
        
        for model_name in individual_predictions.keys():
            weight = self.model_weights.get(model_name, 0.1)
            confidence = model_confidences.get(model_name, 0.1)
            weighted_confidence += confidence * weight
            total_weight += weight
        
        if total_weight > 0:
            ensemble_confidence = weighted_confidence / total_weight
        else:
            ensemble_confidence = sum(model_confidences.values()) / len(model_confidences)
        
        # Also consider agreement between models
        predictions = list(individual_predictions.values())
        prediction_std = np.std(predictions)
        agreement_factor = max(0.1, 1.0 - prediction_std)
        
        return max(0.1, min(1.0, ensemble_confidence * agreement_factor))
    
    async def _get_feature_importance(self, features: np.ndarray) -> Dict[str, float]:
        """Get feature importance from Random Forest model."""
        try:
            if 'random_forest' in self.models:
                rf_model = self.models['random_forest']
                if hasattr(rf_model, 'feature_importances_'):
                    importance_scores = rf_model.feature_importances_
                    
                    # Create feature importance dictionary
                    feature_importance = {}
                    for i, importance in enumerate(importance_scores[:10]):  # Top 10 features
                        feature_importance[f"feature_{i}"] = float(importance)
                    
                    return feature_importance
        except Exception as e:
            logger.warning("Failed to get feature importance", error=str(e))
        
        return {}
    
    async def train_ensemble(
        self, 
        X_train: np.ndarray, 
        y_train: np.ndarray,
        X_val: Optional[np.ndarray] = None,
        y_val: Optional[np.ndarray] = None
    ) -> Dict[str, Any]:
        """
        Train the ensemble of models.
        
        Args:
            X_train: Training features
            y_train: Training labels
            X_val: Validation features (optional)
            y_val: Validation labels (optional)
            
        Returns:
            Training results and model performance metrics
        """
        try:
            logger.info("Starting ensemble training", 
                       training_samples=len(X_train),
                       validation_samples=len(X_val) if X_val is not None else 0)
            
            training_results = {}
            
            for model_name, model in self.models.items():
                logger.info(f"Training model: {model_name}")
                model_start = time.time()
                
                try:
                    # Fit scaler on training data
                    scaler = self.scalers[model_name]
                    X_train_scaled = scaler.fit_transform(X_train)
                    
                    # Train model
                    if model_name == 'isolation_forest':
                        # Isolation Forest is unsupervised
                        model.fit(X_train_scaled)
                    else:
                        model.fit(X_train_scaled, y_train)
                    
                    # Evaluate model
                    performance = await self._evaluate_model(
                        model, scaler, X_train, y_train, X_val, y_val, model_name
                    )
                    
                    training_time = time.time() - model_start
                    training_results[model_name] = {
                        "performance": performance,
                        "training_time_seconds": training_time,
                        "status": "success"
                    }
                    
                    logger.info(f"Model {model_name} training completed",
                              training_time=training_time,
                              accuracy=performance.get("accuracy", "N/A"))
                    
                except Exception as e:
                    logger.error(f"Model {model_name} training failed", error=str(e))
                    training_results[model_name] = {
                        "status": "failed",
                        "error": str(e)
                    }
            
            # Save trained models
            await self._save_models()
            
            # Calculate ensemble performance
            if X_val is not None and y_val is not None:
                ensemble_performance = await self._evaluate_ensemble(X_val, y_val)
                training_results["ensemble"] = ensemble_performance
            
            logger.info("Ensemble training completed", results=training_results)
            return training_results
            
        except Exception as e:
            logger.error("Ensemble training failed", error=str(e))
            raise
    
    async def _evaluate_model(
        self, 
        model, 
        scaler, 
        X_train: np.ndarray, 
        y_train: np.ndarray,
        X_val: Optional[np.ndarray],
        y_val: Optional[np.ndarray],
        model_name: str
    ) -> Dict[str, float]:
        """Evaluate individual model performance."""
        try:
            performance = {}
            
            # Training performance
            if model_name != 'isolation_forest':
                X_train_scaled = scaler.transform(X_train)
                y_train_pred = model.predict(X_train_scaled)
                
                performance["train_accuracy"] = accuracy_score(y_train, y_train_pred)
                performance["train_precision"] = precision_score(y_train, y_train_pred, average='weighted')
                performance["train_recall"] = recall_score(y_train, y_train_pred, average='weighted')
                performance["train_f1"] = f1_score(y_train, y_train_pred, average='weighted')
            
            # Validation performance
            if X_val is not None and y_val is not None and model_name != 'isolation_forest':
                X_val_scaled = scaler.transform(X_val)
                y_val_pred = model.predict(X_val_scaled)
                
                performance["val_accuracy"] = accuracy_score(y_val, y_val_pred)
                performance["val_precision"] = precision_score(y_val, y_val_pred, average='weighted')
                performance["val_recall"] = recall_score(y_val, y_val_pred, average='weighted')
                performance["val_f1"] = f1_score(y_val, y_val_pred, average='weighted')
            
            return performance
            
        except Exception as e:
            logger.error(f"Model evaluation failed for {model_name}", error=str(e))
            return {}
    
    async def _evaluate_ensemble(self, X_val: np.ndarray, y_val: np.ndarray) -> Dict[str, float]:
        """Evaluate ensemble performance."""
        try:
            ensemble_predictions = []
            
            for features in X_val:
                result = await self.predict(features)
                # Convert probability to binary prediction
                prediction = 1 if result["probability"] > 0.5 else 0
                ensemble_predictions.append(prediction)
            
            ensemble_predictions = np.array(ensemble_predictions)
            
            return {
                "accuracy": accuracy_score(y_val, ensemble_predictions),
                "precision": precision_score(y_val, ensemble_predictions, average='weighted'),
                "recall": recall_score(y_val, ensemble_predictions, average='weighted'),
                "f1": f1_score(y_val, ensemble_predictions, average='weighted')
            }
            
        except Exception as e:
            logger.error("Ensemble evaluation failed", error=str(e))
            return {}
    
    async def _save_models(self):
        """Save trained models and scalers."""
        try:
            if not self.model_manager:
                logger.warning("No model manager available, skipping model save")
                return
            
            for model_name, model in self.models.items():
                await self.model_manager.save_model(model_name, model, self.scalers[model_name])
            
            logger.info("Models saved successfully")
            
        except Exception as e:
            logger.error("Failed to save models", error=str(e))
    
    async def reload_models(self):
        """Reload models from storage."""
        try:
            logger.info("Reloading ensemble models")
            await self._load_models()
            await self._validate_models()
            logger.info("Models reloaded successfully")
            
        except Exception as e:
            logger.error("Failed to reload models", error=str(e))
            raise
    
    def _update_metrics(self, processing_time: float):
        """Update performance metrics."""
        self.prediction_count += 1
        self.total_inference_time += processing_time
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """Get ensemble performance metrics."""
        avg_inference_time = (
            self.total_inference_time / self.prediction_count 
            if self.prediction_count > 0 else 0
        )
        
        return {
            "total_predictions": self.prediction_count,
            "average_inference_time_ms": int(avg_inference_time * 1000),
            "is_ready": self.is_ready,
            "models_loaded": list(self.models.keys()),
            "model_weights": self.model_weights
        }
    
    def is_ready(self) -> bool:
        """Check if ensemble is ready for predictions."""
        return self.is_ready and len(self.models) > 0