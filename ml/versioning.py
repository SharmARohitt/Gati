"""
GATI ML Pipeline - Model Versioning & Registry
===============================================
Track, version, and manage ML models for production deployment.
Critical for government compliance and audit trails.

WHY MODEL VERSIONING IS ESSENTIAL:
1. Reproducibility - Recreate any past prediction
2. Audit Trail - Required for government systems
3. Rollback - Revert to previous versions if issues
4. A/B Testing - Compare model versions
5. Compliance - Regulatory requirements for model governance
"""

import os
import json
import hashlib
import shutil
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field, asdict
from loguru import logger
import joblib

import warnings
warnings.filterwarnings('ignore')


@dataclass
class ModelVersion:
    """Represents a single model version."""
    version: str  # e.g., "1.0.0"
    model_name: str
    model_type: str  # 'anomaly', 'risk', 'forecast'
    created_at: str
    created_by: str
    description: str
    
    # Performance metrics
    metrics: Dict[str, float] = field(default_factory=dict)
    
    # Training info
    training_data_hash: str = ""
    training_samples: int = 0
    feature_count: int = 0
    training_duration_seconds: float = 0.0
    
    # File paths (relative to model directory)
    model_file: str = ""
    metadata_file: str = ""
    
    # Status
    status: str = "active"  # active, deprecated, archived
    is_production: bool = False
    
    # Tags for filtering
    tags: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class ModelRegistry:
    """Registry of all model versions."""
    models: Dict[str, List[ModelVersion]] = field(default_factory=dict)
    current_production: Dict[str, str] = field(default_factory=dict)  # model_name -> version
    last_updated: str = ""
    
    def to_dict(self) -> Dict:
        return {
            'models': {name: [v.to_dict() for v in versions] 
                      for name, versions in self.models.items()},
            'current_production': self.current_production,
            'last_updated': self.last_updated
        }


