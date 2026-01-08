"""
GATI ML Pipeline - Master Training Script
==========================================
Complete end-to-end training of all ML models.
Run this script to train all models with the Aadhaar dataset.

Usage:
    python train_all.py                    # Train all models
    python train_all.py --model anomaly    # Train specific model
    python train_all.py --evaluate         # Train and run comprehensive evaluation
    python train_all.py --deploy           # Train and promote to production
"""

import argparse
import sys
import os
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Tuple, Optional
import json

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    os.environ['PYTHONIOENCODING'] = 'utf-8'

import numpy as np
import pandas as pd
from loguru import logger

# Configure logging - use UTF-8 encoding
logger.remove()
logger.add(
    sys.stdout, 
    level="INFO", 
    format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <level>{message}</level>",
    colorize=True
)
logger.add("logs/training.log", rotation="10 MB", level="DEBUG", encoding="utf-8")

# Ensure all modules are importable
sys.path.insert(0, str(Path(__file__).parent))


def load_config() -> Dict:
    """Load configuration from config.yaml."""
    try:
        import yaml
        with open("config.yaml", "r") as f:
            return yaml.safe_load(f)
    except Exception as e:
        logger.warning(f"Could not load config.yaml: {e}")
        return {}


def train_anomaly_model(config: Dict) -> Tuple[Any, Dict[str, float], float]:
    """
    Train anomaly detection model.
    
    Returns:
        Tuple of (model, metrics, duration)
    """
    logger.info("[ANOMALY] Training Anomaly Detection Model (Isolation Forest)")
    start_time = time.time()
    
    from data_loader import GATIDataLoader
    from preprocessing import GATIPreprocessor
    from models.anomaly_detection import GATIAnomalyDetector
    from evaluation import GATIEvaluator
    
    # Load data
    loader = GATIDataLoader()
    datasets = loader.load_all_datasets()
    
    if not datasets:
        raise ValueError("No datasets loaded!")
    
    # Generate quality report for enrolment data
    quality_report = loader.generate_quality_report('enrolment')
    logger.info(f"Data Quality - Total records: {quality_report.total_records}")
    
    # Prepare data
    preprocessor = GATIPreprocessor()
    aggregated = loader.get_aggregated_data('enrolment', agg_level='date')
    
    if aggregated.empty:
        raise ValueError("Aggregated data is empty!")
    
    # Get numeric columns for enrolment
    numeric_cols = ['age_0_5', 'age_5_17', 'age_18_greater']
    X, metadata = preprocessor.prepare_for_anomaly_detection(aggregated, numeric_cols, 'date')
    feature_names = [col for col in metadata.columns if col != 'date']
    entity_ids = metadata['date'].astype(str).tolist() if 'date' in metadata.columns else list(range(len(X)))
    
    logger.info(f"Training data shape: {X.shape}")
    logger.info(f"Features: {feature_names[:5]}..." if len(feature_names) > 5 else f"Features: {feature_names}")
    
    # Configure and train
    anomaly_config = config.get('anomaly_detection', {})
    contamination = anomaly_config.get('contamination', 0.05)
    n_estimators = anomaly_config.get('n_estimators', 100)
    
    detector = GATIAnomalyDetector(
        contamination=contamination,
        n_estimators=n_estimators,
        random_state=42
    )
    
    detector.fit(X, feature_names)
    
    # Evaluate
    evaluator = GATIEvaluator("Anomaly Detector")
    anomaly_labels = detector.predict(X)
    anomaly_scores = detector.model.decision_function(X)
    
    eval_metrics = evaluator.evaluate_anomaly_detection(X, anomaly_labels, anomaly_scores)
    
    metrics = {
        'anomaly_rate': eval_metrics.anomaly_rate,
        'silhouette_score': eval_metrics.silhouette_score or 0.0,
        'isolation_stability': eval_metrics.isolation_stability,
        'total_samples': len(X),
        'anomalies_detected': int(np.sum(anomaly_labels == -1))
    }
    
    duration = time.time() - start_time
    
    logger.info(f"[SUCCESS] Anomaly Detection trained in {duration:.2f}s")
    logger.info(f"   Anomaly rate: {metrics['anomaly_rate']:.4f}")
    logger.info(f"   Silhouette: {metrics['silhouette_score']:.4f}")
    
    return detector.model, metrics, duration


