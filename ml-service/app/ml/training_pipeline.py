"""
ML Training Pipeline
Automatically retrains models based on feedback data
"""
import schedule
import time
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import logging

from app.core.config import settings
from app.utils.logger import get_logger

# Try to import models
try:
    from app.ml.task_assignment import TaskAssignmentModel
    TASK_ASSIGNMENT_AVAILABLE = True
except ImportError:
    TASK_ASSIGNMENT_AVAILABLE = False
    TaskAssignmentModel = None

try:
    from app.ml.velocity_forecaster import VelocityForecaster
    VELOCITY_FORECASTER_AVAILABLE = True
except ImportError:
    VELOCITY_FORECASTER_AVAILABLE = False
    VelocityForecaster = None

logger = get_logger(__name__)


class MLTrainingPipeline:
    """
    Automatic ML model retraining pipeline.
    Retrains models based on feedback data when sufficient new data is available.
    """

    def __init__(self):
        """Initialize training pipeline."""
        from pymongo import MongoClient

        self.mongo_client = MongoClient(settings.mongodb_uri)
        self.db = self.mongo_client[settings.mongodb_db]
        self.feedback_collection = self.db['mlfeedbacks']
        self.metrics_collection = self.db['modelmetrics']

        # Initialize models
        self.models = {}
        if TASK_ASSIGNMENT_AVAILABLE:
            try:
                self.models['task_assignment'] = TaskAssignmentModel()
            except Exception as e:
                logger.warning(f"Could not initialize TaskAssignmentModel: {e}")

        if VELOCITY_FORECASTER_AVAILABLE:
            try:
                self.models['velocity_forecast'] = VelocityForecaster()
            except Exception as e:
                logger.warning(f"Could not initialize VelocityForecaster: {e}")

        self.min_feedback_for_retrain = 50  # Minimum new feedback to trigger retrain
        self.improvement_threshold = 0.02  # 2% improvement required

    def should_retrain(self, model_type: str) -> bool:
        """
        Check if model should be retrained based on new feedback.

        Args:
            model_type: Type of model to check

        Returns:
            True if model should be retrained
        """
        # Get last training date
        last_training = self.metrics_collection.find_one(
            {'model_type': model_type}, sort=[('trained_at', -1)]
        )

        last_training_date = last_training['trained_at'] if last_training else datetime.min

        # Count new feedback since last training
        new_feedback_count = self.feedback_collection.count_documents({
            'modelType': model_type,
            'createdAt': {'$gt': last_training_date},
        })

        logger.info(f"{model_type}: {new_feedback_count} new feedback samples")

        return new_feedback_count >= self.min_feedback_for_retrain

    def fetch_training_data(self, model_type: str, days_back: int = 90) -> List[Dict]:
        """
        Fetch feedback data for training.

        Args:
            model_type: Type of model
            days_back: How many days back to fetch data

        Returns:
            List of feedback documents
        """
        cutoff_date = datetime.now() - timedelta(days=days_back)

        feedback_data = list(
            self.feedback_collection.find(
                {
                    'modelType': model_type,
                    'createdAt': {'$gte': cutoff_date},
                    'actualOutcome': {'$exists': True},
                }
            )
        )

        logger.info(f"Fetched {len(feedback_data)} samples for {model_type}")

        return feedback_data

    def prepare_training_data(
        self, feedback_data: List[Dict], model_type: str
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Convert feedback to training format.

        Args:
            feedback_data: List of feedback documents
            model_type: Type of model

        Returns:
            Tuple of (X, y) training data
        """
        if model_type == 'task_assignment':
            return self._prepare_task_assignment_data(feedback_data)
        elif model_type == 'velocity_forecast':
            return self._prepare_velocity_data(feedback_data)
        else:
            logger.warning(f"No data preparation method for {model_type}")
            return np.array([]), np.array([])

    def _prepare_task_assignment_data(
        self, feedback_data: List[Dict]
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Prepare task assignment training data.

        Args:
            feedback_data: List of feedback documents

        Returns:
            Tuple of (X, y) training data
        """
        X = []
        y = []

        for feedback in feedback_data:
            try:
                prediction = feedback.get('prediction', {})
                context = feedback.get('context', {})

                # Extract features from prediction
                features = [
                    prediction.get('taskComplexity', 0),
                    len(prediction.get('requiredSkills', [])),
                    context.get('userCapacity', 0),
                    context.get('userWorkload', 0),
                    feedback.get('accuracy', 0),
                ]

                # Label: 1 if assignment was successful, 0 otherwise
                label = 1 if feedback.get('accuracy', 0) > 0.8 else 0

                X.append(features)
                y.append(label)
            except Exception as e:
                logger.warning(f"Error preparing task assignment sample: {e}")
                continue

        return np.array(X), np.array(y)

    def _prepare_velocity_data(
        self, feedback_data: List[Dict]
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Prepare velocity forecasting training data.

        Args:
            feedback_data: List of feedback documents

        Returns:
            Tuple of (X, y) training data
        """
        X = []
        y = []

        for feedback in feedback_data:
            try:
                prediction = feedback.get('prediction', {})
                actual_outcome = feedback.get('actualOutcome', {})

                # Features: historical velocities or prediction features
                features = prediction.get('historicalVelocities', [])
                if not features:
                    # Fallback: use prediction values as features
                    features = [
                        prediction.get('velocity', 0),
                        prediction.get('completion', 0),
                    ]

                # Label: actual velocity
                label = actual_outcome.get('velocity', 0)

                if len(features) > 0 and label > 0:
                    # Pad or truncate to fixed length
                    if len(features) < 5:
                        features = features + [0] * (5 - len(features))
                    else:
                        features = features[:5]

                    X.append(features)
                    y.append(label)
            except Exception as e:
                logger.warning(f"Error preparing velocity sample: {e}")
                continue

        return np.array(X), np.array(y)

    def retrain_model(self, model_type: str) -> bool:
        """
        Retrain a specific model.

        Args:
            model_type: Type of model to retrain

        Returns:
            True if model was successfully retrained and deployed
        """
        logger.info(f"Starting retraining for {model_type}")

        try:
            if model_type not in self.models:
                logger.warning(f"Model {model_type} not available")
                return False

            # Fetch training data
            feedback_data = self.fetch_training_data(model_type)

            if len(feedback_data) < self.min_feedback_for_retrain:
                logger.warning(
                    f"Insufficient data for {model_type}: {len(feedback_data)} samples"
                )
                return False

            # Prepare data
            X, y = self.prepare_training_data(feedback_data, model_type)

            if len(X) == 0:
                logger.warning(f"No valid training samples for {model_type}")
                return False

            # Split data
            X_train, X_val, y_train, y_val = train_test_split(
                X, y, test_size=0.2, random_state=42
            )

            # Get current model
            model = self.models[model_type]

            # Save old model for comparison (if model has save method)
            old_model_path = f"models/{model_type}_old.pkl"
            try:
                if hasattr(model, 'save'):
                    model.save(old_model_path)
            except Exception as e:
                logger.warning(f"Could not save old model: {e}")

            # Train new model (if model has train method)
            logger.info(f"Training {model_type} with {len(X_train)} samples")
            try:
                if hasattr(model, 'train'):
                    model.train(X_train, y_train)
                elif hasattr(model, 'fit'):
                    model.fit(X_train, y_train)
                else:
                    logger.warning(f"Model {model_type} does not have train/fit method")
                    return False
            except Exception as e:
                logger.error(f"Error training model: {e}")
                return False

            # Evaluate new model
            try:
                if hasattr(model, 'predict'):
                    y_pred = model.predict(X_val)
                else:
                    logger.warning(f"Model {model_type} does not have predict method")
                    return False

                # Handle different prediction formats
                if isinstance(y_pred, (list, np.ndarray)) and len(y_pred) > 0:
                    # For classification tasks
                    if model_type == 'task_assignment':
                        new_accuracy = accuracy_score(y_val, y_pred)
                        new_precision = precision_score(
                            y_val, y_pred, average='weighted', zero_division=0
                        )
                        new_recall = recall_score(
                            y_val, y_pred, average='weighted', zero_division=0
                        )
                        new_f1 = f1_score(y_val, y_pred, average='weighted', zero_division=0)
                    else:
                        # For regression tasks (velocity)
                        errors = np.abs(y_val - y_pred)
                        new_accuracy = 1 - (np.mean(errors) / (np.mean(y_val) + 1e-6))
                        new_accuracy = max(0, min(1, new_accuracy))
                        new_precision = new_accuracy
                        new_recall = new_accuracy
                        new_f1 = new_accuracy
                else:
                    logger.warning(f"Invalid predictions from model {model_type}")
                    return False
            except Exception as e:
                logger.error(f"Error evaluating model: {e}")
                return False

            logger.info(f"New model accuracy: {new_accuracy:.4f}")

            # Get old model metrics
            old_metrics = self.metrics_collection.find_one(
                {'model_type': model_type}, sort=[('trained_at', -1)]
            )

            old_accuracy = old_metrics['accuracy'] if old_metrics else 0

            # Compare performance
            improvement = new_accuracy - old_accuracy

            if improvement >= self.improvement_threshold or old_accuracy == 0:
                # New model is better, deploy it
                new_version = (old_metrics.get('version', 0) + 1) if old_metrics else 1
                model_path = f"models/{model_type}_v{new_version}.pkl"

                # Save model (if it has save method)
                try:
                    if hasattr(model, 'save'):
                        model.save(model_path)
                    else:
                        # Fallback: use joblib
                        joblib.dump(model, model_path)
                except Exception as e:
                    logger.warning(f"Could not save model: {e}")
                    # Continue anyway

                # Save metrics
                self.metrics_collection.insert_one({
                    'model_type': model_type,
                    'version': new_version,
                    'accuracy': float(new_accuracy),
                    'precision': float(new_precision),
                    'recall': float(new_recall),
                    'f1_score': float(new_f1),
                    'training_samples': len(X_train),
                    'validation_samples': len(X_val),
                    'improvement': float(improvement),
                    'trained_at': datetime.now(),
                    'model_path': model_path,
                    'is_active': True,
                })

                # Mark old metrics as inactive
                if old_metrics:
                    self.metrics_collection.update_many(
                        {'model_type': model_type, 'version': {'$ne': new_version}},
                        {'$set': {'is_active': False}},
                    )

                logger.info(f"✓ Model deployed: {model_type} v{new_version}")
                improvement_pct = (
                    (improvement / old_accuracy * 100) if old_accuracy > 0 else 0
                )
                logger.info(f"  Improvement: {improvement:.4f} ({improvement_pct:.1f}%)")

                return True
            else:
                # New model not better, keep old one
                logger.info(
                    f"✗ Model not improved: {improvement:.4f} < {self.improvement_threshold}"
                )
                logger.info(f"  Keeping old model (accuracy: {old_accuracy:.4f})")

                # Reload old model (if it has load method)
                try:
                    if hasattr(model, 'load'):
                        model.load(old_model_path)
                except Exception as e:
                    logger.warning(f"Could not reload old model: {e}")

                return False

        except Exception as e:
            logger.error(f"Error retraining {model_type}: {e}", exc_info=True)
            return False

    def retrain_all_models(self):
        """
        Check and retrain all models if needed.
        """
        logger.info("=== Starting scheduled model retraining ===")

        for model_type in self.models.keys():
            if self.should_retrain(model_type):
                logger.info(f"Retraining {model_type}...")
                self.retrain_model(model_type)
            else:
                logger.info(f"Skipping {model_type} (insufficient new data)")

        logger.info("=== Retraining complete ===\n")

    def start_scheduler(self):
        """
        Start automatic retraining schedule.
        """
        logger.info("Starting ML training scheduler")

        # Schedule retraining (weekly on Monday at 2 AM)
        schedule.every().monday.at("02:00").do(self.retrain_all_models)
        # Uncomment for daily retraining:
        # schedule.every().day.at("03:00").do(self.retrain_all_models)

        while True:
            schedule.run_pending()
            time.sleep(60)  # Check every minute


# Create global instance
training_pipeline = MLTrainingPipeline()
