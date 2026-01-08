"""
GATI ML Pipeline - Time Series Forecasting Module
==================================================
Production-grade forecasting for government planning.
Primary: Prophet (justified) with Exponential Smoothing fallback.

WHY PROPHET:
1. Handles missing data gracefully
2. Automatic seasonality detection (weekly, yearly)
3. Built-in uncertainty quantification
4. Robust to outliers
5. Intuitive hyperparameters
6. Works well with government data (holidays, events)

WHY NOT LSTM:
- Not enough data for deep learning (need years of data)
- Overkill for this use case
- Prophet achieves similar/better results with less complexity
- Government systems need interpretability over black-box models
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from pathlib import Path
import joblib
import json
from loguru import logger

from sklearn.metrics import mean_absolute_error, mean_squared_error, mean_absolute_percentage_error

try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except ImportError:
    PROPHET_AVAILABLE = False
    logger.warning("Prophet not available - using fallback methods")

from statsmodels.tsa.holtwinters import ExponentialSmoothing
from statsmodels.tsa.seasonal import seasonal_decompose
import warnings

warnings.filterwarnings('ignore')


@dataclass
class ForecastPoint:
    """Single forecast point."""
    date: str
    predicted_value: float
    lower_bound: float  # Confidence interval lower
    upper_bound: float  # Confidence interval upper
    confidence: float  # 0-100


@dataclass
class ForecastResult:
    """Complete forecast result."""
    target_column: str
    model_used: str
    training_samples: int
    forecast_horizon: int
    forecasts: List[ForecastPoint]
    metrics: Dict[str, float]
    seasonality_detected: Dict[str, bool]
    trend_direction: str  # increasing, decreasing, stable
    trend_strength: float  # 0-1


@dataclass
class ForecastModelMetadata:
    """Metadata for forecasting model."""
    model_name: str
    algorithm: str
    version: str
    trained_at: str
    target_column: str
    training_samples: int
    date_range: Tuple[str, str]
    hyperparameters: Dict[str, Any]
    evaluation_metrics: Dict[str, float]
    seasonality: Dict[str, bool]


class GATIForecaster:
    """
    Production-grade time series forecaster for GATI platform.
    Primary: Prophet
    Fallback: Exponential Smoothing (Holt-Winters)
    """
    
    def __init__(
        self,
        horizon_days: int = 30,
        confidence_interval: float = 0.95,
        weekly_seasonality: bool = True,
        monthly_seasonality: bool = True,
        yearly_seasonality: bool = False,  # Not enough data
        random_state: int = 42
    ):
        """
        Initialize forecaster.
        
        Args:
            horizon_days: Number of days to forecast
            confidence_interval: Width of prediction intervals
            weekly_seasonality: Enable weekly seasonality
            monthly_seasonality: Enable monthly seasonality
            yearly_seasonality: Enable yearly seasonality
            random_state: For reproducibility
        """
        self.horizon_days = horizon_days
        self.confidence_interval = confidence_interval
        self.weekly_seasonality = weekly_seasonality
        self.monthly_seasonality = monthly_seasonality
        self.yearly_seasonality = yearly_seasonality
        self.random_state = random_state
        
        self.model = None
        self.fallback_model = None
        self.is_fitted = False
        self.target_column: str = ''
        self.training_data: Optional[pd.DataFrame] = None
        self.metadata: Optional[ForecastModelMetadata] = None
        self.use_prophet = PROPHET_AVAILABLE
        
        logger.info(f"GATI Forecaster initialized (Prophet available: {PROPHET_AVAILABLE})")
    
    def prepare_data(
        self,
        df: pd.DataFrame,
        date_column: str,
        target_column: str
    ) -> pd.DataFrame:
        """
        Prepare data for forecasting.
        
        Args:
            df: Input DataFrame
            date_column: Name of date column
            target_column: Name of target column
            
        Returns:
            Prophet-compatible DataFrame with 'ds' and 'y' columns
        """
        df_prep = df.copy()
        
        # Ensure datetime
        df_prep[date_column] = pd.to_datetime(df_prep[date_column])
        
        # Aggregate by date if needed
        if df_prep.groupby(date_column).size().max() > 1:
            df_prep = df_prep.groupby(date_column)[target_column].sum().reset_index()
        
        # Sort by date
        df_prep = df_prep.sort_values(date_column).reset_index(drop=True)
        
        # Rename for Prophet compatibility
        df_prophet = df_prep[[date_column, target_column]].copy()
        df_prophet.columns = ['ds', 'y']
        
        # Handle missing dates (fill with interpolation)
        date_range = pd.date_range(start=df_prophet['ds'].min(), end=df_prophet['ds'].max(), freq='D')
        df_full = pd.DataFrame({'ds': date_range})
        df_prophet = df_full.merge(df_prophet, on='ds', how='left')
        df_prophet['y'] = df_prophet['y'].interpolate(method='linear').fillna(0)
        
        # Remove any remaining NaN
        df_prophet = df_prophet.dropna()
        
        self.target_column = target_column
        self.training_data = df_prophet
        
        logger.info(f"Prepared {len(df_prophet)} samples for forecasting")
        
        return df_prophet
    
    def fit(
        self,
        df: pd.DataFrame,
        date_column: str = 'date',
        target_column: str = 'total'
    ) -> 'GATIForecaster':
        """
        Fit the forecasting model.
        
        Args:
            df: Input DataFrame
            date_column: Date column name
            target_column: Target column name
            
        Returns:
            self
        """
        # Prepare data
        df_prophet = self.prepare_data(df, date_column, target_column)
        
        logger.info(f"Training forecaster on {len(df_prophet)} samples")
        
        if self.use_prophet and len(df_prophet) >= 14:
            try:
                # Configure Prophet
                self.model = Prophet(
                    yearly_seasonality=self.yearly_seasonality,
                    weekly_seasonality=self.weekly_seasonality,
                    daily_seasonality=False,
                    interval_width=self.confidence_interval,
                    uncertainty_samples=1000
                )
                
                # Add monthly seasonality if enabled
                if self.monthly_seasonality:
                    self.model.add_seasonality(
                        name='monthly',
                        period=30.5,
                        fourier_order=5
                    )
                
                # Suppress Prophet logs
                import logging
                logging.getLogger('prophet').setLevel(logging.WARNING)
                logging.getLogger('cmdstanpy').setLevel(logging.WARNING)
                
                self.model.fit(df_prophet)
                
                logger.info("Prophet model trained successfully")
                
            except Exception as e:
                logger.warning(f"Prophet training failed: {e}, using fallback")
                self.use_prophet = False
        
        # Always train fallback model
        try:
            # Exponential Smoothing with trend and seasonality
            ts = df_prophet.set_index('ds')['y']
            
            # Determine seasonality period
            seasonal_period = 7  # Weekly
            if len(ts) >= 60:
                seasonal_period = 30  # Monthly if enough data
            
            self.fallback_model = ExponentialSmoothing(
                ts,
                seasonal_periods=seasonal_period,
                trend='add',
                seasonal='add',
                damped_trend=True,
                initialization_method='estimated'
            ).fit()
            
            logger.info("Exponential Smoothing fallback trained")
            
        except Exception as e:
            logger.warning(f"Fallback model training failed: {e}")
        
        self.is_fitted = True
        
        # Create metadata
        self.metadata = ForecastModelMetadata(
            model_name='GATI_Forecaster',
            algorithm='Prophet' if self.use_prophet else 'ExponentialSmoothing',
            version='1.0.0',
            trained_at=datetime.now().isoformat(),
            target_column=target_column,
            training_samples=len(df_prophet),
            date_range=(
                df_prophet['ds'].min().strftime('%Y-%m-%d'),
                df_prophet['ds'].max().strftime('%Y-%m-%d')
            ),
            hyperparameters={
                'horizon_days': self.horizon_days,
                'confidence_interval': self.confidence_interval,
                'weekly_seasonality': self.weekly_seasonality,
                'monthly_seasonality': self.monthly_seasonality,
                'yearly_seasonality': self.yearly_seasonality
            },
            evaluation_metrics={},
            seasonality={
                'weekly': self.weekly_seasonality,
                'monthly': self.monthly_seasonality,
                'yearly': self.yearly_seasonality
            }
        )
        
        logger.info("✅ Forecasting model trained successfully")
        
        return self
    
    def predict(
        self,
        periods: Optional[int] = None,
        include_history: bool = False
    ) -> pd.DataFrame:
        """
        Generate forecasts.
        
        Args:
            periods: Number of periods to forecast (default: horizon_days)
            include_history: Whether to include historical predictions
            
        Returns:
            DataFrame with forecasts
        """
        if not self.is_fitted:
            raise ValueError("Model not fitted. Call fit() first.")
        
        periods = periods or self.horizon_days
        
        if self.use_prophet and self.model is not None:
            # Prophet forecast
            future = self.model.make_future_dataframe(periods=periods)
            forecast = self.model.predict(future)
            
            if not include_history:
                forecast = forecast.tail(periods)
            
            result = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].copy()
            result.columns = ['date', 'predicted', 'lower', 'upper']
            
        elif self.fallback_model is not None:
            # Exponential Smoothing forecast
            forecast = self.fallback_model.forecast(periods)
            
            # Generate confidence intervals (approximate)
            std = self.training_data['y'].std() if self.training_data is not None else forecast.std()
            z_score = 1.96  # 95% confidence
            
            dates = pd.date_range(
                start=self.training_data['ds'].max() + timedelta(days=1),
                periods=periods,
                freq='D'
            )
            
            result = pd.DataFrame({
                'date': dates,
                'predicted': forecast.values,
                'lower': forecast.values - z_score * std,
                'upper': forecast.values + z_score * std
            })
        else:
            raise ValueError("No fitted model available")
        
        # Ensure non-negative predictions (count data)
        result['predicted'] = result['predicted'].clip(lower=0)
        result['lower'] = result['lower'].clip(lower=0)
        result['upper'] = result['upper'].clip(lower=0)
        
        return result
    
    def forecast_with_analysis(
        self,
        periods: Optional[int] = None
    ) -> ForecastResult:
        """
        Generate forecasts with full analysis.
        
        Args:
            periods: Number of periods to forecast
            
        Returns:
            ForecastResult with detailed analysis
        """
        periods = periods or self.horizon_days
        forecast_df = self.predict(periods)
        
        # Create forecast points
        forecasts = []
        for _, row in forecast_df.iterrows():
            # Calculate confidence based on forecast position
            days_out = (row['date'] - self.training_data['ds'].max()).days if self.training_data is not None else 1
            confidence = max(50, 95 - (days_out * 1.0))  # Decrease confidence over time
            
            forecasts.append(ForecastPoint(
                date=row['date'].strftime('%Y-%m-%d'),
                predicted_value=float(row['predicted']),
                lower_bound=float(row['lower']),
                upper_bound=float(row['upper']),
                confidence=confidence
            ))
        
        # Analyze trend
        trend_direction, trend_strength = self._analyze_trend(forecast_df['predicted'].values)
        
        # Get seasonality info
        seasonality_detected = {
            'weekly': self.weekly_seasonality,
            'monthly': self.monthly_seasonality,
            'yearly': self.yearly_seasonality
        }
        
        # Calculate metrics on historical data
        metrics = self._calculate_historical_metrics()
        
        result = ForecastResult(
            target_column=self.target_column,
            model_used='Prophet' if self.use_prophet else 'ExponentialSmoothing',
            training_samples=len(self.training_data) if self.training_data is not None else 0,
            forecast_horizon=periods,
            forecasts=forecasts,
            metrics=metrics,
            seasonality_detected=seasonality_detected,
            trend_direction=trend_direction,
            trend_strength=trend_strength
        )
        
        return result
    
    def _analyze_trend(self, values: np.ndarray) -> Tuple[str, float]:
        """Analyze trend direction and strength."""
        if len(values) < 2:
            return 'stable', 0.0
        
        # Simple linear regression for trend
        x = np.arange(len(values))
        slope = np.polyfit(x, values, 1)[0]
        
        # Normalize slope by mean value
        mean_val = np.mean(values)
        if mean_val > 0:
            normalized_slope = slope / mean_val
        else:
            normalized_slope = 0
        
        # Determine direction
        if normalized_slope > 0.01:
            direction = 'increasing'
        elif normalized_slope < -0.01:
            direction = 'decreasing'
        else:
            direction = 'stable'
        
        # Strength is absolute normalized slope
        strength = min(1.0, abs(normalized_slope) * 10)
        
        return direction, strength
    
    def _calculate_historical_metrics(self) -> Dict[str, float]:
        """Calculate metrics on historical predictions."""
        if self.training_data is None or len(self.training_data) < 10:
            return {}
        
        # Use last 20% as validation
        split_idx = int(len(self.training_data) * 0.8)
        train = self.training_data.iloc[:split_idx]
        test = self.training_data.iloc[split_idx:]
        
        if len(test) < 3:
            return {}
        
        try:
            # Fit on train, predict on test period
            if self.use_prophet and PROPHET_AVAILABLE:
                temp_model = Prophet(
                    yearly_seasonality=False,
                    weekly_seasonality=self.weekly_seasonality,
                    daily_seasonality=False
                )
                
                import logging
                logging.getLogger('prophet').setLevel(logging.ERROR)
                
                temp_model.fit(train)
                future = temp_model.make_future_dataframe(periods=len(test))
                forecast = temp_model.predict(future)
                y_pred = forecast.tail(len(test))['yhat'].values
            else:
                ts = train.set_index('ds')['y']
                temp_model = ExponentialSmoothing(
                    ts,
                    seasonal_periods=7,
                    trend='add',
                    seasonal='add'
                ).fit()
                y_pred = temp_model.forecast(len(test)).values
            
            y_true = test['y'].values
            
            metrics = {
                'mae': float(mean_absolute_error(y_true, y_pred)),
                'rmse': float(np.sqrt(mean_squared_error(y_true, y_pred))),
                'mape': float(mean_absolute_percentage_error(y_true, y_pred)) * 100,
            }
            
            # Coverage - how many actuals fell within prediction intervals
            # Approximate for non-Prophet
            std = train['y'].std()
            lower = y_pred - 1.96 * std
            upper = y_pred + 1.96 * std
            coverage = np.mean((y_true >= lower) & (y_true <= upper))
            metrics['coverage'] = float(coverage)
            
            return metrics
            
        except Exception as e:
            logger.warning(f"Could not calculate metrics: {e}")
            return {}
    
    def evaluate(
        self,
        test_data: Optional[pd.DataFrame] = None
    ) -> Dict[str, float]:
        """
        Comprehensive evaluation.
        
        Args:
            test_data: Optional test data with 'ds' and 'y' columns
            
        Returns:
            Dictionary of evaluation metrics
        """
        metrics = self._calculate_historical_metrics()
        
        if test_data is not None and len(test_data) > 0:
            # Evaluate on provided test data
            forecast_df = self.predict(periods=len(test_data))
            y_true = test_data['y'].values
            y_pred = forecast_df['predicted'].values[:len(y_true)]
            
            metrics['test_mae'] = float(mean_absolute_error(y_true, y_pred))
            metrics['test_rmse'] = float(np.sqrt(mean_squared_error(y_true, y_pred)))
            metrics['test_mape'] = float(mean_absolute_percentage_error(y_true, y_pred)) * 100
        
        if self.metadata:
            self.metadata.evaluation_metrics = metrics
        
        # Print evaluation
        print("\n📊 FORECASTING MODEL EVALUATION")
        print("="*50)
        if 'mae' in metrics:
            print(f"Mean Absolute Error: {metrics['mae']:,.2f}")
        if 'rmse' in metrics:
            print(f"Root Mean Squared Error: {metrics['rmse']:,.2f}")
        if 'mape' in metrics:
            print(f"Mean Absolute % Error: {metrics['mape']:.2f}%")
        if 'coverage' in metrics:
            print(f"95% Interval Coverage: {metrics['coverage']*100:.1f}%")
        print("="*50)
        
        if 'mape' in metrics:
            if metrics['mape'] < 10:
                print("✅ Excellent accuracy (<10% MAPE)")
            elif metrics['mape'] < 20:
                print("✓ Good accuracy (10-20% MAPE)")
            elif metrics['mape'] < 30:
                print("⚠️ Moderate accuracy (20-30% MAPE)")
            else:
                print("❌ Poor accuracy (>30% MAPE) - consider more data")
        
        return metrics
    
    def decompose_series(self) -> Optional[pd.DataFrame]:
        """
        Decompose time series into trend, seasonality, and residual.
        
        Returns:
            DataFrame with decomposition components
        """
        if self.training_data is None or len(self.training_data) < 14:
            logger.warning("Not enough data for decomposition")
            return None
        
        try:
            ts = self.training_data.set_index('ds')['y']
            decomposition = seasonal_decompose(ts, model='additive', period=7)
            
            result = pd.DataFrame({
                'date': self.training_data['ds'],
                'original': ts.values,
                'trend': decomposition.trend,
                'seasonal': decomposition.seasonal,
                'residual': decomposition.resid
            })
            
            return result
            
        except Exception as e:
            logger.warning(f"Decomposition failed: {e}")
            return None
    
    def save(self, filepath: str) -> None:
        """Save model and metadata."""
        save_dict = {
            'model': self.model if not PROPHET_AVAILABLE else None,  # Prophet doesn't pickle well
            'fallback_model': self.fallback_model,
            'training_data': self.training_data,
            'target_column': self.target_column,
            'metadata': self.metadata,
            'config': {
                'horizon_days': self.horizon_days,
                'confidence_interval': self.confidence_interval,
                'weekly_seasonality': self.weekly_seasonality,
                'monthly_seasonality': self.monthly_seasonality,
                'yearly_seasonality': self.yearly_seasonality,
                'random_state': self.random_state,
                'use_prophet': self.use_prophet
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
                    'target_column': self.metadata.target_column,
                    'training_samples': self.metadata.training_samples,
                    'date_range': self.metadata.date_range,
                    'hyperparameters': self.metadata.hyperparameters,
                    'evaluation_metrics': self.metadata.evaluation_metrics,
                    'seasonality': self.metadata.seasonality
                }, f, indent=2)
        
        logger.info(f"Model saved to {filepath}")
    
    @classmethod
    def load(cls, filepath: str) -> 'GATIForecaster':
        """Load model from file."""
        save_dict = joblib.load(filepath)
        
        config = save_dict['config']
        forecaster = cls(
            horizon_days=config['horizon_days'],
            confidence_interval=config['confidence_interval'],
            weekly_seasonality=config['weekly_seasonality'],
            monthly_seasonality=config['monthly_seasonality'],
            yearly_seasonality=config['yearly_seasonality'],
            random_state=config['random_state']
        )
        
        forecaster.fallback_model = save_dict['fallback_model']
        forecaster.training_data = save_dict['training_data']
        forecaster.target_column = save_dict['target_column']
        forecaster.metadata = save_dict['metadata']
        forecaster.use_prophet = config['use_prophet']
        forecaster.is_fitted = True
        
        # Re-train Prophet if needed (it doesn't serialize well)
        if forecaster.use_prophet and PROPHET_AVAILABLE and forecaster.training_data is not None:
            try:
                forecaster.model = Prophet(
                    yearly_seasonality=config['yearly_seasonality'],
                    weekly_seasonality=config['weekly_seasonality'],
                    daily_seasonality=False
                )
                forecaster.model.fit(forecaster.training_data)
            except:
                forecaster.use_prophet = False
        
        logger.info(f"Model loaded from {filepath}")
        
        return forecaster


def train_forecaster(
    df: pd.DataFrame,
    date_column: str = 'date',
    target_column: str = 'total',
    horizon_days: int = 30,
    save_path: Optional[str] = None
) -> Tuple[GATIForecaster, ForecastResult]:
    """
    Convenience function to train and evaluate forecaster.
    
    Args:
        df: Input DataFrame
        date_column: Date column name
        target_column: Target column name
        horizon_days: Forecast horizon
        save_path: Path to save model
        
    Returns:
        Tuple of (trained forecaster, forecast result)
    """
    forecaster = GATIForecaster(horizon_days=horizon_days)
    
    # Train
    forecaster.fit(df, date_column, target_column)
    
    # Evaluate
    forecaster.evaluate()
    
    # Generate forecast
    result = forecaster.forecast_with_analysis()
    
    # Save
    if save_path:
        forecaster.save(save_path)
    
    return forecaster, result


if __name__ == "__main__":
    # Test forecasting
    import sys
    sys.path.append('..')
    from data_loader import GATIDataLoader
    from preprocessing import GATIPreprocessor
    
    print("📈 GATI ML Pipeline - Forecasting Test")
    print("="*50)
    
    # Load data
    loader = GATIDataLoader()
    df = loader.load_dataset('enrolment')
    
    # Preprocess
    preprocessor = GATIPreprocessor()
    df_clean = preprocessor.clean_data(df)
    
    # Aggregate by date
    df_daily = df_clean.groupby('date').agg({
        'age_0_5': 'sum',
        'age_5_17': 'sum',
        'age_18_greater': 'sum'
    }).reset_index()
    df_daily['total'] = df_daily['age_0_5'] + df_daily['age_5_17'] + df_daily['age_18_greater']
    
    print(f"\n📊 Data: {len(df_daily)} daily observations")
    
    # Train
    forecaster, result = train_forecaster(
        df_daily,
        date_column='date',
        target_column='total',
        horizon_days=30,
        save_path='saved_models/forecaster_v1.joblib'
    )
    
    # Show forecast
    print(f"\n📈 {result.forecast_horizon}-Day Forecast:")
    print(f"   Model: {result.model_used}")
    print(f"   Trend: {result.trend_direction} (strength: {result.trend_strength:.2f})")
    print(f"\n   Date Range: {result.forecasts[0].date} to {result.forecasts[-1].date}")
    print(f"\n   First 5 days:")
    for fc in result.forecasts[:5]:
        print(f"   {fc.date}: {fc.predicted_value:,.0f} [{fc.lower_bound:,.0f} - {fc.upper_bound:,.0f}]")
    
    # Decomposition
    decomp = forecaster.decompose_series()
    if decomp is not None:
        print(f"\n📊 Series Decomposition:")
        print(f"   Trend range: {decomp['trend'].min():,.0f} - {decomp['trend'].max():,.0f}")
        print(f"   Seasonal amplitude: {decomp['seasonal'].std():,.0f}")
    
    print("\n✅ Forecasting complete!")
