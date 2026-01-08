"""
GATI ML Pipeline - Preprocessing Module
========================================
Production-grade data preprocessing for ML models.
Handles cleaning, feature engineering, scaling, and train/test splits.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any, Union
from dataclasses import dataclass
from pathlib import Path
import joblib
from loguru import logger

from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler
from sklearn.model_selection import train_test_split, TimeSeriesSplit
import warnings

warnings.filterwarnings('ignore')


@dataclass
class PreprocessingConfig:
    """Configuration for preprocessing pipeline."""
    handle_missing: str = 'interpolate'  # drop, interpolate, fill_zero, fill_mean
    outlier_method: str = 'iqr'  # iqr, zscore, clip, none
    outlier_threshold: float = 1.5
    scaling_method: str = 'standard'  # standard, minmax, robust, none
    test_size: float = 0.2
    random_state: int = 42


@dataclass
class FeatureEngineering:
    """Engineered features metadata."""
    feature_names: List[str]
    temporal_features: List[str]
    lag_features: List[str]
    rolling_features: List[str]
    categorical_encodings: Dict[str, Dict[str, int]]


class GATIPreprocessor:
    """
    Production-grade preprocessor for GATI ML Pipeline.
    Handles all data transformations with full reproducibility.
    """
    
    def __init__(self, config: Optional[PreprocessingConfig] = None):
        """Initialize preprocessor with configuration."""
        self.config = config or PreprocessingConfig()
        self.scalers: Dict[str, Any] = {}
        self.encoders: Dict[str, Dict[str, int]] = {}
        self.feature_stats: Dict[str, Dict[str, float]] = {}
        self._is_fitted = False
        
        logger.info("GATI Preprocessor initialized")
    
    def clean_data(self, df: pd.DataFrame, date_column: str = 'date') -> pd.DataFrame:
        """
        Clean raw data - handle missing values and duplicates.
        
        Args:
            df: Input DataFrame
            date_column: Name of date column
            
        Returns:
            Cleaned DataFrame
        """
        df_clean = df.copy()
        initial_rows = len(df_clean)
        
        # Remove exact duplicates
        df_clean = df_clean.drop_duplicates()
        duplicates_removed = initial_rows - len(df_clean)
        if duplicates_removed > 0:
            logger.info(f"Removed {duplicates_removed} duplicate rows")
        
        # Handle missing dates - always drop rows with missing dates
        if date_column in df_clean.columns:
            missing_dates = df_clean[date_column].isnull().sum()
            if missing_dates > 0:
                df_clean = df_clean.dropna(subset=[date_column])
                logger.info(f"Removed {missing_dates} rows with missing dates")
        
        # Get numeric columns
        numeric_cols = df_clean.select_dtypes(include=[np.number]).columns.tolist()
        
        # Handle missing values in numeric columns
        if self.config.handle_missing == 'drop':
            df_clean = df_clean.dropna(subset=numeric_cols)
        elif self.config.handle_missing == 'interpolate':
            for col in numeric_cols:
                df_clean[col] = df_clean[col].interpolate(method='linear', limit_direction='both')
                df_clean[col] = df_clean[col].fillna(0)  # Fill remaining NaN at edges
        elif self.config.handle_missing == 'fill_zero':
            df_clean[numeric_cols] = df_clean[numeric_cols].fillna(0)
        elif self.config.handle_missing == 'fill_mean':
            for col in numeric_cols:
                df_clean[col] = df_clean[col].fillna(df_clean[col].mean())
        
        # Handle negative values in count columns (set to 0)
        for col in numeric_cols:
            if any(keyword in col.lower() for keyword in ['age', 'bio', 'demo', 'enrol']):
                neg_count = (df_clean[col] < 0).sum()
                if neg_count > 0:
                    df_clean.loc[df_clean[col] < 0, col] = 0
                    logger.debug(f"Set {neg_count} negative values to 0 in {col}")
        
        final_rows = len(df_clean)
        logger.info(f"Cleaning complete: {initial_rows:,} → {final_rows:,} rows ({(1 - final_rows/initial_rows)*100:.2f}% removed)")
        
        return df_clean
    
    def handle_outliers(self, df: pd.DataFrame, columns: Optional[List[str]] = None) -> pd.DataFrame:
        """
        Handle outliers in numeric columns.
        
        Args:
            df: Input DataFrame
            columns: Specific columns to process (default: all numeric)
            
        Returns:
            DataFrame with outliers handled
        """
        if self.config.outlier_method == 'none':
            return df
        
        df_out = df.copy()
        
        if columns is None:
            columns = df_out.select_dtypes(include=[np.number]).columns.tolist()
        
        for col in columns:
            if col not in df_out.columns:
                continue
                
            if self.config.outlier_method == 'iqr':
                q1 = df_out[col].quantile(0.25)
                q3 = df_out[col].quantile(0.75)
                iqr = q3 - q1
                lower = q1 - self.config.outlier_threshold * iqr
                upper = q3 + self.config.outlier_threshold * iqr
                
                # Clip instead of remove for government data (preserve records)
                outliers_count = ((df_out[col] < lower) | (df_out[col] > upper)).sum()
                df_out[col] = df_out[col].clip(lower=max(0, lower), upper=upper)
                
                if outliers_count > 0:
                    logger.debug(f"Clipped {outliers_count} outliers in {col}")
                    
            elif self.config.outlier_method == 'zscore':
                mean = df_out[col].mean()
                std = df_out[col].std()
                if std > 0:
                    z_scores = np.abs((df_out[col] - mean) / std)
                    outlier_mask = z_scores > 3
                    outliers_count = outlier_mask.sum()
                    df_out.loc[outlier_mask, col] = df_out[col].median()
                    
                    if outliers_count > 0:
                        logger.debug(f"Replaced {outliers_count} outliers in {col} with median")
                        
            elif self.config.outlier_method == 'clip':
                lower = df_out[col].quantile(0.01)
                upper = df_out[col].quantile(0.99)
                df_out[col] = df_out[col].clip(lower=lower, upper=upper)
        
        return df_out
    
    def engineer_features(
        self, 
        df: pd.DataFrame, 
        date_column: str = 'date',
        numeric_columns: Optional[List[str]] = None,
        create_lags: bool = True,
        create_rolling: bool = True,
        lag_periods: List[int] = [1, 7, 14, 30],
        rolling_windows: List[int] = [7, 14, 30]
    ) -> Tuple[pd.DataFrame, FeatureEngineering]:
        """
        Create engineered features for ML models.
        
        Args:
            df: Input DataFrame
            date_column: Name of date column
            numeric_columns: Columns to create features from
            create_lags: Whether to create lag features
            create_rolling: Whether to create rolling statistics
            lag_periods: Lag periods in days
            rolling_windows: Rolling window sizes
            
        Returns:
            Tuple of (featured DataFrame, FeatureEngineering metadata)
        """
        df_feat = df.copy()
        
        if numeric_columns is None:
            numeric_columns = df_feat.select_dtypes(include=[np.number]).columns.tolist()
        
        temporal_features = []
        lag_features = []
        rolling_features = []
        
        # Temporal features from date
        if date_column in df_feat.columns:
            date_col = pd.to_datetime(df_feat[date_column])
            
            df_feat['day_of_week'] = date_col.dt.dayofweek
            df_feat['day_of_month'] = date_col.dt.day
            df_feat['week_of_year'] = date_col.dt.isocalendar().week.astype(int)
            df_feat['month'] = date_col.dt.month
            df_feat['quarter'] = date_col.dt.quarter
            df_feat['is_weekend'] = (date_col.dt.dayofweek >= 5).astype(int)
            df_feat['is_month_start'] = date_col.dt.is_month_start.astype(int)
            df_feat['is_month_end'] = date_col.dt.is_month_end.astype(int)
            
            temporal_features = [
                'day_of_week', 'day_of_month', 'week_of_year', 
                'month', 'quarter', 'is_weekend', 
                'is_month_start', 'is_month_end'
            ]
            
            logger.info(f"Created {len(temporal_features)} temporal features")
        
        # Lag features
        if create_lags:
            for col in numeric_columns:
                for lag in lag_periods:
                    lag_col = f'{col}_lag_{lag}'
                    df_feat[lag_col] = df_feat[col].shift(lag)
                    lag_features.append(lag_col)
            
            logger.info(f"Created {len(lag_features)} lag features")
        
        # Rolling statistics
        if create_rolling:
            for col in numeric_columns:
                for window in rolling_windows:
                    # Rolling mean
                    roll_mean_col = f'{col}_rolling_mean_{window}'
                    df_feat[roll_mean_col] = df_feat[col].rolling(window=window, min_periods=1).mean()
                    rolling_features.append(roll_mean_col)
                    
                    # Rolling std
                    roll_std_col = f'{col}_rolling_std_{window}'
                    df_feat[roll_std_col] = df_feat[col].rolling(window=window, min_periods=1).std().fillna(0)
                    rolling_features.append(roll_std_col)
                    
                    # Rolling min/max (range)
                    roll_range_col = f'{col}_rolling_range_{window}'
                    rolling_max = df_feat[col].rolling(window=window, min_periods=1).max()
                    rolling_min = df_feat[col].rolling(window=window, min_periods=1).min()
                    df_feat[roll_range_col] = rolling_max - rolling_min
                    rolling_features.append(roll_range_col)
            
            logger.info(f"Created {len(rolling_features)} rolling features")
        
        # Encode categorical columns
        categorical_encodings = {}
        if 'state' in df_feat.columns:
            state_mapping = {state: idx for idx, state in enumerate(df_feat['state'].unique())}
            df_feat['state_encoded'] = df_feat['state'].map(state_mapping)
            categorical_encodings['state'] = state_mapping
        
        if 'district' in df_feat.columns:
            district_mapping = {district: idx for idx, district in enumerate(df_feat['district'].unique())}
            df_feat['district_encoded'] = df_feat['district'].map(district_mapping)
            categorical_encodings['district'] = district_mapping
        
        self.encoders = categorical_encodings
        
        # Create total column if not exists
        if 'total' not in df_feat.columns and len(numeric_columns) > 1:
            df_feat['total'] = df_feat[numeric_columns].sum(axis=1)
        
        # Percentage/ratio features
        if 'total' in df_feat.columns:
            for col in numeric_columns:
                pct_col = f'{col}_pct_of_total'
                df_feat[pct_col] = (df_feat[col] / df_feat['total'].replace(0, 1)) * 100
        
        # Fill NaN in lag/rolling features
        df_feat = df_feat.fillna(0)
        
        feature_names = list(df_feat.columns)
        
        feature_metadata = FeatureEngineering(
            feature_names=feature_names,
            temporal_features=temporal_features,
            lag_features=lag_features,
            rolling_features=rolling_features,
            categorical_encodings=categorical_encodings
        )
        
        logger.info(f"Feature engineering complete: {len(feature_names)} total features")
        
        return df_feat, feature_metadata
    
    def scale_features(
        self, 
        df: pd.DataFrame, 
        columns: Optional[List[str]] = None,
        fit: bool = True
    ) -> pd.DataFrame:
        """
        Scale numeric features.
        
        Args:
            df: Input DataFrame
            columns: Columns to scale (default: all numeric)
            fit: Whether to fit scaler (False for transform only)
            
        Returns:
            Scaled DataFrame
        """
        if self.config.scaling_method == 'none':
            return df
        
        df_scaled = df.copy()
        
        if columns is None:
            # Exclude categorical and date columns
            exclude_cols = ['date', 'state', 'district', 'pincode', 'state_encoded', 'district_encoded']
            columns = [c for c in df_scaled.select_dtypes(include=[np.number]).columns 
                      if c not in exclude_cols]
        
        if not columns:
            return df_scaled
        
        # Select scaler type
        if self.config.scaling_method == 'standard':
            scaler_class = StandardScaler
        elif self.config.scaling_method == 'minmax':
            scaler_class = MinMaxScaler
        elif self.config.scaling_method == 'robust':
            scaler_class = RobustScaler
        else:
            logger.warning(f"Unknown scaling method: {self.config.scaling_method}")
            return df_scaled
        
        # Fit or transform
        if fit:
            scaler = scaler_class()
            df_scaled[columns] = scaler.fit_transform(df_scaled[columns])
            self.scalers['main'] = scaler
            self._is_fitted = True
            logger.info(f"Fitted {self.config.scaling_method} scaler on {len(columns)} columns")
        else:
            if 'main' not in self.scalers:
                raise ValueError("Scaler not fitted. Call scale_features with fit=True first.")
            df_scaled[columns] = self.scalers['main'].transform(df_scaled[columns])
        
        # Store feature statistics for later reference
        for col in columns:
            self.feature_stats[col] = {
                'mean': df[col].mean(),
                'std': df[col].std(),
                'min': df[col].min(),
                'max': df[col].max()
            }
        
        return df_scaled
    
    def prepare_for_anomaly_detection(
        self, 
        df: pd.DataFrame,
        numeric_columns: List[str],
        date_column: str = 'date'
    ) -> Tuple[np.ndarray, pd.DataFrame]:
        """
        Prepare data specifically for anomaly detection models.
        
        Args:
            df: Input DataFrame
            numeric_columns: Columns to use for anomaly detection
            date_column: Date column name
            
        Returns:
            Tuple of (feature array for model, metadata DataFrame)
        """
        # Aggregate by date for overall anomaly detection
        if date_column in df.columns:
            df_agg = df.groupby(date_column)[numeric_columns].sum().reset_index()
        else:
            df_agg = df.copy()
        
        # Add derived features
        df_agg['total'] = df_agg[numeric_columns].sum(axis=1)
        
        # Day-over-day change
        for col in numeric_columns + ['total']:
            df_agg[f'{col}_change'] = df_agg[col].diff().fillna(0)
            df_agg[f'{col}_pct_change'] = df_agg[col].pct_change().fillna(0).replace([np.inf, -np.inf], 0) * 100
        
        # Select features for anomaly detection
        feature_cols = numeric_columns + ['total']
        feature_cols += [f'{col}_change' for col in numeric_columns + ['total']]
        feature_cols += [f'{col}_pct_change' for col in numeric_columns + ['total']]
        
        X = df_agg[feature_cols].values
        
        # Store metadata
        metadata = df_agg[[date_column] + feature_cols].copy() if date_column in df_agg.columns else df_agg[feature_cols].copy()
        
        return X, metadata
    
    def prepare_for_forecasting(
        self,
        df: pd.DataFrame,
        target_column: str,
        date_column: str = 'date',
        horizon: int = 30
    ) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Prepare data for time series forecasting.
        
        Args:
            df: Input DataFrame
            target_column: Column to forecast
            date_column: Date column name
            horizon: Forecast horizon in days
            
        Returns:
            Tuple of (train data, test data)
        """
        # Ensure sorted by date
        df_ts = df.sort_values(date_column).copy()
        
        # Aggregate to daily if needed
        if df_ts.groupby(date_column).size().max() > 1:
            df_ts = df_ts.groupby(date_column)[target_column].sum().reset_index()
        
        # Create Prophet-compatible format
        df_prophet = df_ts[[date_column, target_column]].copy()
        df_prophet.columns = ['ds', 'y']
        
        # Split for validation
        train_size = len(df_prophet) - horizon
        if train_size < 30:  # Need at least 30 days for training
            logger.warning("Not enough data for proper train/test split")
            return df_prophet, pd.DataFrame()
        
        train = df_prophet.iloc[:train_size]
        test = df_prophet.iloc[train_size:]
        
        logger.info(f"Forecasting data: {len(train)} train, {len(test)} test samples")
        
        return train, test
    
    def prepare_for_risk_scoring(
        self,
        df: pd.DataFrame,
        numeric_columns: List[str],
        group_column: str = 'state'
    ) -> Tuple[pd.DataFrame, np.ndarray]:
        """
        Prepare data for risk scoring model.
        Creates derived risk labels from data distribution.
        
        Args:
            df: Input DataFrame
            numeric_columns: Columns to use for risk features
            group_column: Column to group by (e.g., state)
            
        Returns:
            Tuple of (features DataFrame, derived risk labels)
        """
        # Aggregate by group
        agg_funcs = {col: ['sum', 'mean', 'std', 'min', 'max'] for col in numeric_columns}
        df_agg = df.groupby(group_column).agg(agg_funcs)
        df_agg.columns = ['_'.join(col) for col in df_agg.columns]
        df_agg = df_agg.reset_index()
        
        # Calculate derived metrics for risk
        total_col = None
        for col in df_agg.columns:
            if 'sum' in col:
                if total_col is None:
                    total_col = df_agg[col].copy()
                else:
                    total_col += df_agg[col]
        
        if total_col is not None:
            df_agg['total_volume'] = total_col
        
        # Coefficient of variation (volatility)
        for col in numeric_columns:
            mean_col = f'{col}_mean'
            std_col = f'{col}_std'
            if mean_col in df_agg.columns and std_col in df_agg.columns:
                df_agg[f'{col}_cv'] = (df_agg[std_col] / df_agg[mean_col].replace(0, 1)) * 100
        
        # Derive risk labels based on percentiles
        # This is a derived label, not ground truth - clearly documented
        risk_features = [col for col in df_agg.columns if col not in [group_column]]
        
        # Create composite risk score
        risk_score = np.zeros(len(df_agg))
        
        for col in risk_features:
            if 'cv' in col or 'std' in col:
                # Higher volatility = higher risk
                risk_score += df_agg[col].rank(pct=True)
        
        risk_score = risk_score / len([c for c in risk_features if 'cv' in c or 'std' in c])
        
        # Derive risk labels (quartiles)
        risk_labels = np.zeros(len(df_agg), dtype=int)
        risk_labels[risk_score >= 0.75] = 3  # Critical
        risk_labels[(risk_score >= 0.50) & (risk_score < 0.75)] = 2  # High
        risk_labels[(risk_score >= 0.25) & (risk_score < 0.50)] = 1  # Medium
        # risk_labels < 0.25 remains 0 (Low)
        
        df_agg['derived_risk_score'] = risk_score
        df_agg['derived_risk_label'] = risk_labels
        
        logger.info(f"Derived risk labels distribution: Low={sum(risk_labels==0)}, Medium={sum(risk_labels==1)}, High={sum(risk_labels==2)}, Critical={sum(risk_labels==3)}")
        
        return df_agg, risk_labels
    
    def get_train_test_split(
        self,
        X: np.ndarray,
        y: Optional[np.ndarray] = None,
        time_series: bool = False
    ) -> Tuple:
        """
        Split data into train and test sets.
        
        Args:
            X: Feature array
            y: Target array (optional)
            time_series: Whether to use time series split
            
        Returns:
            Tuple of splits (X_train, X_test, y_train, y_test) or (X_train, X_test)
        """
        if time_series:
            # For time series, use chronological split
            split_idx = int(len(X) * (1 - self.config.test_size))
            X_train, X_test = X[:split_idx], X[split_idx:]
            if y is not None:
                y_train, y_test = y[:split_idx], y[split_idx:]
                return X_train, X_test, y_train, y_test
            return X_train, X_test
        else:
            if y is not None:
                return train_test_split(
                    X, y, 
                    test_size=self.config.test_size, 
                    random_state=self.config.random_state
                )
            else:
                return train_test_split(
                    X,
                    test_size=self.config.test_size,
                    random_state=self.config.random_state
                )
    
    def save(self, filepath: str) -> None:
        """Save preprocessor state for reproducibility."""
        state = {
            'config': self.config,
            'scalers': self.scalers,
            'encoders': self.encoders,
            'feature_stats': self.feature_stats,
            'is_fitted': self._is_fitted
        }
        joblib.dump(state, filepath)
        logger.info(f"Preprocessor saved to {filepath}")
    
    @classmethod
    def load(cls, filepath: str) -> 'GATIPreprocessor':
        """Load preprocessor state."""
        state = joblib.load(filepath)
        preprocessor = cls(config=state['config'])
        preprocessor.scalers = state['scalers']
        preprocessor.encoders = state['encoders']
        preprocessor.feature_stats = state['feature_stats']
        preprocessor._is_fitted = state['is_fitted']
        logger.info(f"Preprocessor loaded from {filepath}")
        return preprocessor


if __name__ == "__main__":
    # Test preprocessing
    from data_loader import GATIDataLoader
    
    print("🔧 GATI ML Pipeline - Preprocessing Test")
    print("="*50)
    
    loader = GATIDataLoader()
    df = loader.load_dataset('enrolment')
    
    preprocessor = GATIPreprocessor()
    
    # Clean data
    df_clean = preprocessor.clean_data(df)
    print(f"✅ Cleaned: {len(df)} → {len(df_clean)} rows")
    
    # Handle outliers
    numeric_cols = ['age_0_5', 'age_5_17', 'age_18_greater']
    df_clean = preprocessor.handle_outliers(df_clean, numeric_cols)
    print("✅ Outliers handled")
    
    # Engineer features
    df_featured, metadata = preprocessor.engineer_features(df_clean, numeric_columns=numeric_cols)
    print(f"✅ Features: {len(metadata.feature_names)} total")
    
    # Prepare for anomaly detection
    X, meta = preprocessor.prepare_for_anomaly_detection(df_clean, numeric_cols)
    print(f"✅ Anomaly detection ready: {X.shape}")
    
    print("\n✅ Preprocessing pipeline complete!")
