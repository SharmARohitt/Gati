"""
GATI ML Pipeline - Evaluation Module
=====================================
Unified evaluation metrics for all model types.
Comprehensive metrics for government-grade ML validation.

WHY PROPER EVALUATION IS CRITICAL:
1. Model Validation - Ensure models work before deployment
2. Comparison - Compare different algorithms objectively
3. Monitoring - Track model performance over time
4. Reporting - Provide metrics for stakeholders
5. Debugging - Identify where models fail
"""

import numpy as np
import pandas as pd
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any, Union
from dataclasses import dataclass, field
from pathlib import Path
import json
from loguru import logger
from scipy import stats

# sklearn metrics
from sklearn.metrics import (
    # Classification
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report,
    # Regression
    mean_absolute_error, mean_squared_error, r2_score,
    mean_absolute_percentage_error,
    # Clustering/Anomaly
    silhouette_score, calinski_harabasz_score
)

import warnings
warnings.filterwarnings('ignore')


@dataclass
class ClassificationMetrics:
    """Metrics for classification models."""
    accuracy: float
    precision: float
    recall: float
    f1: float
    roc_auc: Optional[float]
    confusion_matrix: np.ndarray
    class_report: str
    
    def to_dict(self) -> Dict:
        return {
            'accuracy': self.accuracy,
            'precision': self.precision,
            'recall': self.recall,
            'f1': self.f1,
            'roc_auc': self.roc_auc,
            'confusion_matrix': self.confusion_matrix.tolist()
        }


@dataclass
class RegressionMetrics:
    """Metrics for regression models."""
    mae: float
    mse: float
    rmse: float
    mape: float
    r2: float
    explained_variance: float
    
    def to_dict(self) -> Dict:
        return {
            'mae': self.mae,
            'mse': self.mse,
            'rmse': self.rmse,
            'mape': self.mape,
            'r2': self.r2,
            'explained_variance': self.explained_variance
        }


@dataclass
class AnomalyMetrics:
    """Metrics for anomaly detection models."""
    anomaly_rate: float
    silhouette_score: Optional[float]
    calinski_harabasz: Optional[float]
    isolation_stability: float
    score_distribution: Dict[str, float]
    
    def to_dict(self) -> Dict:
        return {
            'anomaly_rate': self.anomaly_rate,
            'silhouette_score': self.silhouette_score,
            'calinski_harabasz': self.calinski_harabasz,
            'isolation_stability': self.isolation_stability,
            'score_distribution': self.score_distribution
        }


@dataclass
class ForecastMetrics:
    """Metrics for forecasting models."""
    mae: float
    rmse: float
    mape: float
    coverage_50: float  # % within 50% CI
    coverage_95: float  # % within 95% CI
    directional_accuracy: float  # % correct trend direction
    
    def to_dict(self) -> Dict:
        return {
            'mae': self.mae,
            'rmse': self.rmse,
            'mape': self.mape,
            'coverage_50': self.coverage_50,
            'coverage_95': self.coverage_95,
            'directional_accuracy': self.directional_accuracy
        }


@dataclass
class EvaluationReport:
    """Complete evaluation report for a model."""
    model_name: str
    model_type: str
    metrics: Union[ClassificationMetrics, RegressionMetrics, AnomalyMetrics, ForecastMetrics]
    evaluation_timestamp: str
    dataset_size: int
    feature_count: int
    notes: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict:
        return {
            'model_name': self.model_name,
            'model_type': self.model_type,
            'metrics': self.metrics.to_dict(),
            'evaluation_timestamp': self.evaluation_timestamp,
            'dataset_size': self.dataset_size,
            'feature_count': self.feature_count,
            'notes': self.notes
        }


