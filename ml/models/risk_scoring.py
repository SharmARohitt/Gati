"""
GATI ML Pipeline - Risk Scoring Module
=======================================
Production-grade risk scoring using XGBoost.
Includes feature importance, calibration, and explainability.

WHY XGBOOST:
1. Best-in-class for tabular data
2. Handles missing values natively
3. Built-in feature importance
4. Regularization prevents overfitting
5. Fast training and inference
6. SHAP-compatible for explanations

IMPORTANT NOTE ON LABELS:
Since we don't have ground-truth risk labels, we DERIVE them from data.
This is clearly documented and transparent - not hidden.
The derived labels are based on volatility, coverage gaps, and trend analysis.
"""

import numpy as np
import pandas as pd
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from pathlib import Path
import joblib
import json
from loguru import logger

from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, classification_report, confusion_matrix
)
from sklearn.preprocessing import StandardScaler, LabelEncoder
import xgboost as xgb

try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False
    logger.warning("SHAP not available - explanations will be limited")

import warnings
warnings.filterwarnings('ignore')


@dataclass
class RiskPrediction:
    """Single risk prediction result."""
    entity: str  # State/District name
    risk_score: float  # 0-1 probability
    risk_level: str  # low, medium, high, critical
    confidence: float  # 0-100
    feature_contributions: Dict[str, float]
    top_risk_factors: List[Tuple[str, float, str]]  # (factor, impact, direction)
    explanation: str
    recommendations: List[str]


@dataclass
class RiskModelMetadata:
    """Metadata for trained risk model."""
    model_name: str
    algorithm: str
    version: str
    trained_at: str
    training_samples: int
    features_used: List[str]
    label_source: str  # "derived" - transparency about label origin
    class_distribution: Dict[str, int]
    hyperparameters: Dict[str, Any]
    evaluation_metrics: Dict[str, float]
    feature_importance: Dict[str, float]


