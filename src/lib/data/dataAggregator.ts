// Data Aggregator for GATI Platform
// Aggregates raw CSV data into state, district, and pincode level metrics

import _ from 'lodash';
import type { 
  BiometricRecord, 
  DemographicRecord, 
  EnrolmentRecord,
  StateAggregation,
  DistrictAggregation,
  DailyTrend,
  RiskLevel,
  AnomalyDetection
} from './types';
import { STATE_CODE_MAP, STATE_POPULATION } from './types';
import { formatDateISO } from './csvParser';
import { ensembleAnomalyDetection, detectGaps } from '../ml/anomalyDetection';
import { calculateTrendRisk, calculateConsistencyRisk } from '../ml/riskScoring';

/**
 * Calculate state-level aggregations from all data sources
 */
export function aggregateByState(
  enrolmentData: EnrolmentRecord[],
  biometricData: BiometricRecord[],
  demographicData: DemographicRecord[]
): StateAggregation[] {
  // Group by state
  const enrolmentByState = _.groupBy(enrolmentData, 'state');
  const biometricByState = _.groupBy(biometricData, 'state');
  const demographicByState = _.groupBy(demographicData, 'state');

  // Get all unique states
  const allStates = _.uniq([
    ...Object.keys(enrolmentByState),
    ...Object.keys(biometricByState),
    ...Object.keys(demographicByState),
  ]);

  return allStates.map(stateName => {
    const enrolments = enrolmentByState[stateName] || [];
    const biometrics = biometricByState[stateName] || [];
    const demographics = demographicByState[stateName] || [];

    // Calculate totals
    const totalEnrolments = _.sumBy(enrolments, e => 
      (e.age_0_5 || 0) + (e.age_5_17 || 0) + (e.age_18_greater || 0)
    );
    
    const totalBiometricUpdates = _.sumBy(biometrics, b => 
      (b.bio_age_5_17 || 0) + (b.bio_age_17_ || 0)
    );
    
    const totalDemographicUpdates = _.sumBy(demographics, d => 
      (d.demo_age_5_17 || 0) + (d.demo_age_17_ || 0)
    );

    // Age distribution from enrolment data
    const ageDistribution = {
      infants: _.sumBy(enrolments, 'age_0_5') || 0,
      children: _.sumBy(enrolments, 'age_5_17') || 0,
      adults: _.sumBy(enrolments, 'age_18_greater') || 0,
    };

    // Unique districts and pincodes
    const allDistricts = _.uniq([
      ...enrolments.map(e => e.district),
      ...biometrics.map(b => b.district),
      ...demographics.map(d => d.district),
    ].filter(Boolean));

    const allPincodes = _.uniq([
      ...enrolments.map(e => e.pincode),
      ...biometrics.map(b => b.pincode),
      ...demographics.map(d => d.pincode),
    ].filter(Boolean));

    // Calculate coverage and freshness
    const stateCode = STATE_CODE_MAP[stateName] || 'XX';
    const population = (STATE_POPULATION[stateCode] || 10) * 1000000; // Convert millions to actual
    const coverage = Math.min(99.9, (totalEnrolments / population) * 100 + 85); // Base coverage + calculated
    
    // Freshness based on biometric updates ratio
    const freshness = Math.min(99, 75 + (totalBiometricUpdates / Math.max(1, totalEnrolments)) * 100);

    // Daily trends (must be calculated before risk level)
    const dailyTrends = calculateDailyTrends(enrolments, biometrics, demographics);

    // Calculate risk level (with trends for enhanced scoring)
    const riskLevel = calculateRiskLevel(coverage, freshness, totalEnrolments, dailyTrends);

    return {
      stateCode,
      stateName,
      totalEnrolments,
      totalBiometricUpdates,
      totalDemographicUpdates,
      districtsCount: allDistricts.length,
      pincodesCount: allPincodes.length,
      ageDistribution,
      coverage: Math.round(coverage * 10) / 10,
      freshness: Math.round(freshness * 10) / 10,
      riskLevel,
      dailyTrends: dailyTrends.slice(-30), // Last 30 days
    };
  }).sort((a, b) => b.totalEnrolments - a.totalEnrolments);
}

/**
 * Calculate district-level aggregations for a specific state
 */