class GATIEvaluator:
    """
    Unified evaluation system for all GATI ML models.
    Provides consistent metrics and reporting.
    """
    
    def __init__(self, model_name: str = "GATI Model"):
        """
        Initialize evaluator.
        
        Args:
            model_name: Name of the model being evaluated
        """
        self.model_name = model_name
        self.evaluation_history: List[EvaluationReport] = []
        logger.info(f"GATI Evaluator initialized for {model_name}")
    
    def evaluate_classification(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        y_prob: Optional[np.ndarray] = None,
        feature_count: int = 0
    ) -> ClassificationMetrics:
        """
        Evaluate classification model.
        
        Args:
            y_true: True labels
            y_pred: Predicted labels
            y_prob: Prediction probabilities (optional)
            feature_count: Number of features
            
        Returns:
            ClassificationMetrics object
        """
        accuracy = accuracy_score(y_true, y_pred)
        
        # Handle multi-class with weighted average
        precision = precision_score(y_true, y_pred, average='weighted', zero_division=0)
        recall = recall_score(y_true, y_pred, average='weighted', zero_division=0)
        f1 = f1_score(y_true, y_pred, average='weighted', zero_division=0)
        
        # ROC AUC if probabilities available
        roc_auc = None
        if y_prob is not None:
            try:
                if len(np.unique(y_true)) == 2:
                    # Binary classification
                    if y_prob.ndim == 2:
                        roc_auc = roc_auc_score(y_true, y_prob[:, 1])
                    else:
                        roc_auc = roc_auc_score(y_true, y_prob)
                else:
                    # Multi-class
                    roc_auc = roc_auc_score(y_true, y_prob, multi_class='ovr', average='weighted')
            except Exception as e:
                logger.warning(f"Could not compute ROC-AUC: {e}")
        
        cm = confusion_matrix(y_true, y_pred)
        class_rep = classification_report(y_true, y_pred, zero_division=0)
        
        metrics = ClassificationMetrics(
            accuracy=float(accuracy),
            precision=float(precision),
            recall=float(recall),
            f1=float(f1),
            roc_auc=float(roc_auc) if roc_auc is not None else None,
            confusion_matrix=cm,
            class_report=class_rep
        )
        
        # Create report
        report = EvaluationReport(
            model_name=self.model_name,
            model_type='classification',
            metrics=metrics,
            evaluation_timestamp=datetime.now().isoformat(),
            dataset_size=len(y_true),
            feature_count=feature_count,
            notes=[f"Classes: {list(np.unique(y_true))}"]
        )
        self.evaluation_history.append(report)
        
        logger.info(f"Classification evaluation: Accuracy={accuracy:.4f}, F1={f1:.4f}")
        return metrics
    
    def evaluate_regression(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        feature_count: int = 0
    ) -> RegressionMetrics:
        """
        Evaluate regression model.
        
        Args:
            y_true: True values
            y_pred: Predicted values
            feature_count: Number of features
            
        Returns:
            RegressionMetrics object
        """
        # Replace inf/nan
        y_true = np.nan_to_num(y_true, nan=0.0, posinf=0.0, neginf=0.0)
        y_pred = np.nan_to_num(y_pred, nan=0.0, posinf=0.0, neginf=0.0)
        
        mae = mean_absolute_error(y_true, y_pred)
        mse = mean_squared_error(y_true, y_pred)
        rmse = np.sqrt(mse)
        
        # MAPE with protection against zero
        mask = y_true != 0
        if np.any(mask):
            mape = np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100
        else:
            mape = 0.0
        
        r2 = r2_score(y_true, y_pred)
        
        # Explained variance
        ss_res = np.sum((y_true - y_pred) ** 2)
        ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
        explained_var = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0.0
        
        metrics = RegressionMetrics(
            mae=float(mae),
            mse=float(mse),
            rmse=float(rmse),
            mape=float(mape),
            r2=float(r2),
            explained_variance=float(explained_var)
        )
        
        report = EvaluationReport(
            model_name=self.model_name,
            model_type='regression',
            metrics=metrics,
            evaluation_timestamp=datetime.now().isoformat(),
            dataset_size=len(y_true),
            feature_count=feature_count,
            notes=[f"Value range: [{np.min(y_true):.2f}, {np.max(y_true):.2f}]"]
        )
        self.evaluation_history.append(report)
        
        logger.info(f"Regression evaluation: MAE={mae:.4f}, RMSE={rmse:.4f}, R²={r2:.4f}")
        return metrics
    
    def evaluate_anomaly_detection(
        self,
        X: np.ndarray,
        anomaly_labels: np.ndarray,
        anomaly_scores: np.ndarray,
        n_runs: int = 5
    ) -> AnomalyMetrics:
        """
        Evaluate anomaly detection model.
        
        Since we don't have ground truth for anomalies, we use:
        1. Anomaly rate (should match expected contamination)
        2. Silhouette score (cluster quality)
        3. Stability across runs
        
        Args:
            X: Feature array
            anomaly_labels: Predicted anomaly labels (-1 or 1)
            anomaly_scores: Anomaly scores
            n_runs: Number of runs for stability
            
        Returns:
            AnomalyMetrics object
        """
        anomaly_rate = np.mean(anomaly_labels == -1)
        
        # Silhouette score if we have both classes
        sil_score = None
        ch_score = None
        if len(np.unique(anomaly_labels)) > 1:
            try:
                sil_score = silhouette_score(X, anomaly_labels)
                ch_score = calinski_harabasz_score(X, anomaly_labels)
            except Exception:
                pass
        
        # Score distribution
        score_dist = {
            'mean': float(np.mean(anomaly_scores)),
            'std': float(np.std(anomaly_scores)),
            'min': float(np.min(anomaly_scores)),
            'max': float(np.max(anomaly_scores)),
            'q25': float(np.percentile(anomaly_scores, 25)),
            'q75': float(np.percentile(anomaly_scores, 75))
        }
        
        # Stability: what % of points are consistently classified
        # For now, use score standard deviation as proxy
        stability = 1.0 - min(1.0, np.std(anomaly_scores))
        
        metrics = AnomalyMetrics(
            anomaly_rate=float(anomaly_rate),
            silhouette_score=float(sil_score) if sil_score else None,
            calinski_harabasz=float(ch_score) if ch_score else None,
            isolation_stability=float(stability),
            score_distribution=score_dist
        )
        
        report = EvaluationReport(
            model_name=self.model_name,
            model_type='anomaly_detection',
            metrics=metrics,
            evaluation_timestamp=datetime.now().isoformat(),
            dataset_size=len(X),
            feature_count=X.shape[1] if X.ndim > 1 else 1,
            notes=[f"Anomalies detected: {int(np.sum(anomaly_labels == -1))}"]
        )
        self.evaluation_history.append(report)
        
        logger.info(f"Anomaly evaluation: Rate={anomaly_rate:.4f}, Silhouette={sil_score}")
        return metrics
    
    def evaluate_forecasting(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        y_lower: Optional[np.ndarray] = None,
        y_upper: Optional[np.ndarray] = None,
        y_lower_95: Optional[np.ndarray] = None,
        y_upper_95: Optional[np.ndarray] = None
    ) -> ForecastMetrics:
        """
        Evaluate forecasting model.
        
        Args:
            y_true: Actual values
            y_pred: Predicted values
            y_lower, y_upper: 50% confidence interval bounds
            y_lower_95, y_upper_95: 95% confidence interval bounds
            
        Returns:
            ForecastMetrics object
        """
        # Clean data
        y_true = np.nan_to_num(y_true, nan=0.0)
        y_pred = np.nan_to_num(y_pred, nan=0.0)
        
        mae = float(mean_absolute_error(y_true, y_pred))
        mse = mean_squared_error(y_true, y_pred)
        rmse = float(np.sqrt(mse))
        
        # MAPE
        mask = y_true != 0
        if np.any(mask):
            mape = float(np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100)
        else:
            mape = 0.0
        
        # Coverage metrics
        coverage_50 = 0.0
        if y_lower is not None and y_upper is not None:
            within_50 = (y_true >= y_lower) & (y_true <= y_upper)
            coverage_50 = float(np.mean(within_50) * 100)
        
        coverage_95 = 0.0
        if y_lower_95 is not None and y_upper_95 is not None:
            within_95 = (y_true >= y_lower_95) & (y_true <= y_upper_95)
            coverage_95 = float(np.mean(within_95) * 100)
        
        # Directional accuracy
        if len(y_true) > 1:
            actual_direction = np.diff(y_true) > 0
            pred_direction = np.diff(y_pred) > 0
            directional_acc = float(np.mean(actual_direction == pred_direction) * 100)
        else:
            directional_acc = 0.0
        
        metrics = ForecastMetrics(
            mae=mae,
            rmse=rmse,
            mape=mape,
            coverage_50=coverage_50,
            coverage_95=coverage_95,
            directional_accuracy=directional_acc
        )
        
        report = EvaluationReport(
            model_name=self.model_name,
            model_type='forecasting',
            metrics=metrics,
            evaluation_timestamp=datetime.now().isoformat(),
            dataset_size=len(y_true),
            feature_count=1,  # Time series
            notes=[f"Forecast horizon: {len(y_true)} periods"]
        )
        self.evaluation_history.append(report)
        
        logger.info(f"Forecast evaluation: MAE={mae:.4f}, RMSE={rmse:.4f}, MAPE={mape:.2f}%")
        return metrics
    
    def cross_validate(
        self,
        model: Any,
        X: np.ndarray,
        y: np.ndarray,
        cv: int = 5,
        task: str = 'classification'
    ) -> Dict[str, float]:
        """
        Perform k-fold cross-validation.
        
        Args:
            model: ML model with fit/predict methods
            X: Features
            y: Targets
            cv: Number of folds
            task: 'classification' or 'regression'
            
        Returns:
            Dictionary with mean and std of metrics
        """
        from sklearn.model_selection import cross_val_score, KFold
        
        kf = KFold(n_splits=cv, shuffle=True, random_state=42)
        
        if task == 'classification':
            scoring = 'f1_weighted'
        else:
            scoring = 'neg_mean_absolute_error'
        
        scores = cross_val_score(model, X, y, cv=kf, scoring=scoring)
        
        if task == 'regression':
            scores = -scores  # Convert back to positive
        
        results = {
            'mean_score': float(np.mean(scores)),
            'std_score': float(np.std(scores)),
            'min_score': float(np.min(scores)),
            'max_score': float(np.max(scores)),
            'cv_folds': cv,
            'metric': scoring
        }
        
        logger.info(f"Cross-validation: {np.mean(scores):.4f} ± {np.std(scores):.4f}")
        return results
    
    def generate_report(self, output_path: Optional[str] = None) -> str:
        """
        Generate comprehensive evaluation report.
        
        Args:
            output_path: Path to save report
            
        Returns:
            Report as string
        """
        lines = [
            "="*70,
            "GATI ML EVALUATION REPORT",
            f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            f"Model: {self.model_name}",
            f"Total Evaluations: {len(self.evaluation_history)}",
            "="*70,
            ""
        ]
        
        for i, report in enumerate(self.evaluation_history):
            lines.append(f"Evaluation #{i+1}")
            lines.append(f"  Type: {report.model_type}")
            lines.append(f"  Timestamp: {report.evaluation_timestamp}")
            lines.append(f"  Dataset Size: {report.dataset_size}")
            lines.append(f"  Features: {report.feature_count}")
            lines.append("  Metrics:")
            
            metrics_dict = report.metrics.to_dict()
            for key, value in metrics_dict.items():
                if key != 'confusion_matrix' and key != 'score_distribution':
                    if isinstance(value, float):
                        lines.append(f"    {key}: {value:.4f}")
                    else:
                        lines.append(f"    {key}: {value}")
            
            if report.notes:
                lines.append(f"  Notes: {'; '.join(report.notes)}")
            lines.append("")
        
        lines.append("="*70)
        
        report_text = "\n".join(lines)
        
        if output_path:
            Path(output_path).parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, 'w') as f:
                f.write(report_text)
            logger.info(f"Report saved to {output_path}")
        
        return report_text
    
    def save_metrics_json(self, output_path: str) -> None:
        """Save metrics to JSON file."""
        data = {
            'model_name': self.model_name,
            'evaluations': [r.to_dict() for r in self.evaluation_history]
        }
        
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2)
        
        logger.info(f"Metrics saved to {output_path}")


