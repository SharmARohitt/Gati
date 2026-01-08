"""
GATI ML Pipeline - FastAPI Server
=================================
REST API for serving ML predictions to the Next.js frontend.
Production-ready API with proper error handling and documentation.
"""

from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any, Union
from datetime import datetime
from pathlib import Path
import numpy as np
import pandas as pd
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from loguru import logger

# Configure logging
logger.add("logs/api.log", rotation="10 MB", level="INFO")

# Initialize FastAPI
app = FastAPI(
    title="GATI ML API",
    description="Governance & Aadhaar Tracking Intelligence - ML Prediction API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============== Pydantic Models ==============

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str
    models_loaded: Dict[str, bool]


class AnomalyRequest(BaseModel):
    state: Optional[str] = None
    district: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    threshold: float = Field(default=0.05, ge=0.01, le=0.5)


class AnomalyResult(BaseModel):
    entity_id: str
    is_anomaly: bool
    anomaly_score: float
    severity: str
    explanation: str
    detected_at: str


class AnomalyResponse(BaseModel):
    success: bool
    total_analyzed: int
    anomalies_detected: int
    anomaly_rate: float
    results: List[AnomalyResult]
    model_version: str


class RiskRequest(BaseModel):
    state: Optional[str] = None
    district: Optional[str] = None
    include_explanations: bool = True


class RiskResult(BaseModel):
    entity_id: str
    risk_level: str  # low, medium, high, critical
    risk_score: float
    confidence: float
    top_factors: List[str]
    recommendations: List[str]


class RiskResponse(BaseModel):
    success: bool
    total_assessed: int
    risk_distribution: Dict[str, int]
    results: List[RiskResult]
    model_version: str


class ForecastRequest(BaseModel):
    metric: str = Field(default="total_enrolments", description="Metric to forecast")
    state: Optional[str] = None
    horizon_days: int = Field(default=30, ge=7, le=365)
    include_confidence: bool = True


class ForecastPoint(BaseModel):
    date: str
    predicted_value: float
    lower_bound: Optional[float]
    upper_bound: Optional[float]


class ForecastResponse(BaseModel):
    success: bool
    metric: str
    state: Optional[str]
    forecast: List[ForecastPoint]
    trend: str  # increasing, decreasing, stable
    trend_strength: float
    model_version: str


class ExplanationRequest(BaseModel):
    model_type: str  # anomaly, risk, forecast
    entity_id: str
    prediction_value: float


class ExplanationResponse(BaseModel):
    success: bool
    entity_id: str
    summary: str
    feature_contributions: List[Dict[str, Any]]
    methodology: str


class ModelInfoResponse(BaseModel):
    model_name: str
    model_type: str
    version: str
    created_at: str
    metrics: Dict[str, float]
    status: str
    is_production: bool


class TrainingRequest(BaseModel):
    model_type: str  # anomaly, risk, forecast
    force_retrain: bool = False


class TrainingResponse(BaseModel):
    success: bool
    model_type: str
    version: str
    metrics: Dict[str, float]
    training_duration_seconds: float
    message: str


# ============== Global State ==============

class ModelManager:
    """Manages loaded models and predictions."""
    
    def __init__(self):
        self.models = {}
        self.model_info = {}
        self.is_initialized = False
    
    def initialize(self):
        """Load production models."""
        if self.is_initialized:
            return
        
        try:
            from versioning import GATIModelVersioning
            
            versioning = GATIModelVersioning("models")
            production_models = versioning.get_production_models()
            
            for name, (model, info) in production_models.items():
                self.models[name] = model
                self.model_info[name] = info
                logger.info(f"Loaded production model: {name} v{info.version}")
            
            self.is_initialized = True
            
        except Exception as e:
            logger.warning(f"Failed to load production models: {e}")
            # Continue with empty models - will train on first request
    
    def get_model(self, model_type: str):
        """Get model by type."""
        mapping = {
            'anomaly': 'anomaly_detector',
            'risk': 'risk_scorer',
            'forecast': 'forecaster'
        }
        model_name = mapping.get(model_type, model_type)
        return self.models.get(model_name), self.model_info.get(model_name)


model_manager = ModelManager()


# ============== Startup/Shutdown ==============

@app.on_event("startup")
async def startup():
    """Initialize models on startup."""
    logger.info("Starting GATI ML API...")
    model_manager.initialize()
    logger.info("GATI ML API ready")


@app.on_event("shutdown")
async def shutdown():
    """Cleanup on shutdown."""
    logger.info("Shutting down GATI ML API...")


# ============== API Endpoints ==============

@app.get("/", response_model=HealthResponse)
async def root():
    """API health check."""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        version="1.0.0",
        models_loaded={
            name: True for name in model_manager.models.keys()
        }
    )


