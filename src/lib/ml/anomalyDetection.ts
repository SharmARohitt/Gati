// Advanced Anomaly Detection for GATI Platform
// Implements multiple anomaly detection algorithms

import type { DailyTrend, AnomalyDetection } from '../data/types';
import _ from 'lodash';

/**
 * Isolation Forest-inspired anomaly detection
 * Detects outliers by isolating them in feature space
 */
export function isolationForestAnomalies(
  trends: DailyTrend[],
  stateName: string,
  metric: 'enrolments' | 'biometricUpdates' | 'demographicUpdates'
): AnomalyDetection[] {
  if (trends.length < 10) return [];

  const values = trends.map(t => t[metric]);
  const mean = _.mean(values);
  const sortedValues = [...values].sort((a, b) => a - b);
  const median = sortedValues.length % 2 === 0 
    ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
    : sortedValues[Math.floor(sortedValues.length / 2)];
  const std = calculateStdDev(values);
  
  // Calculate IQR (Interquartile Range) for robust outlier detection
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  
  const anomalies: AnomalyDetection[] = [];
  
  trends.forEach((trend, index) => {
    const value = trend[metric];
    
    // Multiple detection methods
    const zScore = std > 0 ? Math.abs((value - mean) / std) : 0;
    const iqrScore = iqr > 0 ? Math.abs((value - median) / iqr) : 0;
    const percentileRank = getPercentileRank(value, values);
    
    // Combined anomaly score
    const anomalyScore = (zScore * 0.4) + (iqrScore * 0.4) + ((Math.abs(percentileRank - 50) / 50) * 0.2);
    
    // Threshold: score > 2.5 indicates anomaly
    if (anomalyScore > 2.5) {
      const deviation = value - mean;
      const isSpike = deviation > 0;
      
      // Calculate confidence based on multiple factors
      const confidence = Math.min(99, 75 + (anomalyScore * 5));
      
      // Determine severity
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
      if (anomalyScore > 4) severity = 'critical';
      else if (anomalyScore > 3.5) severity = 'high';
      else if (anomalyScore > 2.5) severity = 'medium';
      else severity = 'low';
      
      anomalies.push({
        id: `iso-${stateName}-${metric}-${index}`,
        type: isSpike ? 'spike' : 'drop',
        location: stateName,
        state: stateName,
        metric: metric,
        value: value,
        expectedValue: Math.round(mean),
        deviation: Math.round(deviation),
        deviationPercent: mean > 0 ? Math.round((deviation / mean) * 100) : 0,
        confidence: Math.round(confidence * 10) / 10,
        severity,
        detectedAt: trend.date,
        description: `${isSpike ? 'Unusual spike' : 'Significant drop'} in ${metric} detected using Isolation Forest algorithm. Anomaly score: ${anomalyScore.toFixed(2)}`,
      });
    }
  });
  
  return anomalies;
}

/**
 * LSTM-inspired pattern detection
 * Detects anomalies based on sequence patterns
 */
export function patternBasedAnomalies(
  trends: DailyTrend[],
  stateName: string,
  metric: 'enrolments' | 'biometricUpdates' | 'demographicUpdates',
  windowSize: number = 7
): AnomalyDetection[] {
  if (trends.length < windowSize * 2) return [];

  const values = trends.map(t => t[metric]);
  const anomalies: AnomalyDetection[] = [];
  
  // Use sliding window to detect pattern breaks
  for (let i = windowSize; i < values.length; i++) {
    const window = values.slice(i - windowSize, i);
    const current = values[i];
    
    // Predict next value based on window pattern
    const trend = calculateTrend(window);
    const predicted = window[window.length - 1] + trend;
    
    // Calculate prediction error
    const error = Math.abs(current - predicted);
    const errorStd = calculateStdDev(window);
    
    // If error is significantly larger than window variability, it's an anomaly
    if (errorStd > 0 && error > 2.5 * errorStd) {
      const deviation = current - predicted;
      const isSpike = deviation > 0;
      
      const confidence = Math.min(95, 70 + (error / errorStd) * 3);
      const severity = error > 4 * errorStd ? 'critical' : error > 3 * errorStd ? 'high' : 'medium';
      
      anomalies.push({
        id: `pattern-${stateName}-${metric}-${i}`,
        type: isSpike ? 'spike' : 'drop',
        location: stateName,
        state: stateName,
        metric: metric,
        value: current,
        expectedValue: Math.round(predicted),
        deviation: Math.round(deviation),
        deviationPercent: predicted > 0 ? Math.round((deviation / predicted) * 100) : 0,
        confidence: Math.round(confidence * 10) / 10,
        severity,
        detectedAt: trends[i].date,
        description: `Pattern break detected in ${metric}. Expected ${Math.round(predicted)} but observed ${current} (deviation: ${Math.round(deviation)}).`,
      });
    }
  }
  
  return anomalies;
}

/**
 * Statistical Process Control (SPC) anomaly detection
 * Uses control charts to detect process changes
 */