def train_risk_model(config: Dict) -> Tuple[Any, Dict[str, float], float]:
    """
    Train risk scoring model.
    
    Returns:
        Tuple of (model, metrics, duration)
    """
    logger.info("[RISK] Training Risk Scoring Model (XGBoost)")
    start_time = time.time()
    
    from data_loader import GATIDataLoader
    from preprocessing import GATIPreprocessor
    from models.risk_scoring import GATIRiskScorer
    from evaluation import GATIEvaluator
    
    # Load data
    loader = GATIDataLoader()
    loader.load_all_datasets()
    
    # Prepare data
    preprocessor = GATIPreprocessor()
    aggregated = loader.get_aggregated_data('enrolment', agg_level='state')
    
    # Get numeric columns for enrolment
    numeric_cols = ['age_0_5', 'age_5_17', 'age_18_greater']
    df_features, y = preprocessor.prepare_for_risk_scoring(aggregated, numeric_cols, 'state')
    
    # Extract feature matrix
    feature_cols = [col for col in df_features.columns if col not in ['state', 'derived_risk_score', 'derived_risk_label']]
    X = df_features[feature_cols].values
    entity_ids = df_features['state'].tolist() if 'state' in df_features.columns else list(range(len(X)))
    feature_names = feature_cols
    
    logger.info(f"Training data shape: {X.shape}")
    logger.info(f"Class distribution: {np.bincount(y)}")
    
    # Configure and train
    risk_config = config.get('risk_scoring', {})
    
    scorer = GATIRiskScorer(
        n_estimators=risk_config.get('n_estimators', 100),
        max_depth=risk_config.get('max_depth', 6),
        learning_rate=risk_config.get('learning_rate', 0.1),
        random_state=42
    )
    
    scorer.fit(X, y, feature_names, entity_ids)
    
    # Evaluate
    evaluator = GATIEvaluator("Risk Scorer")
    y_pred, y_prob = scorer.predict(X, return_proba=True)
    
    eval_metrics = evaluator.evaluate_classification(y, y_pred, y_prob, X.shape[1])
    
    # Cross-validation
    cv_results = evaluator.cross_validate(scorer.model, X, y, cv=5, task='classification')
    
    metrics = {
        'accuracy': eval_metrics.accuracy,
        'precision': eval_metrics.precision,
        'recall': eval_metrics.recall,
        'f1': eval_metrics.f1,
        'roc_auc': eval_metrics.roc_auc or 0.0,
        'cv_score': cv_results['mean_score'],
        'cv_std': cv_results['std_score']
    }
    
    duration = time.time() - start_time
    
    logger.info(f"[SUCCESS] Risk Scoring trained in {duration:.2f}s")
    logger.info(f"   Accuracy: {metrics['accuracy']:.4f}")
    logger.info(f"   F1 Score: {metrics['f1']:.4f}")
    logger.info(f"   CV Score: {metrics['cv_score']:.4f} ± {metrics['cv_std']:.4f}")
    
    return scorer.model, metrics, duration