def evaluate_all_models(
    models: Dict[str, Any],
    X: np.ndarray,
    y: np.ndarray,
    task: str = 'classification'
) -> pd.DataFrame:
    """
    Compare multiple models on the same dataset.
    
    Args:
        models: Dictionary of {name: model}
        X: Features
        y: Targets
        task: 'classification' or 'regression'
        
    Returns:
        Comparison DataFrame
    """
    results = []
    
    for name, model in models.items():
        evaluator = GATIEvaluator(name)
        
        if hasattr(model, 'predict'):
            y_pred = model.predict(X)
            
            if task == 'classification':
                y_prob = model.predict_proba(X) if hasattr(model, 'predict_proba') else None
                metrics = evaluator.evaluate_classification(y, y_pred, y_prob)
                results.append({
                    'model': name,
                    'accuracy': metrics.accuracy,
                    'precision': metrics.precision,
                    'recall': metrics.recall,
                    'f1': metrics.f1,
                    'roc_auc': metrics.roc_auc or 0
                })
            else:
                metrics = evaluator.evaluate_regression(y, y_pred)
                results.append({
                    'model': name,
                    'mae': metrics.mae,
                    'rmse': metrics.rmse,
                    'mape': metrics.mape,
                    'r2': metrics.r2
                })
    
    return pd.DataFrame(results)