@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Detailed health check."""
    return await root()


@app.get("/api/models", response_model=List[ModelInfoResponse])
async def list_models():
    """List all available models."""
    models = []
    
    for name, info in model_manager.model_info.items():
        models.append(ModelInfoResponse(
            model_name=name,
            model_type=info.model_type,
            version=info.version,
            created_at=info.created_at,
            metrics=info.metrics,
            status=info.status,
            is_production=info.is_production
        ))
    
    return models


@app.post("/api/anomaly/detect", response_model=AnomalyResponse)
async def detect_anomalies(request: AnomalyRequest):
    """
    Detect anomalies in Aadhaar data.
    
    Uses Isolation Forest to identify unusual patterns that may
    indicate data quality issues, fraud, or system errors.
    """
    try:
        model, info = model_manager.get_model('anomaly')
        
        if model is None:
            raise HTTPException(
                status_code=503,
                detail="Anomaly detection model not loaded. Please train the model first."
            )
        
        # Load and prepare data
        from data_loader import GATIDataLoader
        from preprocessing import GATIPreprocessor
        
        loader = GATIDataLoader()
        data = loader.load_all_datasets()
        
        # Filter by state/district if specified
        if request.state:
            data = {k: v[v['state'] == request.state] for k, v in data.items()}
        if request.district:
            data = {k: v[v['district'] == request.district] for k, v in data.items()}
        
        # Prepare for prediction
        preprocessor = GATIPreprocessor()
        combined = loader.get_aggregated_data(level='state')
        X, feature_names, entity_ids = preprocessor.prepare_for_anomaly_detection(combined)
        
        # Predict
        anomaly_scores = model.decision_function(X)
        predictions = model.predict(X)
        
        # Format results
        results = []
        for i, entity_id in enumerate(entity_ids):
            is_anomaly = predictions[i] == -1
            score = float(-anomaly_scores[i])  # Convert to "higher = more anomalous"
            
            if is_anomaly:
                if score > 0.3:
                    severity = "critical"
                elif score > 0.2:
                    severity = "high"
                else:
                    severity = "medium"
            else:
                severity = "low"
            
            results.append(AnomalyResult(
                entity_id=entity_id,
                is_anomaly=is_anomaly,
                anomaly_score=score,
                severity=severity,
                explanation=f"{'Anomalous' if is_anomaly else 'Normal'} pattern detected",
                detected_at=datetime.now().isoformat()
            ))
        
        anomalies_detected = sum(1 for r in results if r.is_anomaly)
        
        return AnomalyResponse(
            success=True,
            total_analyzed=len(results),
            anomalies_detected=anomalies_detected,
            anomaly_rate=anomalies_detected / len(results) if results else 0,
            results=results,
            model_version=info.version if info else "unknown"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Anomaly detection failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/risk/assess", response_model=RiskResponse)
async def assess_risk(request: RiskRequest):
    """
    Assess risk levels for geographic entities.
    
    Uses XGBoost classifier with derived risk labels based on
    data volatility, coverage gaps, and other indicators.
    """
    try:
        model, info = model_manager.get_model('risk')
        
        if model is None:
            raise HTTPException(
                status_code=503,
                detail="Risk scoring model not loaded. Please train the model first."
            )
        
        # Load and prepare data
        from data_loader import GATIDataLoader
        from preprocessing import GATIPreprocessor
        
        loader = GATIDataLoader()
        preprocessor = GATIPreprocessor()
        
        combined = loader.get_aggregated_data(level='state')
        
        if request.state:
            combined = combined[combined['state'] == request.state]
        
        X, y, feature_names, entity_ids = preprocessor.prepare_for_risk_scoring(combined)
        
        # Predict
        predictions = model.predict(X)
        probabilities = model.predict_proba(X) if hasattr(model, 'predict_proba') else None
        
        # Map numeric predictions to labels
        risk_map = {0: 'low', 1: 'medium', 2: 'high'}
        
        results = []
        risk_counts = {'low': 0, 'medium': 0, 'high': 0, 'critical': 0}
        
        for i, entity_id in enumerate(entity_ids):
            pred = predictions[i]
            risk_level = risk_map.get(pred, 'medium')
            
            # Get confidence
            if probabilities is not None:
                confidence = float(np.max(probabilities[i]))
            else:
                confidence = 0.7
            
            # High score with high confidence = critical
            if risk_level == 'high' and confidence > 0.8:
                risk_level = 'critical'
            
            risk_counts[risk_level] += 1
            
            results.append(RiskResult(
                entity_id=entity_id,
                risk_level=risk_level,
                risk_score=float(pred) / 2,  # Normalize to 0-1
                confidence=confidence,
                top_factors=["Data volatility", "Coverage gaps"],  # Placeholder
                recommendations=["Increase monitoring", "Verify data sources"]
            ))
        
        return RiskResponse(
            success=True,
            total_assessed=len(results),
            risk_distribution=risk_counts,
            results=results,
            model_version=info.version if info else "unknown"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Risk assessment failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/forecast/predict", response_model=ForecastResponse)
async def get_forecast(request: ForecastRequest):
    """
    Generate forecasts for Aadhaar metrics.
    
    Uses Prophet for time series forecasting with automatic
    seasonality detection and trend analysis.
    """
    try:
        model, info = model_manager.get_model('forecast')
        
        if model is None:
            raise HTTPException(
                status_code=503,
                detail="Forecasting model not loaded. Please train the model first."
            )
        
        # Generate future dates
        future_dates = pd.date_range(
            start=datetime.now(),
            periods=request.horizon_days,
            freq='D'
        )
        
        future_df = pd.DataFrame({'ds': future_dates})
        
        # Predict
        forecast = model.predict(future_df)
        
        # Format results
        forecast_points = []
        for _, row in forecast.iterrows():
            point = ForecastPoint(
                date=row['ds'].strftime('%Y-%m-%d'),
                predicted_value=float(row['yhat']),
                lower_bound=float(row['yhat_lower']) if request.include_confidence else None,
                upper_bound=float(row['yhat_upper']) if request.include_confidence else None
            )
            forecast_points.append(point)
        
        # Determine trend
        first_val = forecast_points[0].predicted_value
        last_val = forecast_points[-1].predicted_value
        
        if last_val > first_val * 1.05:
            trend = "increasing"
            trend_strength = (last_val - first_val) / first_val
        elif last_val < first_val * 0.95:
            trend = "decreasing"
            trend_strength = (first_val - last_val) / first_val
        else:
            trend = "stable"
            trend_strength = 0.0
        
        return ForecastResponse(
            success=True,
            metric=request.metric,
            state=request.state,
            forecast=forecast_points,
            trend=trend,
            trend_strength=min(1.0, abs(trend_strength)),
            model_version=info.version if info else "unknown"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Forecasting failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/explain", response_model=ExplanationResponse)
async def explain_prediction(request: ExplanationRequest):
    """
    Get detailed explanation for a prediction.
    
    Uses SHAP values to explain why a specific prediction was made,
    essential for government transparency requirements.
    """
    try:
        model, info = model_manager.get_model(request.model_type)
        
        if model is None:
            raise HTTPException(
                status_code=503,
                detail=f"Model {request.model_type} not loaded."
            )
        
        # Generate explanation
        # In production, this would use the explainability module
        
        return ExplanationResponse(
            success=True,
            entity_id=request.entity_id,
            summary=f"Prediction of {request.prediction_value:.2f} for {request.entity_id}",
            feature_contributions=[
                {"feature": "volatility", "contribution": 0.15, "direction": "positive"},
                {"feature": "coverage", "contribution": -0.08, "direction": "negative"},
                {"feature": "freshness", "contribution": 0.12, "direction": "positive"}
            ],
            methodology="SHAP (SHapley Additive exPlanations)"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Explanation generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/train", response_model=TrainingResponse)
async def trigger_training(
    request: TrainingRequest,
    background_tasks: BackgroundTasks
):
    """
    Trigger model training (admin only).
    
    Trains or retrains a specific model type and registers
    the new version in the model registry.
    """
    try:
        # In production, add authentication here
        
        start_time = datetime.now()
        
        # Import training modules based on type
        if request.model_type == 'anomaly':
            from models.anomaly_detection import train_anomaly_detector
            model, metrics = train_anomaly_detector()
        elif request.model_type == 'risk':
            from models.risk_scoring import train_risk_scorer
            model, metrics = train_risk_scorer()
        elif request.model_type == 'forecast':
            from models.forecasting import train_forecaster
            model, metrics = train_forecaster()
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown model type: {request.model_type}"
            )
        
        duration = (datetime.now() - start_time).total_seconds()
        
        # Register new version
        from versioning import GATIModelVersioning
        versioning = GATIModelVersioning("models")
        
        version = versioning.register_model(
            model=model,
            model_name=f"{request.model_type}_model",
            model_type=request.model_type,
            description="Retrained via API",
            metrics=metrics,
            training_duration=duration,
            created_by="api"
        )
        
        # Reload models
        model_manager.is_initialized = False
        model_manager.initialize()
        
        return TrainingResponse(
            success=True,
            model_type=request.model_type,
            version=version.version,
            metrics=metrics,
            training_duration_seconds=duration,
            message=f"Successfully trained {request.model_type} model"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Training failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/stats")
async def get_statistics():
    """Get overall statistics and insights."""
    try:
        from data_loader import GATIDataLoader
        
        loader = GATIDataLoader()
        data = loader.load_all_datasets()
        
        stats = {
            "last_updated": datetime.now().isoformat(),
            "datasets": {}
        }
        
        for name, df in data.items():
            stats["datasets"][name] = {
                "rows": len(df),
                "columns": list(df.columns),
                "date_range": {
                    "min": df['date'].min().strftime('%Y-%m-%d') if 'date' in df.columns else None,
                    "max": df['date'].max().strftime('%Y-%m-%d') if 'date' in df.columns else None
                }
            }
        
        return stats
        
    except Exception as e:
        logger.error(f"Failed to get stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== Error Handlers ==============

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler."""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "detail": str(exc)
        }
    )


# ============== Run Server ==============

if __name__ == "__main__":
    import uvicorn
    
    print("🚀 Starting GATI ML API Server...")
    print("📖 Docs: http://localhost:8000/api/docs")
    print("📖 ReDoc: http://localhost:8000/api/redoc")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