class GATIRiskScorer:
    """
    Production-grade risk scorer for GATI platform.
    Uses XGBoost for multi-class risk classification.
    """
    
    RISK_LEVELS = ['low', 'medium', 'high', 'critical']
    RISK_THRESHOLDS = {
        'low': 0.25,
        'medium': 0.50,
        'high': 0.75,
        'critical': 1.00
    }
    
    def __init__(
        self,
        n_estimators: int = 100,
        max_depth: int = 6,
        learning_rate: float = 0.1,
        random_state: int = 42
    ):
        """
        Initialize risk scorer.
        
        Args:
            n_estimators: Number of boosting rounds
            max_depth: Maximum tree depth
            learning_rate: Boosting learning rate
            random_state: For reproducibility
        """
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.learning_rate = learning_rate
        self.random_state = random_state
        
        # XGBoost model
        self.model = xgb.XGBClassifier(
            n_estimators=n_estimators,
            max_depth=max_depth,
            learning_rate=learning_rate,
            random_state=random_state,
            use_label_encoder=False,
            eval_metric='mlogloss',
            n_jobs=-1
        )
        
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.feature_names: List[str] = []
        self.is_fitted = False
        self.metadata: Optional[RiskModelMetadata] = None
        self.shap_explainer = None
        
        logger.info("GATI Risk Scorer initialized")
    
    def derive_risk_labels(
        self,
        df: pd.DataFrame,
        entity_column: str = 'state',
        numeric_columns: Optional[List[str]] = None
    ) -> Tuple[pd.DataFrame, np.ndarray]:
        """
        Derive risk labels from data characteristics.
        
        TRANSPARENCY: This creates derived labels, not ground truth.
        The methodology is documented and reproducible.
        
        Risk factors considered:
        1. Volatility (coefficient of variation)
        2. Trend direction (declining = higher risk)
        3. Volume relative to peers
        4. Data freshness (if available)
        
        Args:
            df: Input DataFrame
            entity_column: Column to group by
            numeric_columns: Columns to analyze
            
        Returns:
            Tuple of (features DataFrame, risk labels array)
        """
        logger.info("Deriving risk labels from data characteristics...")
        
        if numeric_columns is None:
            numeric_columns = df.select_dtypes(include=[np.number]).columns.tolist()
            numeric_columns = [c for c in numeric_columns if c not in [entity_column, 'pincode']]
        
        # Aggregate statistics per entity
        agg_dict = {}
        for col in numeric_columns:
            agg_dict[col] = ['sum', 'mean', 'std', 'min', 'max', 'count']
        
        df_agg = df.groupby(entity_column).agg(agg_dict)
        df_agg.columns = ['_'.join(col).strip() for col in df_agg.columns.values]
        df_agg = df_agg.reset_index()
        
        # Calculate derived risk factors
        risk_scores = np.zeros(len(df_agg))
        
        # Factor 1: Volatility (CV) - Higher = More Risk
        volatility_scores = np.zeros(len(df_agg))
        for col in numeric_columns:
            mean_col = f'{col}_mean'
            std_col = f'{col}_std'
            if mean_col in df_agg.columns and std_col in df_agg.columns:
                cv = df_agg[std_col] / df_agg[mean_col].replace(0, 1)
                volatility_scores += cv.rank(pct=True)
        
        volatility_scores = volatility_scores / len(numeric_columns)
        risk_scores += volatility_scores * 0.3  # 30% weight
        
        # Factor 2: Volume relative to peers - Lower = More Risk
        volume_scores = np.zeros(len(df_agg))
        for col in numeric_columns:
            sum_col = f'{col}_sum'
            if sum_col in df_agg.columns:
                # Inverse rank - lower volume = higher risk
                volume_scores += (1 - df_agg[sum_col].rank(pct=True))
        
        volume_scores = volume_scores / len(numeric_columns)
        risk_scores += volume_scores * 0.25  # 25% weight
        
        # Factor 3: Data consistency - Lower count = Higher Risk
        count_col = f'{numeric_columns[0]}_count'
        if count_col in df_agg.columns:
            consistency_score = 1 - df_agg[count_col].rank(pct=True)
            risk_scores += consistency_score * 0.2  # 20% weight
        
        # Factor 4: Range/Variability - Higher range = Higher risk
        range_scores = np.zeros(len(df_agg))
        for col in numeric_columns:
            min_col = f'{col}_min'
            max_col = f'{col}_max'
            mean_col = f'{col}_mean'
            if all(c in df_agg.columns for c in [min_col, max_col, mean_col]):
                range_ratio = (df_agg[max_col] - df_agg[min_col]) / df_agg[mean_col].replace(0, 1)
                range_scores += range_ratio.rank(pct=True)
        
        range_scores = range_scores / len(numeric_columns)
        risk_scores += range_scores * 0.25  # 25% weight
        
        # Normalize to 0-1
        risk_scores = (risk_scores - risk_scores.min()) / (risk_scores.max() - risk_scores.min() + 1e-8)
        
        # Convert to labels
        risk_labels = np.zeros(len(df_agg), dtype=int)
        risk_labels[risk_scores >= 0.75] = 3  # Critical
        risk_labels[(risk_scores >= 0.50) & (risk_scores < 0.75)] = 2  # High
        risk_labels[(risk_scores >= 0.25) & (risk_scores < 0.50)] = 1  # Medium
        # Labels < 0.25 remain 0 (Low)
        
        # Add to dataframe
        df_agg['derived_risk_score'] = risk_scores
        df_agg['derived_risk_label'] = risk_labels
        df_agg['risk_level'] = [self.RISK_LEVELS[l] for l in risk_labels]
        
        # Log distribution
        label_dist = {
            'low': int(np.sum(risk_labels == 0)),
            'medium': int(np.sum(risk_labels == 1)),
            'high': int(np.sum(risk_labels == 2)),
            'critical': int(np.sum(risk_labels == 3))
        }
        logger.info(f"Derived risk label distribution: {label_dist}")
        
        return df_agg, risk_labels
    
    def prepare_features(
        self,
        df: pd.DataFrame,
        entity_column: str = 'state'
    ) -> Tuple[np.ndarray, List[str]]:
        """
        Prepare feature matrix for training/prediction.
        
        Args:
            df: DataFrame with aggregated features
            entity_column: Column to exclude
            
        Returns:
            Tuple of (feature array, feature names)
        """
        # Select numeric columns except labels and entity
        exclude_cols = [
            entity_column, 'derived_risk_score', 'derived_risk_label', 
            'risk_level', 'risk_score'
        ]
        
        feature_cols = [
            c for c in df.select_dtypes(include=[np.number]).columns 
            if c not in exclude_cols
        ]
        
        X = df[feature_cols].values
        
        # Handle any remaining NaN
        X = np.nan_to_num(X, nan=0, posinf=0, neginf=0)
        
        return X, feature_cols
    
    def fit(
        self,
        X: np.ndarray,
        y: np.ndarray,
        feature_names: List[str],
        entity_names: Optional[List[str]] = None
    ) -> 'GATIRiskScorer':
        """
        Train the risk scoring model.
        
        Args:
            X: Feature array
            y: Risk labels (0-3)
            feature_names: Feature names
            entity_names: Optional entity names
            
        Returns:
            self
        """
        logger.info(f"Training XGBoost risk scorer on {X.shape[0]} samples")
        
        self.feature_names = feature_names
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Encode labels
        y_encoded = self.label_encoder.fit_transform(y)
        
        # Train with cross-validation for stability check
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=self.random_state)
        cv_scores = cross_val_score(self.model, X_scaled, y_encoded, cv=cv, scoring='f1_weighted')
        
        logger.info(f"Cross-validation F1 scores: {cv_scores}")
        logger.info(f"Mean CV F1: {cv_scores.mean():.3f} (+/- {cv_scores.std()*2:.3f})")
        
        # Train final model
        self.model.fit(X_scaled, y_encoded)
        
        self.is_fitted = True
        
        # Get feature importance
        importance = dict(zip(feature_names, self.model.feature_importances_))
        importance = dict(sorted(importance.items(), key=lambda x: x[1], reverse=True))
        
        # Initialize SHAP explainer
        if SHAP_AVAILABLE:
            try:
                self.shap_explainer = shap.TreeExplainer(self.model)
                logger.info("SHAP explainer initialized")
            except Exception as e:
                logger.warning(f"Could not initialize SHAP: {e}")
        
        # Create metadata
        class_dist = {self.RISK_LEVELS[i]: int(np.sum(y == i)) for i in range(4)}
        
        self.metadata = RiskModelMetadata(
            model_name='GATI_RiskScorer',
            algorithm='XGBoost',
            version='1.0.0',
            trained_at=datetime.now().isoformat(),
            training_samples=X.shape[0],
            features_used=feature_names,
            label_source='derived_from_data_characteristics',
            class_distribution=class_dist,
            hyperparameters={
                'n_estimators': self.n_estimators,
                'max_depth': self.max_depth,
                'learning_rate': self.learning_rate,
                'random_state': self.random_state
            },
            evaluation_metrics={
                'cv_f1_mean': float(cv_scores.mean()),
                'cv_f1_std': float(cv_scores.std())
            },
            feature_importance=importance
        )
        
        logger.info("✅ Risk scoring model trained successfully")
        
        return self
    
    def predict(
        self,
        X: np.ndarray,
        return_proba: bool = True
    ) -> Tuple[np.ndarray, Optional[np.ndarray]]:
        """
        Predict risk levels.
        
        Args:
            X: Feature array
            return_proba: Whether to return probabilities
            
        Returns:
            Tuple of (predictions, probabilities)
        """
        if not self.is_fitted:
            raise ValueError("Model not fitted. Call fit() first.")
        
        X_scaled = self.scaler.transform(X)
        
        predictions = self.model.predict(X_scaled)
        predictions = self.label_encoder.inverse_transform(predictions)
        
        probabilities = None
        if return_proba:
            probabilities = self.model.predict_proba(X_scaled)
        
        return predictions, probabilities
    
    def predict_with_explanations(
        self,
        X: np.ndarray,
        entity_names: List[str],
        feature_df: Optional[pd.DataFrame] = None
    ) -> List[RiskPrediction]:
        """
        Predict with full explanations.
        
        Args:
            X: Feature array
            entity_names: Names for each entity
            feature_df: Original feature DataFrame
            
        Returns:
            List of RiskPrediction objects
        """
        predictions, probabilities = self.predict(X, return_proba=True)
        
        # Get SHAP values if available
        shap_values = None
        if SHAP_AVAILABLE and self.shap_explainer is not None:
            try:
                X_scaled = self.scaler.transform(X)
                shap_values = self.shap_explainer.shap_values(X_scaled)
            except Exception as e:
                logger.warning(f"Could not compute SHAP values: {e}")
        
        results = []
        
        for i in range(len(predictions)):
            risk_label = int(predictions[i])
            risk_level = self.RISK_LEVELS[risk_label]
            
            # Get probability for predicted class
            risk_score = float(probabilities[i][risk_label])
            confidence = risk_score * 100
            
            # Feature contributions
            feature_contributions = {}
            top_factors = []
            
            if shap_values is not None:
                # Use SHAP values for the predicted class
                if isinstance(shap_values, list):
                    sv = shap_values[risk_label][i]
                else:
                    sv = shap_values[i]
                
                for j, fname in enumerate(self.feature_names):
                    feature_contributions[fname] = float(sv[j])
                
                # Top contributing factors
                sorted_features = sorted(
                    zip(self.feature_names, sv),
                    key=lambda x: abs(x[1]),
                    reverse=True
                )
                
                for fname, impact in sorted_features[:5]:
                    direction = "increases" if impact > 0 else "decreases"
                    top_factors.append((fname, abs(float(impact)), direction))
            else:
                # Fall back to feature importance
                for fname in self.feature_names[:5]:
                    imp = self.metadata.feature_importance.get(fname, 0) if self.metadata else 0
                    top_factors.append((fname, float(imp), "contributes"))
            
            # Generate explanation
            explanation = self._generate_explanation(
                entity_names[i], risk_level, risk_score, top_factors
            )
            
            # Generate recommendations
            recommendations = self._generate_recommendations(risk_level, top_factors)
            
            result = RiskPrediction(
                entity=entity_names[i],
                risk_score=risk_score,
                risk_level=risk_level,
                confidence=confidence,
                feature_contributions=feature_contributions,
                top_risk_factors=top_factors,
                explanation=explanation,
                recommendations=recommendations
            )
            
            results.append(result)
        
        return results
    
    def _generate_explanation(
        self,
        entity: str,
        risk_level: str,
        risk_score: float,
        top_factors: List[Tuple[str, float, str]]
    ) -> str:
        """Generate human-readable explanation."""
        severity_text = {
            'low': 'minimal risk',
            'medium': 'moderate risk requiring monitoring',
            'high': 'elevated risk requiring attention',
            'critical': 'critical risk requiring immediate action'
        }
        
        explanation = f"{entity} shows {severity_text[risk_level]} (score: {risk_score:.2f}). "
        
        if top_factors:
            factor_parts = []
            for fname, impact, direction in top_factors[:3]:
                clean_name = fname.replace('_', ' ').title()
                factor_parts.append(f"{clean_name} {direction} risk")
            
            explanation += "Key factors: " + "; ".join(factor_parts) + "."
        
        return explanation
    
    def _generate_recommendations(
        self,
        risk_level: str,
        top_factors: List[Tuple[str, float, str]]
    ) -> List[str]:
        """Generate actionable recommendations."""
        recommendations = []
        
        if risk_level == 'critical':
            recommendations.append("IMMEDIATE: Initiate field verification within 48 hours")
            recommendations.append("ALERT: Notify regional coordinator for direct oversight")
        elif risk_level == 'high':
            recommendations.append("PRIORITY: Schedule audit within 1 week")
            recommendations.append("MONITOR: Enable daily tracking for this region")
        elif risk_level == 'medium':
            recommendations.append("REVIEW: Include in monthly review cycle")
            recommendations.append("TRACK: Monitor key metrics weekly")
        else:
            recommendations.append("MAINTAIN: Continue standard monitoring")
        
        # Factor-specific recommendations
        for fname, impact, direction in top_factors[:2]:
            if 'std' in fname or 'cv' in fname:
                recommendations.append(f"INVESTIGATE: High variability in {fname.split('_')[0]} metrics")
            if 'count' in fname and direction == 'decreases':
                recommendations.append(f"ATTENTION: Data collection frequency may be declining")
        
        return recommendations
    
    def evaluate(
        self,
        X: np.ndarray,
        y_true: np.ndarray,
        entity_names: Optional[List[str]] = None
    ) -> Dict[str, float]:
        """
        Comprehensive model evaluation.
        
        Args:
            X: Feature array
            y_true: True labels
            entity_names: Optional entity names
            
        Returns:
            Dictionary of evaluation metrics
        """
        if not self.is_fitted:
            raise ValueError("Model not fitted")
        
        y_pred, y_proba = self.predict(X, return_proba=True)
        
        metrics = {}
        
        # Basic metrics
        metrics['accuracy'] = float(accuracy_score(y_true, y_pred))
        metrics['precision_weighted'] = float(precision_score(y_true, y_pred, average='weighted', zero_division=0))
        metrics['recall_weighted'] = float(recall_score(y_true, y_pred, average='weighted', zero_division=0))
        metrics['f1_weighted'] = float(f1_score(y_true, y_pred, average='weighted', zero_division=0))
        
        # Per-class metrics
        for i, level in enumerate(self.RISK_LEVELS):
            y_binary = (y_true == i).astype(int)
            y_pred_binary = (y_pred == i).astype(int)
            
            metrics[f'precision_{level}'] = float(precision_score(y_binary, y_pred_binary, zero_division=0))
            metrics[f'recall_{level}'] = float(recall_score(y_binary, y_pred_binary, zero_division=0))
            metrics[f'f1_{level}'] = float(f1_score(y_binary, y_pred_binary, zero_division=0))
        
        # Multi-class AUC if possible
        try:
            if y_proba is not None and len(np.unique(y_true)) > 1:
                metrics['auc_roc_ovr'] = float(roc_auc_score(y_true, y_proba, multi_class='ovr'))
        except Exception as e:
            logger.warning(f"Could not compute AUC: {e}")
        
        # Update metadata
        if self.metadata:
            self.metadata.evaluation_metrics.update(metrics)
        
        # Print report
        print("\n📊 RISK SCORING MODEL EVALUATION")
        print("="*60)
        print(f"Overall Accuracy: {metrics['accuracy']*100:.1f}%")
        print(f"Weighted F1 Score: {metrics['f1_weighted']:.3f}")
        print(f"Weighted Precision: {metrics['precision_weighted']:.3f}")
        print(f"Weighted Recall: {metrics['recall_weighted']:.3f}")
        print("\nPer-Class Performance:")
        for level in self.RISK_LEVELS:
            print(f"  {level.capitalize():10} - P: {metrics[f'precision_{level}']:.3f}, R: {metrics[f'recall_{level}']:.3f}, F1: {metrics[f'f1_{level}']:.3f}")
        print("="*60)
        
        # Confusion matrix
        print("\nConfusion Matrix:")
        cm = confusion_matrix(y_true, y_pred)
        print("              Predicted")
        print("             ", "  ".join([f"{l[:4]:>6}" for l in self.RISK_LEVELS]))
        for i, level in enumerate(self.RISK_LEVELS):
            print(f"Actual {level[:4]:>4}", "  ".join([f"{cm[i,j]:>6}" for j in range(len(self.RISK_LEVELS))]))
        
        print("\n⚠️  IMPORTANT NOTE:")
        print("   Labels are DERIVED from data characteristics, not ground truth.")
        print("   Metrics reflect model's ability to learn derived patterns.")
        
        return metrics
    
    def get_feature_importance(self, top_n: int = 10) -> pd.DataFrame:
        """Get feature importance ranking."""
        if not self.is_fitted:
            raise ValueError("Model not fitted")
        
        importance = dict(zip(self.feature_names, self.model.feature_importances_))
        
        df = pd.DataFrame([
            {'feature': k, 'importance': v}
            for k, v in sorted(importance.items(), key=lambda x: x[1], reverse=True)
        ])
        
        print("\n📊 TOP FEATURE IMPORTANCE")
        print("="*50)
        for _, row in df.head(top_n).iterrows():
            bar = "█" * int(row['importance'] * 50)
            print(f"{row['feature'][:30]:30} {row['importance']:.4f} {bar}")
        print("="*50)
        
        return df
    
    def save(self, filepath: str) -> None:
        """Save model and metadata."""
        save_dict = {
            'model': self.model,
            'scaler': self.scaler,
            'label_encoder': self.label_encoder,
            'feature_names': self.feature_names,
            'metadata': self.metadata,
            'config': {
                'n_estimators': self.n_estimators,
                'max_depth': self.max_depth,
                'learning_rate': self.learning_rate,
                'random_state': self.random_state
            }
        }
        
        Path(filepath).parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(save_dict, filepath)
        
        # Save metadata as JSON
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
                    'label_source': self.metadata.label_source,
                    'class_distribution': self.metadata.class_distribution,
                    'hyperparameters': self.metadata.hyperparameters,
                    'evaluation_metrics': self.metadata.evaluation_metrics,
                    'feature_importance': self.metadata.feature_importance
                }, f, indent=2)
        
        logger.info(f"Model saved to {filepath}")
    
    @classmethod
    def load(cls, filepath: str) -> 'GATIRiskScorer':
        """Load model from file."""
        save_dict = joblib.load(filepath)
        
        config = save_dict['config']
        scorer = cls(
            n_estimators=config['n_estimators'],
            max_depth=config['max_depth'],
            learning_rate=config['learning_rate'],
            random_state=config['random_state']
        )
        
        scorer.model = save_dict['model']
        scorer.scaler = save_dict['scaler']
        scorer.label_encoder = save_dict['label_encoder']
        scorer.feature_names = save_dict['feature_names']
        scorer.metadata = save_dict['metadata']
        scorer.is_fitted = True
        
        # Re-initialize SHAP
        if SHAP_AVAILABLE:
            try:
                scorer.shap_explainer = shap.TreeExplainer(scorer.model)
            except:
                pass
        
        logger.info(f"Model loaded from {filepath}")
        
        return scorer


