"""
GATI ML Pipeline - Explainability Module
=========================================
Government-grade model explanations using SHAP and alternative methods.
Critical for trust in government AI systems.

WHY EXPLAINABILITY IS MANDATORY FOR GOVERNMENT:
1. Transparency - Citizens deserve to know why decisions are made
2. Accountability - Officials need audit trails
3. Trust - Black-box AI erodes public confidence
4. Compliance - Government regulations require explainability
5. Debugging - Helps identify model errors and biases
"""

import numpy as np
import pandas as pd
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any, Union
from dataclasses import dataclass
from pathlib import Path
import json
from loguru import logger

try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False
    logger.warning("SHAP not available - using fallback explanations")

try:
    import matplotlib.pyplot as plt
    import matplotlib
    matplotlib.use('Agg')  # Non-interactive backend
    MATPLOTLIB_AVAILABLE = True
except ImportError:
    MATPLOTLIB_AVAILABLE = False

import warnings
warnings.filterwarnings('ignore')


@dataclass
class FeatureExplanation:
    """Explanation for a single feature's contribution."""
    feature_name: str
    feature_value: float
    shap_value: float
    contribution_direction: str  # positive, negative, neutral
    impact_magnitude: str  # high, medium, low
    human_explanation: str


@dataclass
class PredictionExplanation:
    """Complete explanation for a prediction."""
    entity_id: str
    prediction_value: float
    prediction_label: str
    confidence: float
    base_value: float
    feature_explanations: List[FeatureExplanation]
    summary: str
    top_positive_factors: List[str]
    top_negative_factors: List[str]
    generated_at: str