class GATIModelVersioning:
    """
    Model versioning and registry system for GATI.
    Provides full lifecycle management for ML models.
    """
    
    def __init__(self, base_dir: str = "models"):
        """
        Initialize versioning system.
        
        Args:
            base_dir: Base directory for model storage
        """
        self.base_dir = Path(base_dir)
        self.registry_file = self.base_dir / "registry.json"
        self.registry = self._load_registry()
        
        # Ensure directories exist
        self.base_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"GATI Model Versioning initialized at {self.base_dir}")
    
    def _load_registry(self) -> ModelRegistry:
        """Load registry from file."""
        if self.registry_file.exists():
            try:
                with open(self.registry_file, 'r') as f:
                    data = json.load(f)
                
                registry = ModelRegistry()
                registry.current_production = data.get('current_production', {})
                registry.last_updated = data.get('last_updated', '')
                
                for name, versions in data.get('models', {}).items():
                    registry.models[name] = [
                        ModelVersion(**v) for v in versions
                    ]
                
                return registry
            except Exception as e:
                logger.warning(f"Failed to load registry: {e}")
        
        return ModelRegistry()
    
    def _save_registry(self) -> None:
        """Save registry to file."""
        self.registry.last_updated = datetime.now().isoformat()
        
        with open(self.registry_file, 'w') as f:
            json.dump(self.registry.to_dict(), f, indent=2)
        
        logger.debug("Registry saved")
    
    def _get_next_version(self, model_name: str, bump: str = 'patch') -> str:
        """
        Get next version number.
        
        Args:
            model_name: Name of the model
            bump: 'major', 'minor', or 'patch'
            
        Returns:
            Version string
        """
        if model_name not in self.registry.models or not self.registry.models[model_name]:
            return "1.0.0"
        
        # Get latest version
        latest = self.registry.models[model_name][-1].version
        major, minor, patch = map(int, latest.split('.'))
        
        if bump == 'major':
            return f"{major + 1}.0.0"
        elif bump == 'minor':
            return f"{major}.{minor + 1}.0"
        else:
            return f"{major}.{minor}.{patch + 1}"
    
    def _compute_data_hash(self, data: Any) -> str:
        """Compute hash of training data for tracking."""
        if hasattr(data, 'values'):
            data = data.values
        
        data_bytes = str(data.shape).encode() + str(data.mean()).encode()
        return hashlib.md5(data_bytes).hexdigest()[:12]
    
    def register_model(
        self,
        model: Any,
        model_name: str,
        model_type: str,
        description: str,
        metrics: Dict[str, float],
        training_data: Optional[Any] = None,
        training_samples: int = 0,
        feature_count: int = 0,
        training_duration: float = 0.0,
        created_by: str = "system",
        bump: str = 'patch',
        tags: Optional[List[str]] = None
    ) -> ModelVersion:
        """
        Register a new model version.
        
        Args:
            model: Trained model object
            model_name: Name of the model
            model_type: Type of model
            description: Description of changes
            metrics: Performance metrics
            training_data: Training data (for hash)
            training_samples: Number of training samples
            feature_count: Number of features
            training_duration: Training time in seconds
            created_by: Who created the model
            bump: Version bump type
            tags: Optional tags
            
        Returns:
            ModelVersion object
        """
        version_str = self._get_next_version(model_name, bump)
        
        # Create model directory
        model_dir = self.base_dir / model_name / version_str
        model_dir.mkdir(parents=True, exist_ok=True)
        
        # Save model
        model_file = f"model.joblib"
        model_path = model_dir / model_file
        joblib.dump(model, model_path)
        
        # Compute data hash
        data_hash = ""
        if training_data is not None:
            data_hash = self._compute_data_hash(training_data)
        
        # Create version object
        version = ModelVersion(
            version=version_str,
            model_name=model_name,
            model_type=model_type,
            created_at=datetime.now().isoformat(),
            created_by=created_by,
            description=description,
            metrics=metrics,
            training_data_hash=data_hash,
            training_samples=training_samples,
            feature_count=feature_count,
            training_duration_seconds=training_duration,
            model_file=model_file,
            metadata_file="metadata.json",
            tags=tags or []
        )
        
        # Save metadata
        metadata_path = model_dir / "metadata.json"
        with open(metadata_path, 'w') as f:
            json.dump(version.to_dict(), f, indent=2)
        
        # Update registry
        if model_name not in self.registry.models:
            self.registry.models[model_name] = []
        
        self.registry.models[model_name].append(version)
        self._save_registry()
        
        logger.info(f"Registered model {model_name} v{version_str}")
        return version
    
    def load_model(
        self,
        model_name: str,
        version: Optional[str] = None
    ) -> Tuple[Any, ModelVersion]:
        """
        Load a model by name and version.
        
        Args:
            model_name: Name of the model
            version: Version to load (default: production or latest)
            
        Returns:
            Tuple of (model, version_info)
        """
        if model_name not in self.registry.models:
            raise ValueError(f"Model {model_name} not found in registry")
        
        # Get version
        if version is None:
            # Try production first, then latest
            if model_name in self.registry.current_production:
                version = self.registry.current_production[model_name]
            else:
                version = self.registry.models[model_name][-1].version
        
        # Find version
        version_info = None
        for v in self.registry.models[model_name]:
            if v.version == version:
                version_info = v
                break
        
        if version_info is None:
            raise ValueError(f"Version {version} not found for model {model_name}")
        
        # Load model
        model_path = self.base_dir / model_name / version / version_info.model_file
        model = joblib.load(model_path)
        
        logger.info(f"Loaded model {model_name} v{version}")
        return model, version_info
    
    def promote_to_production(self, model_name: str, version: str) -> None:
        """
        Promote a model version to production.
        
        Args:
            model_name: Name of the model
            version: Version to promote
        """
        if model_name not in self.registry.models:
            raise ValueError(f"Model {model_name} not found")
        
        # Find and update version
        found = False
        for v in self.registry.models[model_name]:
            if v.version == version:
                v.is_production = True
                found = True
            else:
                v.is_production = False
        
        if not found:
            raise ValueError(f"Version {version} not found")
        
        self.registry.current_production[model_name] = version
        self._save_registry()
        
        logger.info(f"Promoted {model_name} v{version} to production")
    
    def deprecate_version(self, model_name: str, version: str) -> None:
        """Mark a version as deprecated."""
        for v in self.registry.models.get(model_name, []):
            if v.version == version:
                v.status = 'deprecated'
                break
        
        self._save_registry()
        logger.info(f"Deprecated {model_name} v{version}")
    
    def list_versions(
        self,
        model_name: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[ModelVersion]:
        """
        List model versions.
        
        Args:
            model_name: Filter by model name
            status: Filter by status
            
        Returns:
            List of ModelVersion objects
        """
        versions = []
        
        for name, v_list in self.registry.models.items():
            if model_name and name != model_name:
                continue
            
            for v in v_list:
                if status and v.status != status:
                    continue
                versions.append(v)
        
        return versions
    
    def get_production_models(self) -> Dict[str, Tuple[Any, ModelVersion]]:
        """
        Load all production models.
        
        Returns:
            Dictionary of {model_name: (model, version_info)}
        """
        production_models = {}
        
        for model_name, version in self.registry.current_production.items():
            try:
                model, info = self.load_model(model_name, version)
                production_models[model_name] = (model, info)
            except Exception as e:
                logger.warning(f"Failed to load production model {model_name}: {e}")
        
        return production_models
    
    def compare_versions(
        self,
        model_name: str,
        version1: str,
        version2: str
    ) -> Dict[str, Any]:
        """
        Compare two model versions.
        
        Args:
            model_name: Name of the model
            version1, version2: Versions to compare
            
        Returns:
            Comparison dictionary
        """
        v1 = None
        v2 = None
        
        for v in self.registry.models.get(model_name, []):
            if v.version == version1:
                v1 = v
            elif v.version == version2:
                v2 = v
        
        if not v1 or not v2:
            raise ValueError("One or both versions not found")
        
        comparison = {
            'version1': version1,
            'version2': version2,
            'created_at_diff': (
                datetime.fromisoformat(v2.created_at) - 
                datetime.fromisoformat(v1.created_at)
            ).days,
            'metrics_comparison': {},
            'training_samples_diff': v2.training_samples - v1.training_samples,
            'feature_count_diff': v2.feature_count - v1.feature_count
        }
        
        # Compare metrics
        all_metrics = set(v1.metrics.keys()) | set(v2.metrics.keys())
        for metric in all_metrics:
            val1 = v1.metrics.get(metric, 0)
            val2 = v2.metrics.get(metric, 0)
            comparison['metrics_comparison'][metric] = {
                'v1': val1,
                'v2': val2,
                'diff': val2 - val1,
                'improved': val2 > val1
            }
        
        return comparison
    
    def export_lineage(self, model_name: str, output_path: str) -> None:
        """
        Export model lineage for compliance.
        
        Args:
            model_name: Name of the model
            output_path: Path to save lineage report
        """
        if model_name not in self.registry.models:
            raise ValueError(f"Model {model_name} not found")
        
        lineage = {
            'model_name': model_name,
            'generated_at': datetime.now().isoformat(),
            'total_versions': len(self.registry.models[model_name]),
            'current_production': self.registry.current_production.get(model_name),
            'version_history': []
        }
        
        for v in self.registry.models[model_name]:
            lineage['version_history'].append({
                'version': v.version,
                'created_at': v.created_at,
                'created_by': v.created_by,
                'description': v.description,
                'status': v.status,
                'is_production': v.is_production,
                'training_data_hash': v.training_data_hash,
                'training_samples': v.training_samples,
                'metrics': v.metrics
            })
        
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'w') as f:
            json.dump(lineage, f, indent=2)
        
        logger.info(f"Lineage exported to {output_path}")
    
    def cleanup_old_versions(
        self,
        model_name: str,
        keep_last_n: int = 5,
        keep_production: bool = True
    ) -> int:
        """
        Clean up old model versions to save space.
        
        Args:
            model_name: Name of the model
            keep_last_n: Number of recent versions to keep
            keep_production: Always keep production version
            
        Returns:
            Number of versions removed
        """
        if model_name not in self.registry.models:
            return 0
        
        versions = self.registry.models[model_name]
        production_version = self.registry.current_production.get(model_name)
        
        # Determine which to keep
        to_keep = versions[-keep_last_n:]
        to_remove = [v for v in versions if v not in to_keep]
        
        # Always keep production
        if keep_production and production_version:
            to_remove = [v for v in to_remove if v.version != production_version]
        
        removed = 0
        for v in to_remove:
            try:
                # Remove directory
                version_dir = self.base_dir / model_name / v.version
                if version_dir.exists():
                    shutil.rmtree(version_dir)
                
                # Remove from registry
                self.registry.models[model_name].remove(v)
                removed += 1
                
            except Exception as e:
                logger.warning(f"Failed to remove version {v.version}: {e}")
        
        self._save_registry()
        logger.info(f"Cleaned up {removed} versions of {model_name}")
        return removed
    
    def generate_summary(self) -> str:
        """Generate summary of all registered models."""
        lines = [
            "="*60,
            "GATI MODEL REGISTRY SUMMARY",
            f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "="*60,
            ""
        ]
        
        total_models = len(self.registry.models)
        total_versions = sum(len(v) for v in self.registry.models.values())
        
        lines.append(f"Total Models: {total_models}")
        lines.append(f"Total Versions: {total_versions}")
        lines.append("")
        
        for name, versions in self.registry.models.items():
            lines.append(f"📦 {name}")
            lines.append(f"   Versions: {len(versions)}")
            
            if versions:
                latest = versions[-1]
                lines.append(f"   Latest: v{latest.version} ({latest.created_at[:10]})")
                
                prod = self.registry.current_production.get(name)
                if prod:
                    lines.append(f"   Production: v{prod}")
                
                if latest.metrics:
                    metric_str = ", ".join(f"{k}={v:.4f}" for k, v in list(latest.metrics.items())[:3])
                    lines.append(f"   Metrics: {metric_str}")
            
            lines.append("")
        
        return "\n".join(lines)


