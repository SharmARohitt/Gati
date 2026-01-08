"""
GATI ML Pipeline
================
Production-grade Machine Learning system for Governance & Aadhaar Tracking Intelligence.

This package provides:
- Data loading and preprocessing for Aadhaar CSV datasets
- Anomaly detection using Isolation Forest
- Risk scoring using XGBoost with derived labels
- Time series forecasting using Prophet
- SHAP-based explainability for government transparency
- Model versioning and registry for audit compliance
- Unified evaluation metrics system
- FastAPI-based REST API for frontend integration

Key Design Principles:
1. TRANSPARENCY - All model decisions are explainable
2. HONESTY - Labels are derived, not ground truth (clearly documented)
3. REPRODUCIBILITY - Full model versioning and lineage tracking
4. PRODUCTION-READY - Proper error handling, logging, and API design

Usage:
    # Train all models
    python train_all.py --deploy

    # Start API server
    python -m api.main

    # Use programmatically
    from gati_ml import GATIDataLoader, GATIAnomalyDetector
    loader = GATIDataLoader()
    data = loader.load_all_datasets()
"""

__version__ = "1.0.0"
__author__ = "GATI Team"

from .data_loader import GATIDataLoader
from .preprocessing import GATIPreprocessor
from .evaluation import GATIEvaluator
from .versioning import GATIModelVersioning
from .models import (
    GATIAnomalyDetector,
    GATIRiskScorer,
    GATIForecaster,
    GATIExplainer
)

__all__ = [
    'GATIDataLoader',
    'GATIPreprocessor',
    'GATIEvaluator',
    'GATIModelVersioning',
    'GATIAnomalyDetector',
    'GATIRiskScorer',
    'GATIForecaster',
    'GATIExplainer',
    '__version__'
]