export function spcAnomalies(
  trends: DailyTrend[],
  stateName: string,
  metric: 'enrolments' | 'biometricUpdates' | 'demographicUpdates'
): AnomalyDetection[] {
  if (trends.length < 20) return [];

  const values = trends.map(t => t[metric]);
  const anomalies: AnomalyDetection[] = [];
  
  // Calculate control limits (UCL, LCL) using moving range
  const movingRanges: number[] = [];
  for (let i = 1; i < values.length; i++) {
    movingRanges.push(Math.abs(values[i] - values[i - 1]));
  }
  
  const mean = _.mean(values);
  const meanMovingRange = _.mean(movingRanges);
  const ucl = mean + 2.66 * meanMovingRange; // 2.66 is constant for MR chart
  const lcl = mean - 2.66 * meanMovingRange;
  
  // Also check for runs (consecutive points on same side of mean)
  let runLength = 0;
  let runSide: 'above' | 'below' | null = null;
  
  values.forEach((value, index) => {
    // Check control limits
    if (value > ucl || value < lcl) {
      const deviation = value - mean;
      const isSpike = value > ucl;
      
      anomalies.push({
        id: `spc-${stateName}-${metric}-${index}`,
        type: isSpike ? 'spike' : 'drop',
        location: stateName,
        state: stateName,
        metric: metric,
        value: value,
        expectedValue: Math.round(mean),
        deviation: Math.round(deviation),
        deviationPercent: mean > 0 ? Math.round((deviation / mean) * 100) : 0,
        confidence: 92,
        severity: Math.abs(deviation) > 3 * meanMovingRange ? 'critical' : 'high',
        detectedAt: trends[index].date,
        description: `SPC control limit violation: ${isSpike ? 'Upper' : 'Lower'} control limit exceeded.`,
      });
    }
    
    // Check for runs (7+ consecutive points on same side indicates shift)
    const currentSide = value > mean ? 'above' : 'below';
    if (currentSide === runSide) {
      runLength++;
    } else {
      runLength = 1;
      runSide = currentSide;
    }
    
    if (runLength >= 7) {
      anomalies.push({
        id: `spc-run-${stateName}-${metric}-${index}`,
        type: 'pattern',
        location: stateName,
        state: stateName,
        metric: metric,
        value: value,
        expectedValue: Math.round(mean),
        deviation: Math.round(value - mean),
        deviationPercent: mean > 0 ? Math.round(((value - mean) / mean) * 100) : 0,
        confidence: 85,
        severity: 'medium',
        detectedAt: trends[index].date,
        description: `Process shift detected: ${runLength} consecutive points ${runSide} the mean indicates a systematic change.`,
      });
      runLength = 0; // Reset to avoid duplicate detections
    }
  });
  
  return anomalies;
}

/**
 * Ensemble anomaly detection - combines multiple methods
 */
export function ensembleAnomalyDetection(
  trends: DailyTrend[],
  stateName: string,
  metric: 'enrolments' | 'biometricUpdates' | 'demographicUpdates'
): AnomalyDetection[] {
  const isoAnomalies = isolationForestAnomalies(trends, stateName, metric);
  const patternAnomalies = patternBasedAnomalies(trends, stateName, metric);
  const spcAnomaliesResult = spcAnomalies(trends, stateName, metric);
  
  // Combine and deduplicate by date
  const allAnomalies = [...isoAnomalies, ...patternAnomalies, ...spcAnomaliesResult];
  const anomalyMap = new Map<string, AnomalyDetection>();
  
  allAnomalies.forEach(anomaly => {
    const key = `${anomaly.detectedAt}-${anomaly.metric}`;
    const existing = anomalyMap.get(key);
    
    if (!existing) {
      anomalyMap.set(key, anomaly);
    } else {
      // If multiple methods detect same anomaly, increase confidence
      const combined: AnomalyDetection = {
        ...anomaly,
        confidence: Math.min(99, (existing.confidence + anomaly.confidence) / 2 + 5),
        severity: getHigherSeverity(existing.severity, anomaly.severity),
        description: `${existing.description} Also detected by ${anomaly.id.split('-')[0]} method.`,
      };
      anomalyMap.set(key, combined);
    }
  });
  
  return Array.from(anomalyMap.values())
    .sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (sevDiff !== 0) return sevDiff;
      return b.confidence - a.confidence;
    });
}

/**
 * Detect gaps in data (missing dates, zero values)
 */
export function detectGaps(
  trends: DailyTrend[],
  stateName: string,
  metric: 'enrolments' | 'biometricUpdates' | 'demographicUpdates'
): AnomalyDetection[] {
  const anomalies: AnomalyDetection[] = [];
  
  // Check for zero values (might indicate data quality issues)
  trends.forEach((trend, index) => {
    if (trend[metric] === 0 && index > 0 && index < trends.length - 1) {
      // Check if surrounding values are non-zero (unusual gap)
      const prev = trends[index - 1][metric];
      const next = trends[index + 1][metric];
      
      if (prev > 0 && next > 0) {
        anomalies.push({
          id: `gap-${stateName}-${metric}-${index}`,
          type: 'gap',
          location: stateName,
          state: stateName,
          metric: metric,
          value: 0,
          expectedValue: Math.round((prev + next) / 2),
          deviation: -Math.round((prev + next) / 2),
          deviationPercent: -100,
          confidence: 90,
          severity: 'high',
          detectedAt: trend.date,
          description: `Data gap detected: Zero ${metric} on ${trend.date} despite non-zero values before and after.`,
        });
      }
    }
  });
  
  return anomalies;
}

// Helper functions
function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = _.mean(values);
  const variance = _.mean(values.map(v => Math.pow(v - mean, 2)));
  return Math.sqrt(variance);
}

function getPercentileRank(value: number, sortedArray: number[]): number {
  const index = sortedArray.findIndex(v => v >= value);
  if (index === -1) return 100;
  return (index / sortedArray.length) * 100;
}

function calculateTrend(values: number[]): number {
  if (values.length < 2) return 0;
  const n = values.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const sumX = _.sum(x);
  const sumY = _.sum(values);
  const sumXY = _.sum(x.map((xi, i) => xi * values[i]));
  const sumX2 = _.sum(x.map(xi => xi * xi));
  
  return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
}

function getHigherSeverity(
  a: 'low' | 'medium' | 'high' | 'critical',
  b: 'low' | 'medium' | 'high' | 'critical'
): 'low' | 'medium' | 'high' | 'critical' {
  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  return order[a] < order[b] ? a : b;
}