def train_risk_scorer(
    df: pd.DataFrame,
    entity_column: str = 'state',
    numeric_columns: Optional[List[str]] = None,
    save_path: Optional[str] = None
) -> Tuple[GATIRiskScorer, Dict[str, float]]:
    """
    Convenience function to train and evaluate risk scorer.
    
    Args:
        df: Input DataFrame
        entity_column: Column to group by
        numeric_columns: Columns to use
        save_path: Path to save model
        
    Returns:
        Tuple of (trained scorer, evaluation metrics)
    """
    scorer = GATIRiskScorer()
    
    # Derive labels
    df_features, labels = scorer.derive_risk_labels(df, entity_column, numeric_columns)
    
    # Prepare features
    X, feature_names = scorer.prepare_features(df_features, entity_column)
    entity_names = df_features[entity_column].tolist()
    
    # Train
    scorer.fit(X, labels, feature_names, entity_names)
    
    # Evaluate
    metrics = scorer.evaluate(X, labels, entity_names)
    
    # Feature importance
    scorer.get_feature_importance()
    
    # Save
    if save_path:
        scorer.save(save_path)
    
    return scorer, metrics


if __name__ == "__main__":
    # Test risk scoring
    import sys
    sys.path.append('..')
    from data_loader import GATIDataLoader
    from preprocessing import GATIPreprocessor
    
    print("⚠️ GATI ML Pipeline - Risk Scoring Test")
    print("="*50)
    
    # Load data
    loader = GATIDataLoader()
    df = loader.load_dataset('enrolment')
    
    # Preprocess
    preprocessor = GATIPreprocessor()
    df_clean = preprocessor.clean_data(df)
    
    numeric_cols = ['age_0_5', 'age_5_17', 'age_18_greater']
    
    print(f"\n📊 Data: {len(df_clean)} records")
    
    # Train
    scorer, metrics = train_risk_scorer(
        df_clean,
        entity_column='state',
        numeric_columns=numeric_cols,
        save_path='saved_models/risk_scorer_v1.joblib'
    )
    
    # Predict with explanations
    df_features, _ = scorer.derive_risk_labels(df_clean, 'state', numeric_cols)
    X, feature_names = scorer.prepare_features(df_features, 'state')
    entity_names = df_features['state'].tolist()
    
    predictions = scorer.predict_with_explanations(X, entity_names, df_features)
    
    print("\n📋 Sample Risk Predictions:")
    for pred in predictions[:5]:
        print(f"\n  🏛️ {pred.entity}")
        print(f"     Risk: {pred.risk_level.upper()} (score: {pred.risk_score:.2f})")
        print(f"     {pred.explanation}")
        print(f"     Recommendations: {pred.recommendations[0]}")
    
    print("\n✅ Risk scoring complete!")