def train_forecast_model(config: Dict) -> Tuple[Any, Dict[str, float], float]:
    """
    Train forecasting model.
    
    Returns:
        Tuple of (model, metrics, duration)
    """
    logger.info("[FORECAST] Training Forecasting Model (Prophet)")
    start_time = time.time()
    
    from data_loader import GATIDataLoader
    from preprocessing import GATIPreprocessor
    from models.forecasting import GATIForecaster
    from evaluation import GATIEvaluator
    
    # Load data
    loader = GATIDataLoader()
    loader.load_all_datasets()
    
    # Prepare time series data
    preprocessor = GATIPreprocessor()
    ts_data = loader.get_time_series('enrolment')
    
    if ts_data.empty:
        logger.warning("No time series data available, using synthetic data")
        # Create minimal synthetic data for training
        dates = pd.date_range(start='2024-01-01', periods=100, freq='D')
        ts_data = pd.DataFrame({
            'date': dates,
            'total': np.random.randint(1000, 5000, 100)
        })
        target_col = 'total'
    else:
        # Reset index to get date as column
        ts_data = ts_data.reset_index()
        target_col = 'total'
    
    # Use prepare_for_forecasting
    train_df, test_df = preprocessor.prepare_for_forecasting(ts_data, target_col, 'date', horizon=30)
    
    # Extract ds and y from train_df
    ds = train_df['ds']
    y = train_df['y']
    
    logger.info(f"Time series length: {len(y)}")
    logger.info(f"Date range: {ds.min()} to {ds.max()}")
    
    # Configure and train
    forecast_config = config.get('forecasting', {})
    
    forecaster = GATIForecaster(
        horizon_days=forecast_config.get('horizon', 30),
        weekly_seasonality=forecast_config.get('weekly_seasonality', True),
        monthly_seasonality=forecast_config.get('monthly_seasonality', True)
    )
    
    # Prepare data for fit (expects DataFrame with date and total columns)
    forecaster.fit(ts_data, 'date', target_col)
    
    # Evaluate using holdout
    if len(y) > 30:
        train_size = int(len(y) * 0.8)
        
        # Fit on train, predict on test
        ts_train = ts_data.iloc[:train_size]
        forecaster_eval = GATIForecaster(horizon_days=len(y) - train_size)
        forecaster_eval.fit(ts_train, 'date', target_col)
        
        # Generate forecast
        forecast_df = forecaster_eval.predict(len(y) - train_size)
        
        evaluator = GATIEvaluator("Forecaster")
        y_true = y.iloc[train_size:].values
        
        if forecast_df is not None and len(forecast_df) > 0:
            y_pred = forecast_df['predicted'].values[:len(y_true)]
            
            eval_metrics = evaluator.evaluate_forecasting(
                np.array(y_true),
                np.array(y_pred)
            )
            
            metrics = {
                'mae': eval_metrics.mae,
                'rmse': eval_metrics.rmse,
                'mape': eval_metrics.mape,
                'directional_accuracy': eval_metrics.directional_accuracy
            }
        else:
            metrics = {
                'mae': 0.0,
                'rmse': 0.0,
                'mape': 0.0,
                'directional_accuracy': 0.0
            }
            logger.warning("Forecast returned empty results")
    else:
        metrics = {
            'mae': 0.0,
            'rmse': 0.0,
            'mape': 0.0,
            'directional_accuracy': 0.0
        }
        logger.warning("Insufficient data for holdout evaluation")
    
    duration = time.time() - start_time
    
    logger.info(f"[SUCCESS] Forecasting trained in {duration:.2f}s")
    logger.info(f"   MAE: {metrics['mae']:.4f}")
    logger.info(f"   RMSE: {metrics['rmse']:.4f}")
    logger.info(f"   MAPE: {metrics['mape']:.2f}%")
    
    return forecaster.model, metrics, duration


def register_model(
    model: Any,
    model_name: str,
    model_type: str,
    metrics: Dict[str, float],
    duration: float,
    deploy: bool = False
) -> str:
    """Register trained model in the registry."""
    from versioning import GATIModelVersioning
    
    versioning = GATIModelVersioning("models")
    
    version = versioning.register_model(
        model=model,
        model_name=model_name,
        model_type=model_type,
        description=f"Trained on {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        metrics=metrics,
        training_duration=duration,
        created_by="train_all.py"
    )
    
    if deploy:
        versioning.promote_to_production(model_name, version.version)
        logger.info(f"[DEPLOYED] Promoted {model_name} v{version.version} to production")
    
    return version.version


def generate_training_report(results: Dict[str, Any], output_path: str) -> None:
    """Generate comprehensive training report."""
    report_lines = [
        "="*70,
        "GATI ML TRAINING REPORT",
        f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "="*70,
        ""
    ]
    
    total_duration = sum(r['duration'] for r in results.values())
    report_lines.append(f"Total Training Time: {total_duration:.2f} seconds")
    report_lines.append(f"Models Trained: {len(results)}")
    report_lines.append("")
    
    for model_name, result in results.items():
        report_lines.append("-"*50)
        report_lines.append(f"[MODEL] {model_name.upper()}")
        report_lines.append("-"*50)
        report_lines.append(f"Version: {result.get('version', 'unknown')}")
        report_lines.append(f"Duration: {result['duration']:.2f}s")
        report_lines.append("Metrics:")
        for metric, value in result['metrics'].items():
            if isinstance(value, float):
                report_lines.append(f"  - {metric}: {value:.4f}")
            else:
                report_lines.append(f"  - {metric}: {value}")
        report_lines.append("")
    
    report_lines.append("="*70)
    report_lines.append("METHODOLOGY NOTES:")
    report_lines.append("")
    report_lines.append("1. ANOMALY DETECTION: Isolation Forest")
    report_lines.append("   - Unsupervised algorithm, no ground truth labels")
    report_lines.append("   - Silhouette score measures cluster separation")
    report_lines.append("")
    report_lines.append("2. RISK SCORING: XGBoost Classifier")
    report_lines.append("   - Labels DERIVED from data characteristics (NOT ground truth)")
    report_lines.append("   - High volatility + coverage gaps = higher risk")
    report_lines.append("   - Use with caution in production decisions")
    report_lines.append("")
    report_lines.append("3. FORECASTING: Prophet")
    report_lines.append("   - Automatic seasonality detection")
    report_lines.append("   - Handles missing values gracefully")
    report_lines.append("   - MAPE indicates average percentage error")
    report_lines.append("="*70)
    
    report_text = "\n".join(report_lines)
    
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(report_text)
    
    logger.info(f"Training report saved to {output_path}")
    
    # Print summary
    print("\n" + "="*50)
    print("TRAINING SUMMARY")
    print("="*50)
    for model_name, result in results.items():
        status = "[OK]" if result.get('success', False) else "[FAIL]"
        print(f"{status} {model_name}: v{result.get('version', 'N/A')} ({result['duration']:.1f}s)")