export function aggregateByDistrict(
  stateName: string,
  enrolmentData: EnrolmentRecord[],
  biometricData: BiometricRecord[],
  demographicData: DemographicRecord[]
): DistrictAggregation[] {
  // Filter by state
  const stateEnrolments = enrolmentData.filter(e => e.state === stateName);
  const stateBiometrics = biometricData.filter(b => b.state === stateName);
  const stateDemographics = demographicData.filter(d => d.state === stateName);

  // Group by district
  const enrolmentByDistrict = _.groupBy(stateEnrolments, 'district');
  const biometricByDistrict = _.groupBy(stateBiometrics, 'district');
  const demographicByDistrict = _.groupBy(stateDemographics, 'district');

  const allDistricts = _.uniq([
    ...Object.keys(enrolmentByDistrict),
    ...Object.keys(biometricByDistrict),
    ...Object.keys(demographicByDistrict),
  ]);

  return allDistricts.map(districtName => {
    const enrolments = enrolmentByDistrict[districtName] || [];
    const biometrics = biometricByDistrict[districtName] || [];
    const demographics = demographicByDistrict[districtName] || [];

    const totalEnrolments = _.sumBy(enrolments, e => 
      (e.age_0_5 || 0) + (e.age_5_17 || 0) + (e.age_18_greater || 0)
    );
    
    const totalBiometricUpdates = _.sumBy(biometrics, b => 
      (b.bio_age_5_17 || 0) + (b.bio_age_17_ || 0)
    );
    
    const totalDemographicUpdates = _.sumBy(demographics, d => 
      (d.demo_age_5_17 || 0) + (d.demo_age_17_ || 0)
    );

    const pincodes = _.uniq([
      ...enrolments.map(e => String(e.pincode)),
      ...biometrics.map(b => String(b.pincode)),
      ...demographics.map(d => String(d.pincode)),
    ].filter(Boolean));

    return {
      districtName,
      stateName,
      totalEnrolments,
      totalBiometricUpdates,
      totalDemographicUpdates,
      pincodesCount: pincodes.length,
      pincodes,
      ageDistribution: {
        infants: _.sumBy(enrolments, 'age_0_5') || 0,
        children: _.sumBy(enrolments, 'age_5_17') || 0,
        adults: _.sumBy(enrolments, 'age_18_greater') || 0,
      },
    };
  }).sort((a, b) => b.totalEnrolments - a.totalEnrolments);
}

/**
 * Calculate daily trends from data
 */
export function calculateDailyTrends(
  enrolments: EnrolmentRecord[],
  biometrics: BiometricRecord[],
  demographics: DemographicRecord[]
): DailyTrend[] {
  // Group by date
  const enrolmentByDate = _.groupBy(enrolments, 'date');
  const biometricByDate = _.groupBy(biometrics, 'date');
  const demographicByDate = _.groupBy(demographics, 'date');

  const allDates = _.uniq([
    ...Object.keys(enrolmentByDate),
    ...Object.keys(biometricByDate),
    ...Object.keys(demographicByDate),
  ]).sort();

  return allDates.map(date => ({
    date: formatDateISO(date),
    enrolments: _.sumBy(enrolmentByDate[date] || [], e => 
      (e.age_0_5 || 0) + (e.age_5_17 || 0) + (e.age_18_greater || 0)
    ),
    biometricUpdates: _.sumBy(biometricByDate[date] || [], b => 
      (b.bio_age_5_17 || 0) + (b.bio_age_17_ || 0)
    ),
    demographicUpdates: _.sumBy(demographicByDate[date] || [], d => 
      (d.demo_age_5_17 || 0) + (d.demo_age_17_ || 0)
    ),
  }));
}

/**
 * Calculate risk level based on coverage and freshness
 * Enhanced with ML-based risk scoring when available
 */
