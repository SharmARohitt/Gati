// GATI Data Types - Real Aadhaar Data Integration

// ============================================
// RAW CSV RECORD TYPES
// ============================================

export interface BiometricRecord {
  date: string;
  state: string;
  district: string;
  pincode: string;
  bio_age_5_17: number;
  bio_age_17_: number;
}

export interface DemographicRecord {
  date: string;
  state: string;
  district: string;
  pincode: string;
  demo_age_5_17: number;
  demo_age_17_: number;
}

export interface EnrolmentRecord {
  date: string;
  state: string;
  district: string;
  pincode: string;
  age_0_5: number;
  age_5_17: number;
  age_18_greater: number;
}

// ============================================
// AGGREGATED DATA TYPES
// ============================================

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface StateAggregation {
  stateCode: string;
  stateName: string;
  totalEnrolments: number;
  totalBiometricUpdates: number;
  totalDemographicUpdates: number;
  districtsCount: number;
  pincodesCount: number;
  ageDistribution: {
    infants: number;      // 0-5
    children: number;     // 5-17
    adults: number;       // 18+
  };
  coverage: number;       // Calculated percentage (0-100)
  freshness: number;      // Based on recent updates (0-100)
  riskLevel: RiskLevel;
  dailyTrends: DailyTrend[];
}

export interface DistrictAggregation {
  districtName: string;
  stateName: string;
  totalEnrolments: number;
  totalBiometricUpdates: number;
  totalDemographicUpdates: number;
  pincodesCount: number;
  pincodes: string[];
  ageDistribution: {
    infants: number;
    children: number;
    adults: number;
  };
}

export interface PincodeAggregation {
  pincode: string;
  districtName: string;
  stateName: string;
  totalEnrolments: number;
  totalBiometricUpdates: number;
  totalDemographicUpdates: number;
  ageDistribution: {
    infants: number;
    children: number;
    adults: number;
  };
}

export interface DailyTrend {
  date: string;
  enrolments: number;
  biometricUpdates: number;
  demographicUpdates: number;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface NationalOverview {
  totalEnrolments: number;
  totalBiometricUpdates: number;
  totalDemographicUpdates: number;
  nationalCoverage: number;
  freshnessIndex: number;
  statesCount: number;
  districtsCount: number;
  pincodesCount: number;
  ageBreakdown: {
    age0To5: number;
    age5To17: number;
    age18Plus: number;
  };
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  topPerformingStates: StateAggregation[];
  highRiskStates: StateAggregation[];
  recentTrends: DailyTrend[];
  lastUpdated: string;
}

export interface StateDetailResponse {
  state: StateAggregation;
  districts: DistrictAggregation[];
  trends: DailyTrend[];
}

export interface TrendAnalysis {
  period: string;
  startDate: string;
  endDate: string;
  trends: DailyTrend[];
  growth: {
    enrolmentGrowth: number;
    biometricGrowth: number;
    demographicGrowth: number;
  };
}

export interface AnomalyDetection {
  id: string;
  type: 'spike' | 'drop' | 'pattern' | 'gap';
  location: string;
  state: string;
  district?: string;
  metric: string;
  value: number;
  expectedValue: number;
  deviation: number;
  deviationPercent: number;
  confidence: number;
  severity: RiskLevel;
  detectedAt: string;
  description: string;
}

export interface AIInsightResponse {
  anomalies: AnomalyDetection[];
  predictions: {
    nextMonthEnrolments: number;
    nextMonthBiometric: number;
    nextMonthDemographic: number;
    confidence: number;
  };
  recommendations: string[];
}

// ============================================
// STATE CODE MAPPING
// ============================================

export const STATE_CODE_MAP: Record<string, string> = {
  'Andhra Pradesh': 'AP',
  'Arunachal Pradesh': 'AR',
  'Assam': 'AS',
  'Bihar': 'BR',
  'Chhattisgarh': 'CT',
  'Goa': 'GA',
  'Gujarat': 'GJ',
  'Haryana': 'HR',
  'Himachal Pradesh': 'HP',
  'Jharkhand': 'JH',
  'Karnataka': 'KA',
  'Kerala': 'KL',
  'Madhya Pradesh': 'MP',
  'Maharashtra': 'MH',
  'Manipur': 'MN',
  'Meghalaya': 'ML',
  'Mizoram': 'MZ',
  'Nagaland': 'NL',
  'Odisha': 'OR',
  'Punjab': 'PB',
  'Rajasthan': 'RJ',
  'Sikkim': 'SK',
  'Tamil Nadu': 'TN',
  'Telangana': 'TS',
  'Tripura': 'TR',
  'Uttar Pradesh': 'UP',
  'Uttarakhand': 'UK',
  'West Bengal': 'WB',
  'Andaman and Nicobar Islands': 'AN',
  'Chandigarh': 'CH',
  'Dadra and Nagar Haveli and Daman and Diu': 'DD',
  'Delhi': 'DL',
  'Jammu and Kashmir': 'JK',
  'Ladakh': 'LA',
  'Lakshadweep': 'LD',
  'Puducherry': 'PY',
};

// Reverse mapping
export const CODE_TO_STATE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_CODE_MAP).map(([name, code]) => [code, name])
);

// Population estimates for coverage calculation (in millions)
export const STATE_POPULATION: Record<string, number> = {
  'UP': 231.5,
  'MH': 126.2,
  'BR': 127.6,
  'WB': 100.9,
  'MP': 85.4,
  'TN': 77.8,
  'RJ': 81.0,
  'KA': 67.6,
  'GJ': 70.4,
  'AP': 53.9,
  'OR': 46.4,
  'TS': 39.4,
  'KL': 35.7,
  'JH': 40.1,
  'AS': 35.6,
  'PB': 30.1,
  'CT': 30.0,
  'HR': 29.4,
  'DL': 20.4,
  'JK': 14.9,
  'UK': 11.9,
  'HP': 7.6,
  'TR': 4.2,
  'ML': 3.8,
  'MN': 3.2,
  'NL': 2.3,
  'GA': 1.6,
  'AR': 1.7,
  'MZ': 1.3,
  'SK': 0.7,
  'AN': 0.4,
  'LD': 0.07,
  'DD': 0.6,
  'PY': 1.6,
  'CH': 1.2,
  'LA': 0.3,
};
