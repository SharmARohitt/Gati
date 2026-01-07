// Advanced Risk Scoring for GATI Platform
// Multi-factor risk assessment for government-grade analysis

import type { StateAggregation, RiskLevel } from '../data/types';
import _ from 'lodash';

export interface RiskFactors {
  coverageRisk: number;      // 0-100
  freshnessRisk: number;      // 0-100
  volumeRisk: number;         // 0-100
  trendRisk: number;          // 0-100
  consistencyRisk: number;    // 0-100
  geographicRisk: number;     // 0-100
}

export interface RiskScore {
  overall: number;            // 0-100, higher = more risk
  level: RiskLevel;
  factors: RiskFactors;
  breakdown: {
    factor: string;
    score: number;
    weight: number;
    contribution: number;
  }[];
  recommendations: string[];
}

/**
 * Calculate comprehensive risk score for a state
 */
export function calculateAdvancedRiskScore(
  state: StateAggregation,
  nationalAverage: {
    coverage: number;
    freshness: number;
    avgEnrolments: number;
  }
): RiskScore {
  const factors: RiskFactors = {
    coverageRisk: calculateCoverageRisk(state.coverage, nationalAverage.coverage),
    freshnessRisk: calculateFreshnessRisk(state.freshness, nationalAverage.freshness),
    volumeRisk: calculateVolumeRisk(state.totalEnrolments, nationalAverage.avgEnrolments),
    trendRisk: calculateTrendRisk(state.dailyTrends),
    consistencyRisk: calculateConsistencyRisk(state.dailyTrends),
    geographicRisk: calculateGeographicRisk(state),
  };
  
  // Weighted risk calculation
  const weights = {
    coverageRisk: 0.25,      // Most important
    freshnessRisk: 0.20,     // Very important
    volumeRisk: 0.15,        // Important
    trendRisk: 0.15,         // Important
    consistencyRisk: 0.15,    // Important
    geographicRisk: 0.10,    // Less critical
  };
  
  const overall = 
    factors.coverageRisk * weights.coverageRisk +
    factors.freshnessRisk * weights.freshnessRisk +
    factors.volumeRisk * weights.volumeRisk +
    factors.trendRisk * weights.trendRisk +
    factors.consistencyRisk * weights.consistencyRisk +
    factors.geographicRisk * weights.geographicRisk;
  
  const level = getRiskLevel(overall);
  
  // Generate breakdown
  const breakdown = Object.entries(factors).map(([factor, score]) => ({
    factor: factor.replace('Risk', ''),
    score: Math.round(score * 10) / 10,
    weight: weights[factor as keyof typeof weights],
    contribution: Math.round((score * weights[factor as keyof typeof weights]) * 10) / 10,
  }));
  
  // Generate recommendations
  const recommendations = generateRiskRecommendations(factors, state, overall);
  
  return {
    overall: Math.round(overall * 10) / 10,
    level,
    factors,
    breakdown,
    recommendations,
  };
}

/**
 * Coverage risk: Lower coverage = higher risk
 */
function calculateCoverageRisk(
  coverage: number,
  nationalAverage: number
): number {
  if (coverage >= 98) return 0;
  if (coverage >= 95) return 20;
  if (coverage >= 90) return 40;
  if (coverage >= 85) return 60;
  if (coverage >= 80) return 80;
  return 100;
}

/**
 * Freshness risk: Lower freshness = higher risk
 */
function calculateFreshnessRisk(
  freshness: number,
  nationalAverage: number
): number {
  if (freshness >= 95) return 0;
  if (freshness >= 90) return 15;
  if (freshness >= 85) return 30;
  if (freshness >= 80) return 50;
  if (freshness >= 75) return 70;
  return 90;
}

/**
 * Volume risk: Very low or very high volumes can indicate issues
 */
function calculateVolumeRisk(
  totalEnrolments: number,
  nationalAverage: number
): number {
  if (totalEnrolments === 0) return 100;
  
  const ratio = totalEnrolments / nationalAverage;
  
  // Too low volume
  if (ratio < 0.1) return 80;
  if (ratio < 0.3) return 50;
  if (ratio < 0.5) return 30;
  
  // Normal range
  if (ratio >= 0.5 && ratio <= 2.0) return 10;
  
  // Very high volume (might indicate data quality issues)
  if (ratio > 5) return 40;
  if (ratio > 3) return 20;
  
  return 15;
}

/**
 * Trend risk: Declining trends indicate problems
 */
export function calculateTrendRisk(trends: Array<{ enrolments: number }>): number {
  if (trends.length < 7) return 30; // Insufficient data
  
  const recent = trends.slice(-7);
  const older = trends.slice(-14, -7);
  
  if (older.length === 0) return 20;
  
  const recentAvg = _.mean(recent.map(t => t.enrolments));
  const olderAvg = _.mean(older.map(t => t.enrolments));
  
  if (olderAvg === 0) return 20;
  
  const decline = ((olderAvg - recentAvg) / olderAvg) * 100;
  
  if (decline > 30) return 90;
  if (decline > 20) return 70;
  if (decline > 10) return 50;
  if (decline > 5) return 30;
  if (decline < -20) return 20; // Rapid growth might indicate issues too
  
  return 10;
}