if __name__ == "__main__":
    print("📦 GATI ML Pipeline - Versioning Test")
    print("="*50)
    
    from sklearn.ensemble import RandomForestClassifier
    import numpy as np
    
    # Initialize versioning
    versioning = GATIModelVersioning("test_models")
    
    # Create and register model v1
    X = np.random.randn(100, 5)
    y = (X[:, 0] > 0).astype(int)
    
    model_v1 = RandomForestClassifier(n_estimators=50, random_state=42)
    model_v1.fit(X, y)
    
    v1 = versioning.register_model(
        model=model_v1,
        model_name="risk_scorer",
        model_type="classification",
        description="Initial risk scoring model",
        metrics={'accuracy': 0.85, 'f1': 0.82},
        training_data=X,
        training_samples=100,
        feature_count=5,
        training_duration=1.5,
        created_by="developer"
    )
    print(f"\n✅ Registered: risk_scorer v{v1.version}")
    
    # Register improved model v2
    model_v2 = RandomForestClassifier(n_estimators=100, random_state=42)
    model_v2.fit(X, y)
    
    v2 = versioning.register_model(
        model=model_v2,
        model_name="risk_scorer",
        model_type="classification",
        description="Improved with more trees",
        metrics={'accuracy': 0.88, 'f1': 0.86},
        training_data=X,
        training_samples=100,
        feature_count=5,
        training_duration=2.1,
        created_by="developer",
        bump='minor'
    )
    print(f"✅ Registered: risk_scorer v{v2.version}")
    
    # Promote to production
    versioning.promote_to_production("risk_scorer", v2.version)
    print(f"✅ Promoted v{v2.version} to production")
    
    # Load production model
    loaded_model, info = versioning.load_model("risk_scorer")
    print(f"\n📥 Loaded production model: v{info.version}")
    print(f"   Accuracy: {info.metrics['accuracy']:.4f}")
    
    # Compare versions
    comparison = versioning.compare_versions("risk_scorer", v1.version, v2.version)
    print(f"\n📊 Version Comparison:")
    for metric, data in comparison['metrics_comparison'].items():
        improved = "✅" if data['improved'] else "⬇️"
        print(f"   {metric}: {data['v1']:.4f} → {data['v2']:.4f} {improved}")
    
    # List versions
    print(f"\n📋 All Versions:")
    for v in versioning.list_versions():
        prod = "🚀" if v.is_production else "  "
        print(f"   {prod} {v.model_name} v{v.version} [{v.status}]")
    
    # Summary
    print("\n" + versioning.generate_summary())
    
    # Cleanup
    shutil.rmtree("test_models", ignore_errors=True)
    print("\n✅ Versioning test complete!")