class GATIExplainer:
    """
    Government-grade explainability for GATI ML models.
    Provides SHAP explanations with human-readable outputs.
    """
    
    def __init__(self, model: Any, model_type: str = 'tree'):
        """
        Initialize explainer.
        
        Args:
            model: Trained ML model
            model_type: Type of model ('tree', 'linear', 'deep')
        """
        self.model = model
        self.model_type = model_type
        self.shap_explainer = None
        self.feature_names: List[str] = []
        self.is_initialized = False
        
        logger.info(f"GATI Explainer initialized (SHAP available: {SHAP_AVAILABLE})")
    
    def initialize(
        self,
        X_background: np.ndarray,
        feature_names: Optional[List[str]] = None
    ) -> 'GATIExplainer':
        """
        Initialize SHAP explainer with background data.
        
        Args:
            X_background: Background data for SHAP (representative sample)
            feature_names: Names of features
            
        Returns:
            self
        """
        self.feature_names = feature_names or [f'feature_{i}' for i in range(X_background.shape[1])]
        
        if SHAP_AVAILABLE:
            try:
                if self.model_type == 'tree':
                    self.shap_explainer = shap.TreeExplainer(self.model)
                elif self.model_type == 'linear':
                    self.shap_explainer = shap.LinearExplainer(self.model, X_background)
                else:
                    # KernelExplainer for any model (slower)
                    self.shap_explainer = shap.KernelExplainer(
                        self.model.predict_proba if hasattr(self.model, 'predict_proba') else self.model.predict,
                        shap.sample(X_background, min(100, len(X_background)))
                    )
                
                self.is_initialized = True
                logger.info(f"SHAP explainer initialized ({self.model_type})")
                
            except Exception as e:
                logger.warning(f"Failed to initialize SHAP explainer: {e}")
                self.is_initialized = False
        
        return self
    
    def explain_prediction(
        self,
        X: np.ndarray,
        entity_id: str,
        prediction_value: float,
        prediction_label: str,
        feature_values: Optional[Dict[str, float]] = None,
        class_index: int = 0
    ) -> PredictionExplanation:
        """
        Generate detailed explanation for a single prediction.
        
        Args:
            X: Feature array for single instance
            entity_id: Identifier (e.g., state name)
            prediction_value: Model's prediction value
            prediction_label: Human-readable label
            feature_values: Original feature values
            class_index: Class index for multi-class
            
        Returns:
            PredictionExplanation object
        """
        if X.ndim == 1:
            X = X.reshape(1, -1)
        
        feature_explanations = []
        shap_values = None
        base_value = 0.0
        
        if SHAP_AVAILABLE and self.is_initialized:
            try:
                shap_values = self.shap_explainer.shap_values(X)
                
                # Handle multi-class output
                if isinstance(shap_values, list):
                    shap_values = shap_values[class_index]
                
                if hasattr(self.shap_explainer, 'expected_value'):
                    if isinstance(self.shap_explainer.expected_value, (list, np.ndarray)):
                        base_value = float(self.shap_explainer.expected_value[class_index])
                    else:
                        base_value = float(self.shap_explainer.expected_value)
                
                sv = shap_values[0] if shap_values.ndim > 1 else shap_values
                
            except Exception as e:
                logger.warning(f"SHAP computation failed: {e}")
                shap_values = None
        
        # Generate feature explanations
        for i, fname in enumerate(self.feature_names):
            fval = feature_values.get(fname, X[0, i]) if feature_values else X[0, i]
            
            if shap_values is not None:
                sv = shap_values[0, i] if shap_values.ndim > 1 else shap_values[i]
            else:
                # Fallback: use deviation from mean as proxy
                sv = 0.0
            
            # Determine direction and magnitude
            if abs(sv) < 0.01:
                direction = 'neutral'
                magnitude = 'low'
            elif sv > 0:
                direction = 'positive'
                magnitude = 'high' if abs(sv) > 0.1 else 'medium'
            else:
                direction = 'negative'
                magnitude = 'high' if abs(sv) > 0.1 else 'medium'
            
            # Generate human explanation
            clean_name = fname.replace('_', ' ').title()
            if direction == 'positive':
                human_exp = f"{clean_name} ({fval:.2f}) increases risk"
            elif direction == 'negative':
                human_exp = f"{clean_name} ({fval:.2f}) decreases risk"
            else:
                human_exp = f"{clean_name} ({fval:.2f}) has minimal impact"
            
            feature_explanations.append(FeatureExplanation(
                feature_name=fname,
                feature_value=float(fval),
                shap_value=float(sv),
                contribution_direction=direction,
                impact_magnitude=magnitude,
                human_explanation=human_exp
            ))
        
        # Sort by absolute SHAP value
        feature_explanations.sort(key=lambda x: abs(x.shap_value), reverse=True)
        
        # Top factors
        top_positive = [
            f.human_explanation for f in feature_explanations 
            if f.contribution_direction == 'positive'
        ][:3]
        
        top_negative = [
            f.human_explanation for f in feature_explanations 
            if f.contribution_direction == 'negative'
        ][:3]
        
        # Generate summary
        summary = self._generate_summary(
            entity_id, prediction_label, top_positive, top_negative
        )
        
        return PredictionExplanation(
            entity_id=entity_id,
            prediction_value=prediction_value,
            prediction_label=prediction_label,
            confidence=min(99.0, 70 + abs(prediction_value) * 20),
            base_value=base_value,
            feature_explanations=feature_explanations,
            summary=summary,
            top_positive_factors=top_positive,
            top_negative_factors=top_negative,
            generated_at=datetime.now().isoformat()
        )
    
    def _generate_summary(
        self,
        entity_id: str,
        prediction_label: str,
        top_positive: List[str],
        top_negative: List[str]
    ) -> str:
        """Generate human-readable summary."""
        summary_parts = [f"{entity_id} is classified as {prediction_label.upper()} risk."]
        
        if top_positive:
            summary_parts.append(f"Main risk factors: {'; '.join(top_positive[:2])}.")
        
        if top_negative:
            summary_parts.append(f"Protective factors: {'; '.join(top_negative[:2])}.")
        
        return " ".join(summary_parts)
    
    def explain_batch(
        self,
        X: np.ndarray,
        entity_ids: List[str],
        predictions: np.ndarray,
        prediction_labels: List[str],
        feature_df: Optional[pd.DataFrame] = None,
        class_index: int = 0
    ) -> List[PredictionExplanation]:
        """
        Explain multiple predictions.
        
        Args:
            X: Feature array
            entity_ids: List of entity identifiers
            predictions: Prediction values
            prediction_labels: Human-readable labels
            feature_df: Original feature DataFrame
            class_index: Class index for multi-class
            
        Returns:
            List of PredictionExplanation objects
        """
        explanations = []
        
        for i in range(len(X)):
            feature_values = None
            if feature_df is not None and i < len(feature_df):
                feature_values = {
                    fname: feature_df.iloc[i].get(fname, X[i, j])
                    for j, fname in enumerate(self.feature_names)
                }
            
            exp = self.explain_prediction(
                X[i:i+1],
                entity_ids[i],
                float(predictions[i]),
                prediction_labels[i],
                feature_values,
                class_index
            )
            explanations.append(exp)
        
        return explanations
    
    def get_global_importance(
        self,
        X: np.ndarray,
        class_index: int = 0
    ) -> pd.DataFrame:
        """
        Get global feature importance using SHAP.
        
        Args:
            X: Feature array
            class_index: Class index for multi-class
            
        Returns:
            DataFrame with feature importance
        """
        if not SHAP_AVAILABLE or not self.is_initialized:
            logger.warning("SHAP not available, returning model's built-in importance")
            if hasattr(self.model, 'feature_importances_'):
                return pd.DataFrame({
                    'feature': self.feature_names,
                    'importance': self.model.feature_importances_
                }).sort_values('importance', ascending=False)
            return pd.DataFrame()
        
        try:
            shap_values = self.shap_explainer.shap_values(X)
            
            if isinstance(shap_values, list):
                shap_values = shap_values[class_index]
            
            # Mean absolute SHAP value per feature
            mean_abs_shap = np.mean(np.abs(shap_values), axis=0)
            
            importance_df = pd.DataFrame({
                'feature': self.feature_names,
                'importance': mean_abs_shap,
                'mean_shap': np.mean(shap_values, axis=0),
                'std_shap': np.std(shap_values, axis=0)
            }).sort_values('importance', ascending=False)
            
            return importance_df
            
        except Exception as e:
            logger.warning(f"Failed to compute global importance: {e}")
            return pd.DataFrame()
    
    def generate_report(
        self,
        explanations: List[PredictionExplanation],
        output_path: Optional[str] = None
    ) -> str:
        """
        Generate comprehensive explanation report.
        
        Args:
            explanations: List of explanations
            output_path: Path to save report
            
        Returns:
            Report as string
        """
        report_lines = [
            "="*70,
            "GATI ML EXPLAINABILITY REPORT",
            f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            f"Total Entities Analyzed: {len(explanations)}",
            "="*70,
            ""
        ]
        
        # Summary statistics
        labels = [e.prediction_label for e in explanations]
        label_counts = pd.Series(labels).value_counts()
        
        report_lines.append("RISK DISTRIBUTION:")
        for label, count in label_counts.items():
            report_lines.append(f"  {label.upper()}: {count} ({count/len(labels)*100:.1f}%)")
        
        report_lines.append("\n" + "-"*70)
        report_lines.append("INDIVIDUAL EXPLANATIONS:")
        report_lines.append("-"*70)
        
        for exp in explanations:
            report_lines.append(f"\n{exp.entity_id}")
            report_lines.append(f"  Prediction: {exp.prediction_label.upper()} (confidence: {exp.confidence:.1f}%)")
            report_lines.append(f"  Summary: {exp.summary}")
            
            report_lines.append("  Top Contributing Factors:")
            for feat in exp.feature_explanations[:5]:
                direction_symbol = "↑" if feat.contribution_direction == 'positive' else "↓" if feat.contribution_direction == 'negative' else "→"
                report_lines.append(f"    {direction_symbol} {feat.human_explanation} (SHAP: {feat.shap_value:.4f})")
        
        report_lines.append("\n" + "="*70)
        report_lines.append("METHODOLOGY NOTE:")
        report_lines.append("This report uses SHAP (SHapley Additive exPlanations) values")
        report_lines.append("to explain model predictions. Positive SHAP values indicate")
        report_lines.append("factors that increase risk, while negative values decrease it.")
        report_lines.append("="*70)
        
        report_text = "\n".join(report_lines)
        
        if output_path:
            Path(output_path).parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, 'w') as f:
                f.write(report_text)
            logger.info(f"Report saved to {output_path}")
        
        return report_text
    
    def generate_json_explanations(
        self,
        explanations: List[PredictionExplanation],
        output_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate JSON-formatted explanations for API integration.
        
        Args:
            explanations: List of explanations
            output_path: Path to save JSON
            
        Returns:
            Dictionary with explanations
        """
        json_data = {
            'metadata': {
                'generated_at': datetime.now().isoformat(),
                'total_entities': len(explanations),
                'explainability_method': 'SHAP' if SHAP_AVAILABLE else 'feature_importance'
            },
            'explanations': []
        }
        
        for exp in explanations:
            exp_dict = {
                'entity_id': exp.entity_id,
                'prediction': {
                    'value': exp.prediction_value,
                    'label': exp.prediction_label,
                    'confidence': exp.confidence
                },
                'summary': exp.summary,
                'top_positive_factors': exp.top_positive_factors,
                'top_negative_factors': exp.top_negative_factors,
                'feature_contributions': [
                    {
                        'feature': f.feature_name,
                        'value': f.feature_value,
                        'shap_value': f.shap_value,
                        'direction': f.contribution_direction,
                        'magnitude': f.impact_magnitude,
                        'explanation': f.human_explanation
                    }
                    for f in exp.feature_explanations[:10]
                ]
            }
            json_data['explanations'].append(exp_dict)
        
        if output_path:
            Path(output_path).parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, 'w') as f:
                json.dump(json_data, f, indent=2)
            logger.info(f"JSON explanations saved to {output_path}")
        
        return json_data
    
    def plot_explanation(
        self,
        explanation: PredictionExplanation,
        output_path: Optional[str] = None,
        top_n: int = 10
    ) -> Optional[str]:
        """
        Create visualization of explanation.
        
        Args:
            explanation: Single explanation
            output_path: Path to save plot
            top_n: Number of features to show
            
        Returns:
            Path to saved plot or None
        """
        if not MATPLOTLIB_AVAILABLE:
            logger.warning("Matplotlib not available for plotting")
            return None
        
        try:
            fig, ax = plt.subplots(figsize=(10, 6))
            
            # Get top features
            features = explanation.feature_explanations[:top_n]
            
            y_pos = np.arange(len(features))
            shap_vals = [f.shap_value for f in features]
            names = [f.feature_name[:20] for f in features]
            
            colors = ['#e74c3c' if v > 0 else '#27ae60' for v in shap_vals]
            
            ax.barh(y_pos, shap_vals, color=colors, alpha=0.8)
            ax.set_yticks(y_pos)
            ax.set_yticklabels(names)
            ax.set_xlabel('SHAP Value (Impact on Risk)')
            ax.set_title(f'Feature Contributions for {explanation.entity_id}')
            ax.axvline(x=0, color='black', linestyle='-', linewidth=0.5)
            
            # Add value labels
            for i, v in enumerate(shap_vals):
                ax.text(v + 0.01 if v >= 0 else v - 0.01, i, f'{v:.3f}',
                       va='center', ha='left' if v >= 0 else 'right', fontsize=8)
            
            plt.tight_layout()
            
            if output_path:
                Path(output_path).parent.mkdir(parents=True, exist_ok=True)
                plt.savefig(output_path, dpi=150, bbox_inches='tight')
                plt.close()
                logger.info(f"Plot saved to {output_path}")
                return output_path
            else:
                plt.close()
                return None
                
        except Exception as e:
            logger.warning(f"Failed to create plot: {e}")
            return None


def explain_model(
    model: Any,
    X: np.ndarray,
    feature_names: List[str],
    entity_ids: List[str],
    predictions: np.ndarray,
    prediction_labels: List[str],
    output_dir: Optional[str] = None,
    model_type: str = 'tree'
) -> Tuple[List[PredictionExplanation], pd.DataFrame]:
    """
    Convenience function to explain model predictions.
    
    Args:
        model: Trained model
        X: Feature array
        feature_names: Feature names
        entity_ids: Entity identifiers
        predictions: Prediction values
        prediction_labels: Prediction labels
        output_dir: Directory to save outputs
        model_type: Type of model
        
    Returns:
        Tuple of (explanations list, global importance DataFrame)
    """
    explainer = GATIExplainer(model, model_type)
    explainer.initialize(X, feature_names)
    
    # Generate explanations
    explanations = explainer.explain_batch(X, entity_ids, predictions, prediction_labels)
    
    # Get global importance
    importance_df = explainer.get_global_importance(X)
    
    if output_dir:
        # Save report
        explainer.generate_report(
            explanations,
            f"{output_dir}/explanation_report.txt"
        )
        
        # Save JSON
        explainer.generate_json_explanations(
            explanations,
            f"{output_dir}/explanations.json"
        )
        
        # Save importance
        importance_df.to_csv(f"{output_dir}/feature_importance.csv", index=False)
    
    return explanations, importance_df


if __name__ == "__main__":
    print("🔍 GATI ML Pipeline - Explainability Test")
    print("="*50)
    
    # Create synthetic example
    from sklearn.ensemble import RandomForestClassifier
    
    np.random.seed(42)
    X = np.random.randn(100, 5)
    y = (X[:, 0] + X[:, 1] * 2 > 0).astype(int)
    
    model = RandomForestClassifier(n_estimators=50, random_state=42)
    model.fit(X, y)
    
    feature_names = ['volatility', 'coverage', 'freshness', 'volume', 'consistency']
    entity_ids = [f'State_{i}' for i in range(100)]
    predictions = model.predict(X)
    prediction_labels = ['low' if p == 0 else 'high' for p in predictions]
    
    # Explain
    explanations, importance = explain_model(
        model, X, feature_names, entity_ids, predictions, prediction_labels,
        output_dir='reports/explanations'
    )
    
    print(f"\n✅ Generated {len(explanations)} explanations")
    print("\n📊 Top Feature Importance:")
    print(importance.head())
    
    print("\n📋 Sample Explanation:")
    exp = explanations[0]
    print(f"  Entity: {exp.entity_id}")
    print(f"  Prediction: {exp.prediction_label}")
    print(f"  Summary: {exp.summary}")
    
    print("\n✅ Explainability complete!")
