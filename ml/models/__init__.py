"""
GATI ML Pipeline - Models Package
=================================
Machine learning models for Aadhaar data analytics.

Models:
- Anomaly Detection: Isolation Forest for identifying unusual patterns
- Risk Scoring: XGBoost for multi-level risk classification
- Forecasting: Prophet for time series predictions
- Explainability: SHAP-based explanations for all models
"""

from .anomaly_detection import GATIAnomalyDetector, train_anomaly_detector
from .risk_scoring import GATIRiskScorer, train_risk_scorer
from .forecasting import GATIForecaster, train_forecaster
from .explainability import GATIExplainer, explain_model

__all__ = [
    'GATIAnomalyDetector',
    'GATIRiskScorer',
    'GATIForecaster',
    'GATIExplainer',
    'train_anomaly_detector',
    'train_risk_scorer',
    'train_forecaster',
    'explain_model'
]
