"""
GATI ML Pipeline - Data Loader Module
=====================================
Handles loading, validation, and initial exploration of Aadhaar datasets.
Designed for government-grade data handling with full audit trail.
"""

import os
import glob
import pandas as pd
import numpy as np
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field
from loguru import logger
import yaml
import warnings

warnings.filterwarnings('ignore')


@dataclass
class DatasetSchema:
    """Schema definition for each dataset type."""
    name: str
    columns: List[str]
    date_column: str
    date_format: str
    numeric_columns: List[str]
    categorical_columns: List[str]


@dataclass
class DataQualityReport:
    """Data quality assessment report."""
    dataset_name: str
    total_records: int
    total_files: int
    date_range: Tuple[str, str]
    columns: List[str]
    missing_values: Dict[str, int]
    missing_percentages: Dict[str, float]
    unique_states: int
    unique_districts: int
    unique_pincodes: int
    numeric_stats: Dict[str, Dict[str, float]]
    data_issues: List[str]
    recommendations: List[str]


class GATIDataLoader:
    """
    Production-grade data loader for GATI ML Pipeline.
    Handles all three dataset types: biometric, demographic, enrolment.
    """
    
    # Dataset schemas based on actual CSV structure
    SCHEMAS = {
        'biometric': DatasetSchema(
            name='biometric',
            columns=['date', 'state', 'district', 'pincode', 'bio_age_5_17', 'bio_age_17_'],
            date_column='date',
            date_format='%d-%m-%Y',
            numeric_columns=['bio_age_5_17', 'bio_age_17_'],
            categorical_columns=['state', 'district', 'pincode']
        ),
        'demographic': DatasetSchema(
            name='demographic',
            columns=['date', 'state', 'district', 'pincode', 'demo_age_5_17', 'demo_age_17_'],
            date_column='date',
            date_format='%d-%m-%Y',
            numeric_columns=['demo_age_5_17', 'demo_age_17_'],
            categorical_columns=['state', 'district', 'pincode']
        ),
        'enrolment': DatasetSchema(
            name='enrolment',
            columns=['date', 'state', 'district', 'pincode', 'age_0_5', 'age_5_17', 'age_18_greater'],
            date_column='date',
            date_format='%d-%m-%Y',
            numeric_columns=['age_0_5', 'age_5_17', 'age_18_greater'],
            categorical_columns=['state', 'district', 'pincode']
        )
    }
    
    def __init__(self, config_path: str = 'config.yaml'):
        """Initialize data loader with configuration."""
        self.config = self._load_config(config_path)
        self.base_path = Path(self.config['data']['base_path'])
        self.datasets: Dict[str, pd.DataFrame] = {}
        self.quality_reports: Dict[str, DataQualityReport] = {}
        
        logger.info(f"GATI DataLoader initialized with base path: {self.base_path}")
    
    def _load_config(self, config_path: str) -> dict:
        """Load configuration from YAML file."""
        config_file = Path(__file__).parent / config_path
        if config_file.exists():
            with open(config_file, 'r') as f:
                return yaml.safe_load(f)
        else:
            logger.warning(f"Config file not found at {config_file}, using defaults")
            return self._default_config()
    
    def _default_config(self) -> dict:
        """Return default configuration."""
        return {
            'data': {
                'base_path': '../data',
                'datasets': {
                    'biometric': {'folder': 'biometric/api_data_aadhar_biometric', 'pattern': '*.csv'},
                    'demographic': {'folder': 'demographic/api_data_aadhar_demographic', 'pattern': '*.csv'},
                    'enrolment': {'folder': 'enrolment/api_data_aadhar_enrolment', 'pattern': '*.csv'}
                }
            }
        }
    
    def load_dataset(self, dataset_type: str) -> pd.DataFrame:
        """
        Load all CSV files for a specific dataset type.
        
        Args:
            dataset_type: One of 'biometric', 'demographic', 'enrolment'
            
        Returns:
            Combined DataFrame with all records
        """
        if dataset_type not in self.SCHEMAS:
            raise ValueError(f"Unknown dataset type: {dataset_type}. Valid: {list(self.SCHEMAS.keys())}")
        
        schema = self.SCHEMAS[dataset_type]
        dataset_config = self.config['data']['datasets'][dataset_type]
        folder_path = self.base_path / dataset_config['folder']
        
        if not folder_path.exists():
            raise FileNotFoundError(f"Dataset folder not found: {folder_path}")
        
        # Find all CSV files
        csv_files = list(folder_path.glob(dataset_config.get('pattern', '*.csv')))
        
        if not csv_files:
            raise FileNotFoundError(f"No CSV files found in {folder_path}")
        
        logger.info(f"Loading {len(csv_files)} files for {dataset_type} dataset...")
        
        # Load and concatenate all files
        dfs = []
        for csv_file in csv_files:
            try:
                df = pd.read_csv(csv_file, low_memory=False)
                dfs.append(df)
                logger.debug(f"Loaded {len(df)} records from {csv_file.name}")
            except Exception as e:
                logger.error(f"Failed to load {csv_file}: {e}")
        
        if not dfs:
            raise ValueError(f"No data loaded for {dataset_type}")
        
        # Combine all dataframes
        combined_df = pd.concat(dfs, ignore_index=True)
        
        # Parse dates
        combined_df[schema.date_column] = pd.to_datetime(
            combined_df[schema.date_column], 
            format=schema.date_format,
            errors='coerce'
        )
        
        # Sort by date
        combined_df = combined_df.sort_values(schema.date_column).reset_index(drop=True)
        
        # Store dataset
        self.datasets[dataset_type] = combined_df
        
        logger.info(f"✅ Loaded {len(combined_df):,} records for {dataset_type}")
        
        return combined_df
    
    def load_all_datasets(self) -> Dict[str, pd.DataFrame]:
        """Load all three datasets."""
        for dataset_type in self.SCHEMAS.keys():
            try:
                self.load_dataset(dataset_type)
            except Exception as e:
                logger.error(f"Failed to load {dataset_type}: {e}")
        
        return self.datasets
    
    def generate_quality_report(self, dataset_type: str) -> DataQualityReport:
        """
        Generate comprehensive data quality report.
        
        Args:
            dataset_type: Dataset to analyze
            
        Returns:
            DataQualityReport with all quality metrics
        """
        if dataset_type not in self.datasets:
            self.load_dataset(dataset_type)
        
        df = self.datasets[dataset_type]
        schema = self.SCHEMAS[dataset_type]
        
        # Basic stats
        total_records = len(df)
        
        # Date range
        date_col = df[schema.date_column]
        date_range = (
            date_col.min().strftime('%Y-%m-%d') if pd.notna(date_col.min()) else 'N/A',
            date_col.max().strftime('%Y-%m-%d') if pd.notna(date_col.max()) else 'N/A'
        )
        
        # Missing values
        missing_values = df.isnull().sum().to_dict()
        missing_percentages = {k: (v / total_records * 100) for k, v in missing_values.items()}
        
        # Unique counts
        unique_states = df['state'].nunique() if 'state' in df.columns else 0
        unique_districts = df['district'].nunique() if 'district' in df.columns else 0
        unique_pincodes = df['pincode'].nunique() if 'pincode' in df.columns else 0
        
        # Numeric stats
        numeric_stats = {}
        for col in schema.numeric_columns:
            if col in df.columns:
                numeric_stats[col] = {
                    'mean': df[col].mean(),
                    'std': df[col].std(),
                    'min': df[col].min(),
                    'max': df[col].max(),
                    'median': df[col].median(),
                    'q25': df[col].quantile(0.25),
                    'q75': df[col].quantile(0.75)
                }
        
        # Identify data issues
        data_issues = []
        recommendations = []
        
        # Check for missing dates
        missing_dates = df[schema.date_column].isnull().sum()
        if missing_dates > 0:
            data_issues.append(f"{missing_dates} records have missing/invalid dates")
            recommendations.append("Remove or impute records with missing dates")
        
        # Check for negative values in numeric columns
        for col in schema.numeric_columns:
            if col in df.columns:
                neg_count = (df[col] < 0).sum()
                if neg_count > 0:
                    data_issues.append(f"{neg_count} negative values in {col}")
                    recommendations.append(f"Set negative values in {col} to 0 or investigate source")
        
        # Check for extreme outliers
        for col in schema.numeric_columns:
            if col in df.columns:
                q1, q3 = df[col].quantile([0.25, 0.75])
                iqr = q3 - q1
                outliers = ((df[col] < q1 - 3*iqr) | (df[col] > q3 + 3*iqr)).sum()
                if outliers > total_records * 0.01:  # More than 1% outliers
                    data_issues.append(f"{outliers} extreme outliers in {col} (>{1}% of data)")
                    recommendations.append(f"Investigate outliers in {col} - may indicate data quality issues")
        
        # Check date continuity
        date_counts = df.groupby(df[schema.date_column].dt.date).size()
        if len(date_counts) > 0:
            expected_days = (date_col.max() - date_col.min()).days + 1
            actual_days = len(date_counts)
            if actual_days < expected_days * 0.8:  # Less than 80% of expected days
                data_issues.append(f"Missing data for {expected_days - actual_days} days in date range")
                recommendations.append("Check data collection process for gaps")
        
        report = DataQualityReport(
            dataset_name=dataset_type,
            total_records=total_records,
            total_files=len(list((self.base_path / self.config['data']['datasets'][dataset_type]['folder']).glob('*.csv'))),
            date_range=date_range,
            columns=list(df.columns),
            missing_values=missing_values,
            missing_percentages=missing_percentages,
            unique_states=unique_states,
            unique_districts=unique_districts,
            unique_pincodes=unique_pincodes,
            numeric_stats=numeric_stats,
            data_issues=data_issues if data_issues else ["No critical issues detected"],
            recommendations=recommendations if recommendations else ["Data quality is acceptable for ML training"]
        )
        
        self.quality_reports[dataset_type] = report
        return report
    
    def print_quality_report(self, dataset_type: str) -> None:
        """Print formatted quality report."""
        if dataset_type not in self.quality_reports:
            self.generate_quality_report(dataset_type)
        
        report = self.quality_reports[dataset_type]
        
        print("\n" + "="*70)
        print(f"📊 DATA QUALITY REPORT: {report.dataset_name.upper()}")
        print("="*70)
        
        print(f"\n📁 Total Records: {report.total_records:,}")
        print(f"📁 Total Files: {report.total_files}")
        print(f"📅 Date Range: {report.date_range[0]} to {report.date_range[1]}")
        print(f"🗺️  Unique States: {report.unique_states}")
        print(f"🏘️  Unique Districts: {report.unique_districts}")
        print(f"📍 Unique Pincodes: {report.unique_pincodes}")
        
        print(f"\n📋 Columns: {', '.join(report.columns)}")
        
        print("\n📈 Numeric Column Statistics:")
        for col, stats in report.numeric_stats.items():
            print(f"  {col}:")
            print(f"    Mean: {stats['mean']:,.2f} | Std: {stats['std']:,.2f}")
            print(f"    Min: {stats['min']:,.0f} | Max: {stats['max']:,.0f}")
            print(f"    Median: {stats['median']:,.2f} | IQR: [{stats['q25']:,.2f}, {stats['q75']:,.2f}]")
        
        print("\n⚠️  Data Issues:")
        for issue in report.data_issues:
            print(f"  • {issue}")
        
        print("\n💡 Recommendations:")
        for rec in report.recommendations:
            print(f"  • {rec}")
        
        print("\n" + "="*70)
    
    def get_aggregated_data(self, dataset_type: str, agg_level: str = 'state') -> pd.DataFrame:
        """
        Get data aggregated at specified level.
        
        Args:
            dataset_type: Dataset to aggregate
            agg_level: One of 'state', 'district', 'pincode', 'date'
            
        Returns:
            Aggregated DataFrame
        """
        if dataset_type not in self.datasets:
            self.load_dataset(dataset_type)
        
        df = self.datasets[dataset_type]
        schema = self.SCHEMAS[dataset_type]
        
        if agg_level == 'date':
            agg_df = df.groupby(schema.date_column)[schema.numeric_columns].sum().reset_index()
        elif agg_level == 'state':
            agg_df = df.groupby(['state', schema.date_column])[schema.numeric_columns].sum().reset_index()
        elif agg_level == 'district':
            agg_df = df.groupby(['state', 'district', schema.date_column])[schema.numeric_columns].sum().reset_index()
        elif agg_level == 'pincode':
            agg_df = df.groupby(['state', 'district', 'pincode', schema.date_column])[schema.numeric_columns].sum().reset_index()
        else:
            raise ValueError(f"Unknown aggregation level: {agg_level}")
        
        return agg_df
    
    def get_time_series(self, dataset_type: str, state: Optional[str] = None) -> pd.DataFrame:
        """
        Get time series data for ML training.
        
        Args:
            dataset_type: Dataset to use
            state: Optional state filter
            
        Returns:
            Time series DataFrame indexed by date
        """
        if dataset_type not in self.datasets:
            self.load_dataset(dataset_type)
        
        df = self.datasets[dataset_type]
        schema = self.SCHEMAS[dataset_type]
        
        if state:
            df = df[df['state'] == state]
        
        # Aggregate by date
        ts_df = df.groupby(schema.date_column)[schema.numeric_columns].sum()
        ts_df = ts_df.sort_index()
        
        # Add total column
        ts_df['total'] = ts_df[schema.numeric_columns].sum(axis=1)
        
        return ts_df


# Convenience function for quick loading
def load_gati_data(config_path: str = 'config.yaml') -> Tuple[Dict[str, pd.DataFrame], Dict[str, DataQualityReport]]:
    """
    Quick function to load all GATI data and generate quality reports.
    
    Returns:
        Tuple of (datasets dict, quality reports dict)
    """
    loader = GATIDataLoader(config_path)
    datasets = loader.load_all_datasets()
    
    reports = {}
    for dataset_type in datasets.keys():
        reports[dataset_type] = loader.generate_quality_report(dataset_type)
        loader.print_quality_report(dataset_type)
    
    return datasets, reports


if __name__ == "__main__":
    # Test the data loader
    logger.add("logs/data_loader.log", rotation="1 MB")
    
    print("🚀 GATI ML Pipeline - Data Loader Test")
    print("="*50)
    
    try:
        datasets, reports = load_gati_data()
        
        print("\n✅ All datasets loaded successfully!")
        print(f"\n📊 Summary:")
        for name, df in datasets.items():
            print(f"  • {name}: {len(df):,} records")
            
    except Exception as e:
        logger.error(f"Data loading failed: {e}")
        raise