/**
 * Consistency risk: High variance indicates instability
 */
export function calculateConsistencyRisk(trends: Array<{ enrolments: number }>): number {
  if (trends.length < 7) return 25;
  
  const values = trends.map(t => t.enrolments);
  const mean = _.mean(values);
  
  if (mean === 0) return 50;
  
  const std = calculateStdDev(values);
  const cv = (std / mean) * 100; // Coefficient of variation
  
  if (cv > 100) return 80;
  if (cv > 70) return 60;
  if (cv > 50) return 40;
  if (cv > 30) return 25;
  
  return 10;
}

/**
 * Geographic risk: Sparse coverage or concentration issues
 */
function calculateGeographicRisk(state: StateAggregation): number {
  // Low district/pincode coverage relative to enrolments
  const enrolmentsPerDistrict = state.totalEnrolments / Math.max(1, state.districtsCount);
  const enrolmentsPerPincode = state.totalEnrolments / Math.max(1, state.pincodesCount);
  
  // Very high concentration (few districts/pincodes with many enrolments) = risk
  if (enrolmentsPerDistrict > 1000000) return 60;
  if (enrolmentsPerDistrict > 500000) return 40;
  if (enrolmentsPerDistrict > 200000) return 20;
  
  // Very sparse (many districts/pincodes with few enrolments) = risk
  if (enrolmentsPerDistrict < 1000 && state.totalEnrolments > 10000) return 50;
  if (enrolmentsPerPincode < 10 && state.totalEnrolments > 1000) return 40;
  
  return 15;
}

/**
 * Convert numeric risk score to risk level
 */
function getRiskLevel(score: number): RiskLevel {
  if (score >= 75) return 'critical';
  if (score >= 55) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
}

/**
 * Generate actionable recommendations based on risk factors
 */
function generateRiskRecommendations(
  factors: RiskFactors,
  state: StateAggregation,
  overall: number
): string[] {
  const recommendations: string[] = [];
  
  if (factors.coverageRisk > 60) {
    recommendations.push(
      `Urgent: Coverage at ${state.coverage}% is critically low. Deploy mobile enrolment units to ${state.stateName} immediately.`
    );
  } else if (factors.coverageRisk > 40) {
    recommendations.push(
      `Increase enrolment capacity in ${state.stateName} to improve coverage from ${state.coverage}% to target 95%+.`
    );
  }
  
  if (factors.freshnessRisk > 60) {
    recommendations.push(
      `Initiate biometric update campaign in ${state.stateName}. Freshness index at ${state.freshness}% requires immediate attention.`
    );
  } else if (factors.freshnessRisk > 40) {
    recommendations.push(
      `Plan proactive biometric update drives in ${state.stateName} to maintain data freshness.`
    );
  }
  
  if (factors.trendRisk > 60) {
    recommendations.push(
      `Declining enrolment trends detected in ${state.stateName}. Investigate barriers and deploy targeted interventions.`
    );
  }
  
  if (factors.consistencyRisk > 50) {
    recommendations.push(
      `High data variability in ${state.stateName} suggests operational inconsistencies. Standardize processes across districts.`
    );
  }
  
  if (factors.volumeRisk > 50) {
    recommendations.push(
      `Unusual enrolment volume patterns in ${state.stateName}. Verify data quality and investigate root causes.`
    );
  }
  
  if (overall >= 75) {
    recommendations.push(
      `🚨 CRITICAL: ${state.stateName} requires immediate executive attention. Deploy emergency response team.`
    );
  } else if (overall >= 55) {
    recommendations.push(
      `High priority: ${state.stateName} needs focused intervention within 30 days.`
    );
  }
  
  if (recommendations.length === 0) {
    recommendations.push(
      `${state.stateName} is performing within acceptable parameters. Continue regular monitoring.`
    );
  }
  
  return recommendations;
}

function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = _.mean(values);
  const variance = _.mean(values.map(v => Math.pow(v - mean, 2)));
  return Math.sqrt(variance);
}

/**
 * Compare risk scores across states
 */
export function compareRiskScores(
  states: StateAggregation[],
  nationalAverage: {
    coverage: number;
    freshness: number;
    avgEnrolments: number;
  }
): {
  highestRisk: StateAggregation & { riskScore: RiskScore };
  lowestRisk: StateAggregation & { riskScore: RiskScore };
  riskDistribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
} {
  const statesWithRisk = states.map(state => ({
    ...state,
    riskScore: calculateAdvancedRiskScore(state, nationalAverage),
  }));
  
  const sorted = [...statesWithRisk].sort((a, b) => 
    b.riskScore.overall - a.riskScore.overall
  );
  
  const distribution = {
    critical: statesWithRisk.filter(s => s.riskScore.level === 'critical').length,
    high: statesWithRisk.filter(s => s.riskScore.level === 'high').length,
    medium: statesWithRisk.filter(s => s.riskScore.level === 'medium').length,
    low: statesWithRisk.filter(s => s.riskScore.level === 'low').length,
  };
  
  return {
    highestRisk: sorted[0],
    lowestRisk: sorted[sorted.length - 1],
    riskDistribution: distribution,
  };
}

