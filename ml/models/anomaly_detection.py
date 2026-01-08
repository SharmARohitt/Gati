"""
GATI ML Pipeline - Anomaly Detection Module
============================================
Production-grade anomaly detection using Isolation Forest.
Includes multiple algorithms, evaluation, and explainability.

WHY ISOLATION FOREST:
1. Works well with high-dimensional data
2. Handles non-linear relationships
3. No assumption about data distribution
4. Efficient for large datasets
5. Interpretable anomaly scores
"""

import numpy as np
import pandas as pd
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field
from pathlib import Path
import joblib
import json
from loguru import logger

from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor
from sklearn.svm import OneClassSVM
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
import warnings

warnings.filterwarnings('ignore')


@dataclass
class AnomalyResult:
    """Single anomaly detection result."""
    index: int
    date: Optional[str]
    location: Optional[str]
    anomaly_score: float  # -1 to 1, lower = more anomalous
    is_anomaly: bool
    feature_values: Dict[str, float]
    contributing_features: List[Tuple[str, float]]  # (feature_name, contribution)
    explanation: str
    severity: str  # low, medium, high, critical
    confidence: float  # 0-100


@dataclass
class AnomalyModelMetadata:
    """Metadata for trained anomaly model."""
    model_name: str
    algorithm: str
    version: str
    trained_at: str
    training_samples: int
    features_used: List[str]
    contamination: float
    hyperparameters: Dict[str, Any]
    evaluation_metrics: Dict[str, float]
    data_statistics: Dict[str, Dict[str, float]]