export function calculateRiskLevel(
  coverage: number, 
  freshness: number,
  totalEnrolments: number,
  dailyTrends?: DailyTrend[]
): RiskLevel {
  // Basic weighted scoring (fallback)
  const coverageScore = coverage < 90 ? 0 : coverage < 95 ? 1 : coverage < 98 ? 2 : 3;
  const freshnessScore = freshness < 80 ? 0 : freshness < 85 ? 1 : freshness < 90 ? 2 : 3;
  const volumeScore = totalEnrolments < 10000 ? 0 : totalEnrolments < 100000 ? 1 : 2;
  
  const totalScore = coverageScore + freshnessScore + volumeScore;
  
  // Enhanced risk calculation if trends available
  if (dailyTrends && dailyTrends.length >= 7) {
    const trendRisk = calculateTrendRisk(dailyTrends);
    const consistencyRisk = calculateConsistencyRisk(dailyTrends);
    
    // Incorporate trend and consistency into scoring
    const trendScore = trendRisk > 60 ? 0 : trendRisk > 40 ? 1 : 2;
    const consistencyScore = consistencyRisk > 50 ? 0 : consistencyRisk > 30 ? 1 : 2;
    
    const enhancedScore = totalScore + trendScore + consistencyScore;
    
    if (enhancedScore <= 3) return 'critical';
    if (enhancedScore <= 5) return 'high';
    if (enhancedScore <= 7) return 'medium';
    return 'low';
  }
  
  // Basic scoring
  if (totalScore <= 2) return 'critical';
  if (totalScore <= 4) return 'high';
  if (totalScore <= 6) return 'medium';
  return 'low';
}

/**
 * Detect anomalies in the data using advanced ML methods
 */
export function detectAnomalies(
  trends: DailyTrend[],
  stateName: string
): AnomalyDetection[] {
  if (trends.length < 3) return [];

  const anomalies: AnomalyDetection[] = [];
  
  // Detect anomalies for each metric
  const enrolmentAnomalies = ensembleAnomalyDetection(trends, stateName, 'enrolments');
  const biometricAnomalies = ensembleAnomalyDetection(trends, stateName, 'biometricUpdates');
  const demographicAnomalies = ensembleAnomalyDetection(trends, stateName, 'demographicUpdates');
  
  // Detect gaps
  const enrolmentGaps = detectGaps(trends, stateName, 'enrolments');
  const biometricGaps = detectGaps(trends, stateName, 'biometricUpdates');
  const demographicGaps = detectGaps(trends, stateName, 'demographicUpdates');
  
  // Combine all anomalies
  anomalies.push(
    ...enrolmentAnomalies,
    ...biometricAnomalies,
    ...demographicAnomalies,
    ...enrolmentGaps,
    ...biometricGaps,
    ...demographicGaps
  );
  
  // Deduplicate and sort
  const uniqueAnomalies = new Map<string, AnomalyDetection>();
  anomalies.forEach(anomaly => {
    const key = `${anomaly.detectedAt}-${anomaly.metric}`;
    const existing = uniqueAnomalies.get(key);
    if (!existing || anomaly.confidence > existing.confidence) {
      uniqueAnomalies.set(key, anomaly);
    }
  });
  
  return Array.from(uniqueAnomalies.values())
    .sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (sevDiff !== 0) return sevDiff;
      return b.confidence - a.confidence;
    })
    .slice(0, 15); // Return top 15 anomalies
}

/**
 * Calculate standard deviation
 */
function calculateStdDev(values: number[]): number {
  const n = values.length;
  if (n === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / n;
  return Math.sqrt(avgSquaredDiff);
}

/**
 * Calculate growth rates
 */
export function calculateGrowthRates(trends: DailyTrend[]) {
  if (trends.length < 2) {
    return { enrolmentGrowth: 0, biometricGrowth: 0, demographicGrowth: 0 };
  }

  const firstHalf = trends.slice(0, Math.floor(trends.length / 2));
  const secondHalf = trends.slice(Math.floor(trends.length / 2));

  const firstEnrol = _.sumBy(firstHalf, 'enrolments');
  const secondEnrol = _.sumBy(secondHalf, 'enrolments');
  
  const firstBio = _.sumBy(firstHalf, 'biometricUpdates');
  const secondBio = _.sumBy(secondHalf, 'biometricUpdates');
  
  const firstDemo = _.sumBy(firstHalf, 'demographicUpdates');
  const secondDemo = _.sumBy(secondHalf, 'demographicUpdates');

  return {
    enrolmentGrowth: firstEnrol ? Math.round(((secondEnrol - firstEnrol) / firstEnrol) * 100) : 0,
    biometricGrowth: firstBio ? Math.round(((secondBio - firstBio) / firstBio) * 100) : 0,
    demographicGrowth: firstDemo ? Math.round(((secondDemo - firstDemo) / firstDemo) * 100) : 0,
  };
}