def main():
    """Main training entry point."""
    parser = argparse.ArgumentParser(description="GATI ML Training Pipeline")
    parser.add_argument(
        "--model",
        type=str,
        choices=['anomaly', 'risk', 'forecast', 'all'],
        default='all',
        help="Which model to train"
    )
    parser.add_argument(
        "--evaluate",
        action="store_true",
        help="Run comprehensive evaluation after training"
    )
    parser.add_argument(
        "--deploy",
        action="store_true",
        help="Promote trained models to production"
    )
    parser.add_argument(
        "--config",
        type=str,
        default="config.yaml",
        help="Path to config file"
    )
    
    args = parser.parse_args()
    
    print("="*60)
    print("GATI ML TRAINING PIPELINE")
    print("="*60)
    print(f"Mode: {'All Models' if args.model == 'all' else args.model}")
    print(f"Evaluate: {args.evaluate}")
    print(f"Deploy: {args.deploy}")
    print("="*60)
    
    # Load config
    config = load_config()
    
    # Training results
    results = {}
    
    try:
        # Train Anomaly Detection
        if args.model in ['all', 'anomaly']:
            try:
                model, metrics, duration = train_anomaly_model(config)
                version = register_model(
                    model, 'anomaly_detector', 'anomaly',
                    metrics, duration, args.deploy
                )
                results['anomaly_detector'] = {
                    'success': True,
                    'version': version,
                    'metrics': metrics,
                    'duration': duration
                }
            except Exception as e:
                logger.error(f"Anomaly training failed: {e}")
                results['anomaly_detector'] = {
                    'success': False,
                    'error': str(e),
                    'metrics': {},
                    'duration': 0
                }
        
        # Train Risk Scoring
        if args.model in ['all', 'risk']:
            try:
                model, metrics, duration = train_risk_model(config)
                version = register_model(
                    model, 'risk_scorer', 'classification',
                    metrics, duration, args.deploy
                )
                results['risk_scorer'] = {
                    'success': True,
                    'version': version,
                    'metrics': metrics,
                    'duration': duration
                }
            except Exception as e:
                logger.error(f"Risk training failed: {e}")
                results['risk_scorer'] = {
                    'success': False,
                    'error': str(e),
                    'metrics': {},
                    'duration': 0
                }
        
        # Train Forecasting
        if args.model in ['all', 'forecast']:
            try:
                model, metrics, duration = train_forecast_model(config)
                version = register_model(
                    model, 'forecaster', 'time_series',
                    metrics, duration, args.deploy
                )
                results['forecaster'] = {
                    'success': True,
                    'version': version,
                    'metrics': metrics,
                    'duration': duration
                }
            except Exception as e:
                logger.error(f"Forecast training failed: {e}")
                results['forecaster'] = {
                    'success': False,
                    'error': str(e),
                    'metrics': {},
                    'duration': 0
                }
        
        # Generate report
        generate_training_report(results, "reports/training_report.txt")
        
        # Save results as JSON
        with open("reports/training_results.json", "w") as f:
            json.dump(results, f, indent=2)
        
        # Summary
        success_count = sum(1 for r in results.values() if r.get('success', False))
        total_count = len(results)
        
        print("\n" + "="*60)
        if success_count == total_count:
            print("[SUCCESS] ALL MODELS TRAINED SUCCESSFULLY!")
        else:
            print(f"[WARNING] {success_count}/{total_count} models trained successfully")
        print("="*60)
        
        return 0 if success_count == total_count else 1
        
    except Exception as e:
        logger.error(f"Training pipeline failed: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