class GATIAnomalyDetector:
    """
    Production-grade anomaly detector for GATI platform.
    Primary: Isolation Forest (justified above)
    Fallback: Local Outlier Factor, One-Class SVM
    """
    
    def __init__(
        self,
        contamination: float = 0.05,
        n_estimators: int = 100,
        max_samples: str = 'auto',
        random_state: int = 42
    ):
        """
        Initialize anomaly detector.
        
        Args:
            contamination: Expected proportion of anomalies (0.05 = 5%)
            n_estimators: Number of trees in Isolation Forest
            max_samples: Samples for each tree
            random_state: For reproducibility
        """
        self.contamination = contamination
        self.n_estimators = n_estimators
        self.max_samples = max_samples
        self.random_state = random_state
        
        # Primary model: Isolation Forest
        self.model = IsolationForest(
            n_estimators=n_estimators,
            contamination=contamination,
            max_samples=max_samples,
            random_state=random_state,
            n_jobs=-1
        )
        
        # Alternative models for comparison
        self.alternative_models = {
            'lof': LocalOutlierFactor(
                n_neighbors=20,
                contamination=contamination,
                novelty=True,
                n_jobs=-1
            ),
            'ocsvm': OneClassSVM(
                kernel='rbf',
                nu=contamination,
                gamma='auto'
            )
        }
        
        self.scaler = StandardScaler()
        self.feature_names: List[str] = []
        self.is_fitted = False
        self.metadata: Optional[AnomalyModelMetadata] = None
        self.training_data_stats: Dict[str, Dict[str, float]] = {}
        
        logger.info(f"GATI Anomaly Detector initialized (contamination={contamination})")
    
    def fit(
        self,
        X: np.ndarray,
        feature_names: Optional[List[str]] = None,
        dates: Optional[List[str]] = None,
        locations: Optional[List[str]] = None
    ) -> 'GATIAnomalyDetector':
        """
        Fit the anomaly detection model.
        
        Args:
            X: Feature array (n_samples, n_features)
            feature_names: Names of features
            dates: Optional dates for each sample
            locations: Optional locations for each sample
            
        Returns:
            self
        """
        logger.info(f"Training Isolation Forest on {X.shape[0]} samples, {X.shape[1]} features")
        
        # Store feature names
        if feature_names:
            self.feature_names = feature_names
        else:
            self.feature_names = [f'feature_{i}' for i in range(X.shape[1])]
        
        # Store training data statistics for explainability
        for i, name in enumerate(self.feature_names):
            self.training_data_stats[name] = {
                'mean': float(np.mean(X[:, i])),
                'std': float(np.std(X[:, i])),
                'min': float(np.min(X[:, i])),
                'max': float(np.max(X[:, i])),
                'median': float(np.median(X[:, i])),
                'q25': float(np.percentile(X[:, i], 25)),
                'q75': float(np.percentile(X[:, i], 75))
            }
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train primary model
        self.model.fit(X_scaled)
        
        # Train alternative models for comparison
        for name, model in self.alternative_models.items():
            try:
                model.fit(X_scaled)
                logger.debug(f"Alternative model {name} trained")
            except Exception as e:
                logger.warning(f"Failed to train {name}: {e}")
        
        self.is_fitted = True
        
        # Create metadata
        self.metadata = AnomalyModelMetadata(
            model_name='GATI_AnomalyDetector',
            algorithm='IsolationForest',
            version='1.0.0',
            trained_at=datetime.now().isoformat(),
            training_samples=X.shape[0],
            features_used=self.feature_names,
            contamination=self.contamination,
            hyperparameters={
                'n_estimators': self.n_estimators,
                'max_samples': str(self.max_samples),
                'random_state': self.random_state
            },
            evaluation_metrics={},  # Filled during evaluate()
            data_statistics=self.training_data_stats
        )
        
        logger.info("✅ Anomaly detection model trained successfully")
        
        return self
    
    def predict(
        self,
        X: np.ndarray,
        dates: Optional[List[str]] = None,
        locations: Optional[List[str]] = None,
        return_scores: bool = True
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Predict anomalies.
        
        Args:
            X: Feature array
            dates: Optional dates for each sample
            locations: Optional locations
            return_scores: Whether to return anomaly scores
            
        Returns:
            Tuple of (predictions, scores) where predictions is 1 for normal, -1 for anomaly
        """
        if not self.is_fitted:
            raise ValueError("Model not fitted. Call fit() first.")
        
        X_scaled = self.scaler.transform(X)
        
        # Get predictions (-1 = anomaly, 1 = normal)
        predictions = self.model.predict(X_scaled)
        
        # Get anomaly scores (lower = more anomalous)
        scores = self.model.decision_function(X_scaled)
        
        n_anomalies = np.sum(predictions == -1)
        logger.info(f"Detected {n_anomalies} anomalies out of {len(predictions)} samples ({n_anomalies/len(predictions)*100:.1f}%)")
        
        return predictions, scores
    
    def detect_anomalies(
        self,
        X: np.ndarray,
        dates: Optional[List[str]] = None,
        locations: Optional[List[str]] = None,
        feature_values_df: Optional[pd.DataFrame] = None
    ) -> List[AnomalyResult]:
        """
        Detect anomalies with full explanations.
        
        Args:
            X: Feature array
            dates: Dates for each sample
            locations: Locations for each sample
            feature_values_df: DataFrame with feature values for explanation
            
        Returns:
            List of AnomalyResult objects for detected anomalies
        """
        predictions, scores = self.predict(X)
        
        results = []
        
        for i in range(len(predictions)):
            is_anomaly = predictions[i] == -1
            
            # Calculate severity based on score
            score = scores[i]
            if score < -0.5:
                severity = 'critical'
                confidence = 95.0
            elif score < -0.3:
                severity = 'high'
                confidence = 85.0
            elif score < -0.1:
                severity = 'medium'
                confidence = 75.0
            else:
                severity = 'low'
                confidence = 65.0
            
            # Get feature values
            feature_vals = {}
            if feature_values_df is not None and i < len(feature_values_df):
                for fname in self.feature_names:
                    if fname in feature_values_df.columns:
                        feature_vals[fname] = float(feature_values_df.iloc[i][fname])
            else:
                for j, fname in enumerate(self.feature_names):
                    feature_vals[fname] = float(X[i, j])
            
            # Calculate contributing features (deviation from mean)
            contributing = []
            for fname, val in feature_vals.items():
                if fname in self.training_data_stats:
                    stats = self.training_data_stats[fname]
                    if stats['std'] > 0:
                        z_score = abs(val - stats['mean']) / stats['std']
                        if z_score > 1.5:  # Significant deviation
                            contributing.append((fname, z_score))
            
            contributing.sort(key=lambda x: x[1], reverse=True)
            top_contributors = contributing[:5]
            
            # Generate explanation
            explanation = self._generate_explanation(
                is_anomaly, severity, score, top_contributors, feature_vals
            )
            
            result = AnomalyResult(
                index=i,
                date=dates[i] if dates and i < len(dates) else None,
                location=locations[i] if locations and i < len(locations) else None,
                anomaly_score=float(score),
                is_anomaly=is_anomaly,
                feature_values=feature_vals,
                contributing_features=top_contributors,
                explanation=explanation,
                severity=severity if is_anomaly else 'none',
                confidence=confidence if is_anomaly else 0.0
            )
            
            results.append(result)
        
        # Filter to only anomalies for return
        anomalies_only = [r for r in results if r.is_anomaly]
        logger.info(f"Generated explanations for {len(anomalies_only)} anomalies")
        
        return results
    
    def _generate_explanation(
        self,
        is_anomaly: bool,
        severity: str,
        score: float,
        contributors: List[Tuple[str, float]],
        feature_vals: Dict[str, float]
    ) -> str:
        """Generate human-readable explanation for anomaly."""
        if not is_anomaly:
            return "Normal pattern - within expected range"
        
        if not contributors:
            return f"Unusual pattern detected with {severity} severity (score: {score:.3f})"
        
        # Build explanation
        parts = [f"Anomaly detected with {severity} severity."]
        
        parts.append("Contributing factors:")
        for fname, z_score in contributors[:3]:
            val = feature_vals.get(fname, 0)
            stats = self.training_data_stats.get(fname, {})
            mean = stats.get('mean', 0)
            
            direction = "above" if val > mean else "below"
            parts.append(f"  • {fname}: {val:.0f} ({z_score:.1f}σ {direction} normal)")
        
        return " ".join(parts)
    
    def evaluate(
        self,
        X: np.ndarray,
        true_labels: Optional[np.ndarray] = None
    ) -> Dict[str, float]:
        """
        Evaluate model performance.
        
        For unsupervised learning without labels:
        - Silhouette score (cluster separation)
        - Anomaly rate stability
        - Score distribution metrics
        
        Args:
            X: Feature array
            true_labels: Optional ground truth labels
            
        Returns:
            Dictionary of evaluation metrics
        """
        if not self.is_fitted:
            raise ValueError("Model not fitted")
        
        predictions, scores = self.predict(X)
        
        metrics = {}
        
        # Anomaly rate
        anomaly_rate = np.mean(predictions == -1)
        metrics['anomaly_rate'] = float(anomaly_rate)
        metrics['anomaly_rate_vs_expected'] = float(abs(anomaly_rate - self.contamination))
        
        # Score distribution
        metrics['score_mean'] = float(np.mean(scores))
        metrics['score_std'] = float(np.std(scores))
        metrics['score_min'] = float(np.min(scores))
        metrics['score_max'] = float(np.max(scores))
        
        # Score separation (gap between anomaly and normal scores)
        anomaly_scores = scores[predictions == -1]
        normal_scores = scores[predictions == 1]
        
        if len(anomaly_scores) > 0 and len(normal_scores) > 0:
            score_gap = np.mean(normal_scores) - np.mean(anomaly_scores)
            metrics['score_separation'] = float(score_gap)
        else:
            metrics['score_separation'] = 0.0
        
        # Silhouette score if possible
        try:
            if len(np.unique(predictions)) > 1:
                X_scaled = self.scaler.transform(X)
                sil_score = silhouette_score(X_scaled, predictions)
                metrics['silhouette_score'] = float(sil_score)
            else:
                metrics['silhouette_score'] = 0.0
        except Exception as e:
            logger.warning(f"Could not compute silhouette score: {e}")
            metrics['silhouette_score'] = 0.0
        
        # Stability score (consistency across random subsets)
        stability_scores = []
        n_samples = len(X)
        for _ in range(5):
            subset_idx = np.random.choice(n_samples, size=int(n_samples * 0.8), replace=False)
            X_subset = X[subset_idx]
            _, subset_scores = self.predict(X_subset)
            stability_scores.append(np.std(subset_scores))
        
        metrics['stability_score'] = 1.0 - min(1.0, np.mean(stability_scores))
        
        # Compare with alternative models
        X_scaled = self.scaler.transform(X)
        for name, model in self.alternative_models.items():
            try:
                if hasattr(model, 'predict'):
                    alt_predictions = model.predict(X_scaled)
                    agreement = np.mean(predictions == alt_predictions)
                    metrics[f'{name}_agreement'] = float(agreement)
            except Exception as e:
                logger.debug(f"Could not compare with {name}: {e}")
        
        # Update metadata
        if self.metadata:
            self.metadata.evaluation_metrics = metrics
        
        logger.info(f"Evaluation complete: {len(metrics)} metrics computed")
        
        # Print summary
        print("\n📊 ANOMALY DETECTION EVALUATION")
        print("="*50)
        print(f"Anomaly Rate: {metrics['anomaly_rate']*100:.2f}% (expected: {self.contamination*100:.2f}%)")
        print(f"Score Separation: {metrics.get('score_separation', 0):.3f}")
        print(f"Silhouette Score: {metrics.get('silhouette_score', 0):.3f}")
        print(f"Stability Score: {metrics.get('stability_score', 0):.3f}")
        print("="*50)
        
        return metrics
    
    def compare_algorithms(self, X: np.ndarray) -> pd.DataFrame:
        """
        Compare Isolation Forest with alternative algorithms.
        
        Args:
            X: Feature array
            
        Returns:
            DataFrame with comparison results
        """
        if not self.is_fitted:
            raise ValueError("Model not fitted")
        
        X_scaled = self.scaler.transform(X)
        
        results = []
        
        # Primary model
        preds_if, scores_if = self.predict(X)
        results.append({
            'algorithm': 'IsolationForest',
            'anomaly_rate': np.mean(preds_if == -1),
            'score_mean': np.mean(scores_if),
            'score_std': np.std(scores_if),
            'is_primary': True
        })
        
        # Alternative models
        for name, model in self.alternative_models.items():
            try:
                preds = model.predict(X_scaled)
                if hasattr(model, 'decision_function'):
                    scores = model.decision_function(X_scaled)
                elif hasattr(model, 'score_samples'):
                    scores = model.score_samples(X_scaled)
                else:
                    scores = np.zeros(len(preds))
                
                results.append({
                    'algorithm': name.upper(),
                    'anomaly_rate': np.mean(preds == -1),
                    'score_mean': np.mean(scores),
                    'score_std': np.std(scores),
                    'is_primary': False
                })
            except Exception as e:
                logger.warning(f"Could not evaluate {name}: {e}")
        
        comparison_df = pd.DataFrame(results)
        
        print("\n📊 ALGORITHM COMPARISON")
        print("="*60)
        print(comparison_df.to_string(index=False))
        print("="*60)
        print("\n💡 Isolation Forest selected because:")
        print("   • Best handling of high-dimensional data")
        print("   • No distribution assumptions")
        print("   • Linear time complexity")
        print("   • Built-in feature importance")
        
        return comparison_df
    
    def save(self, filepath: str) -> None:
        """Save model and metadata."""
        save_dict = {
            'model': self.model,
            'scaler': self.scaler,
            'alternative_models': self.alternative_models,
            'feature_names': self.feature_names,
            'training_data_stats': self.training_data_stats,
            'metadata': self.metadata,
            'config': {
                'contamination': self.contamination,
                'n_estimators': self.n_estimators,
                'max_samples': self.max_samples,
                'random_state': self.random_state
            }
        }
        
        joblib.dump(save_dict, filepath)
        
        # Save metadata as JSON for easy reading
        if self.metadata:
            metadata_path = filepath.replace('.joblib', '_metadata.json')
            with open(metadata_path, 'w') as f:
                json.dump({
                    'model_name': self.metadata.model_name,
                    'algorithm': self.metadata.algorithm,
                    'version': self.metadata.version,
                    'trained_at': self.metadata.trained_at,
                    'training_samples': self.metadata.training_samples,
                    'features_used': self.metadata.features_used,
                    'contamination': self.metadata.contamination,
                    'hyperparameters': self.metadata.hyperparameters,
                    'evaluation_metrics': self.metadata.evaluation_metrics
                }, f, indent=2)
        
        logger.info(f"Model saved to {filepath}")
    
    @classmethod
    def load(cls, filepath: str) -> 'GATIAnomalyDetector':
        """Load model from file."""
        save_dict = joblib.load(filepath)
        
        config = save_dict['config']
        detector = cls(
            contamination=config['contamination'],
            n_estimators=config['n_estimators'],
            max_samples=config['max_samples'],
            random_state=config['random_state']
        )
        
        detector.model = save_dict['model']
        detector.scaler = save_dict['scaler']
        detector.alternative_models = save_dict.get('alternative_models', {})
        detector.feature_names = save_dict['feature_names']
        detector.training_data_stats = save_dict['training_data_stats']
        detector.metadata = save_dict['metadata']
        detector.is_fitted = True
        
        logger.info(f"Model loaded from {filepath}")
        
        return detector


def train_anomaly_detector(
    X: np.ndarray,
    feature_names: List[str],
    dates: Optional[List[str]] = None,
    save_path: Optional[str] = None,
    contamination: float = 0.05
) -> Tuple[GATIAnomalyDetector, Dict[str, float]]:
    """
    Convenience function to train and evaluate anomaly detector.
    
    Args:
        X: Feature array
        feature_names: Feature names
        dates: Optional dates
        save_path: Path to save model
        contamination: Expected anomaly rate
        
    Returns:
        Tuple of (trained detector, evaluation metrics)
    """
    detector = GATIAnomalyDetector(contamination=contamination)
    
    # Train
    detector.fit(X, feature_names=feature_names, dates=dates)
    
    # Evaluate
    metrics = detector.evaluate(X)
    
    # Compare algorithms
    detector.compare_algorithms(X)
    
    # Save if path provided
    if save_path:
        detector.save(save_path)
    
    return detector, metrics


if __name__ == "__main__":
    # Test anomaly detection
    from data_loader import GATIDataLoader
    from preprocessing import GATIPreprocessor
    
    print("🔍 GATI ML Pipeline - Anomaly Detection Test")
    print("="*50)
    
    # Load data
    loader = GATIDataLoader()
    df = loader.load_dataset('enrolment')
    
    # Preprocess
    preprocessor = GATIPreprocessor()
    df_clean = preprocessor.clean_data(df)
    
    numeric_cols = ['age_0_5', 'age_5_17', 'age_18_greater']
    X, metadata = preprocessor.prepare_for_anomaly_detection(df_clean, numeric_cols)
    
    feature_names = list(metadata.columns)[1:]  # Exclude date
    
    print(f"\n📊 Training data: {X.shape[0]} samples, {X.shape[1]} features")
    
    # Train
    detector, metrics = train_anomaly_detector(
        X,
        feature_names=feature_names,
        save_path='saved_models/anomaly_detector_v1.joblib',
        contamination=0.05
    )
    
    # Detect anomalies
    dates = metadata['date'].astype(str).tolist() if 'date' in metadata.columns else None
    anomalies = detector.detect_anomalies(X, dates=dates, feature_values_df=metadata)
    
    print(f"\n🚨 Detected {len([a for a in anomalies if a.is_anomaly])} anomalies")
    
    # Show top anomalies
    print("\n📋 Top 5 Anomalies:")
    for a in sorted([a for a in anomalies if a.is_anomaly], key=lambda x: x.anomaly_score)[:5]:
        print(f"  • {a.date}: {a.severity.upper()} - {a.explanation[:100]}...")
    
    print("\n✅ Anomaly detection complete!")