if __name__ == "__main__":
    print("🧪 GATI ML Pipeline - Evaluation Test")
    print("="*50)
    
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.linear_model import LogisticRegression
    
    np.random.seed(42)
    X = np.random.randn(200, 5)
    y = (X[:, 0] + X[:, 1] > 0).astype(int)
    
    # Train models
    rf = RandomForestClassifier(n_estimators=50, random_state=42).fit(X, y)
    lr = LogisticRegression(random_state=42).fit(X, y)
    
    # Evaluate single model
    print("\n📊 Single Model Evaluation:")
    evaluator = GATIEvaluator("RandomForest")
    y_pred = rf.predict(X)
    y_prob = rf.predict_proba(X)
    
    metrics = evaluator.evaluate_classification(y, y_pred, y_prob, X.shape[1])
    print(f"  Accuracy: {metrics.accuracy:.4f}")
    print(f"  F1: {metrics.f1:.4f}")
    print(f"  ROC-AUC: {metrics.roc_auc:.4f}")
    
    # Cross-validation
    print("\n🔄 Cross-Validation:")
    cv_results = evaluator.cross_validate(rf, X, y, cv=5)
    print(f"  Mean Score: {cv_results['mean_score']:.4f} ± {cv_results['std_score']:.4f}")
    
    # Compare models
    print("\n🏆 Model Comparison:")
    comparison = evaluate_all_models({'RandomForest': rf, 'LogisticRegression': lr}, X, y)
    print(comparison.to_string(index=False))
    
    # Generate report
    print("\n📄 Generating report...")
    report = evaluator.generate_report('reports/evaluation_report.txt')
    print("Report generated!")
    
    print("\n✅ Evaluation complete!")
