// Pattern Recognition for GATI Platform
// Identifies patterns, correlations, and insights in data

import type { DailyTrend, StateAggregation } from '../data/types';
import _ from 'lodash';

export interface Pattern {
  type: 'seasonal' | 'cyclical' | 'trend' | 'correlation' | 'cluster';
  name: string;
  description: string;
  strength: number; // 0-100
  confidence: number; // 0-100
  details: Record<string, any>;
}

export interface Correlation {
  metric1: string;
  metric2: string;
  coefficient: number; // -1 to 1
  strength: 'weak' | 'moderate' | 'strong';
  interpretation: string;
}

/**
 * Detect all patterns in state data
 */
export function detectPatterns(state: StateAggregation): Pattern[] {
  const patterns: Pattern[] = [];
  
  // Seasonal patterns
  const seasonal = detectSeasonalPatterns(state.dailyTrends);
  if (seasonal) patterns.push(seasonal);
  
  // Cyclical patterns
  const cyclical = detectCyclicalPatterns(state.dailyTrends);
  if (cyclical) patterns.push(cyclical);
  
  // Trend patterns
  const trend = detectTrendPatterns(state.dailyTrends);
  if (trend) patterns.push(trend);
  
  return patterns.sort((a, b) => b.strength - a.strength);
}

/**
 * Detect seasonal patterns (weekly, monthly, yearly)
 */
function detectSeasonalPatterns(trends: DailyTrend[]): Pattern | null {
  if (trends.length < 14) return null;
  
  const enrolments = trends.map(t => t.enrolments);
  const mean = _.mean(enrolments);
  
  // Weekly pattern (7-day cycle)
  const weeklyGroups: number[][] = [[], [], [], [], [], [], []];
  trends.forEach((t, i) => {
    const dayOfWeek = new Date(t.date).getDay();
    weeklyGroups[dayOfWeek].push(enrolments[i]);
  });
  
  const weeklyMeans = weeklyGroups.map(g => _.mean(g));
  const weeklyVariance = calculateStdDev(weeklyMeans) / mean;
  
  if (weeklyVariance > 0.15) {
    const peakDay = weeklyMeans.indexOf(_.max(weeklyMeans)!);
    const lowDay = weeklyMeans.indexOf(_.min(weeklyMeans)!);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    return {
      type: 'seasonal',
      name: 'Weekly Seasonality',
      description: `Strong weekly pattern detected. Peak on ${dayNames[peakDay]}, lowest on ${dayNames[lowDay]}.`,
      strength: Math.min(100, Math.round(weeklyVariance * 500)),
      confidence: 85,
      details: {
        cycle: 'weekly',
        peakDay: dayNames[peakDay],
        lowDay: dayNames[lowDay],
        variance: Math.round(weeklyVariance * 100 * 10) / 10,
      },
    };
  }
  
  // Monthly pattern (if enough data)
  if (trends.length >= 60) {
    const monthlyGroups: number[][] = Array(30).fill(null).map(() => []);
    trends.forEach((t, i) => {
      const dayOfMonth = new Date(t.date).getDate();
      monthlyGroups[dayOfMonth - 1].push(enrolments[i]);
    });
    
    const monthlyMeans = monthlyGroups.filter(g => g.length > 0).map(g => _.mean(g));
    if (monthlyMeans.length > 0) {
      const monthlyVariance = calculateStdDev(monthlyMeans) / mean;
      
      if (monthlyVariance > 0.1) {
        return {
          type: 'seasonal',
          name: 'Monthly Seasonality',
          description: 'Monthly pattern detected in enrolment data.',
          strength: Math.min(100, Math.round(monthlyVariance * 400)),
          confidence: 75,
          details: {
            cycle: 'monthly',
            variance: Math.round(monthlyVariance * 100 * 10) / 10,
          },
        };
      }
    }
  }
  
  return null;
}

/**
 * Detect cyclical patterns (non-seasonal cycles)
 */
function detectCyclicalPatterns(trends: DailyTrend[]): Pattern | null {
  if (trends.length < 30) return null;
  
  const enrolments = trends.map(t => t.enrolments);
  
  // Use autocorrelation to detect cycles
  const maxLag = Math.min(30, Math.floor(trends.length / 2));
  let maxCorrelation = 0;
  let bestLag = 0;
  
  for (let lag = 7; lag <= maxLag; lag++) {
    const correlation = calculateAutocorrelation(enrolments, lag);
    if (correlation > maxCorrelation) {
      maxCorrelation = correlation;
      bestLag = lag;
    }
  }
  
  if (maxCorrelation > 0.5 && bestLag > 0) {
    return {
      type: 'cyclical',
      name: `Cyclical Pattern (${bestLag}-day cycle)`,
      description: `Strong ${bestLag}-day cycle detected in enrolment patterns.`,
      strength: Math.round(maxCorrelation * 100),
      confidence: 80,
      details: {
        cycleLength: bestLag,
        correlation: Math.round(maxCorrelation * 100 * 10) / 10,
      },
    };
  }
  
  return null;
}

/**
 * Detect trend patterns (growth, decline, stability)
 */
function detectTrendPatterns(trends: DailyTrend[]): Pattern | null {
  if (trends.length < 14) return null;
  
  const enrolments = trends.map(t => t.enrolments);
  const dates = trends.map(t => new Date(t.date).getTime());
  
  // Linear regression
  const n = enrolments.length;
  const sumX = _.sum(dates);
  const sumY = _.sum(enrolments);
  const sumXY = _.sum(dates.map((x, i) => x * enrolments[i]));
  const sumX2 = _.sum(dates.map(x => x * x));
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Calculate R-squared
  const yMean = sumY / n;
  const ssRes = _.sum(enrolments.map((y, i) => Math.pow(y - (slope * dates[i] + intercept), 2)));
  const ssTot = _.sum(enrolments.map(y => Math.pow(y - yMean, 2)));
  const rSquared = 1 - (ssRes / ssTot);
  
  // Convert slope to daily change
  const msPerDay = 24 * 60 * 60 * 1000;
  const dailyChange = slope * msPerDay;
  const percentChange = (dailyChange / yMean) * 100;
  
  if (rSquared > 0.7) {
    const trendType = slope > 0 ? 'growth' : slope < 0 ? 'decline' : 'stable';
    const strength = Math.abs(percentChange);
    
    return {
      type: 'trend',
      name: `${trendType.charAt(0).toUpperCase() + trendType.slice(1)} Trend`,
      description: `${trendType === 'growth' ? 'Growing' : trendType === 'decline' ? 'Declining' : 'Stable'} trend with ${Math.abs(percentChange).toFixed(2)}% daily change.`,
      strength: Math.min(100, Math.round(strength * 10)),
      confidence: Math.round(rSquared * 100),
      details: {
        trendType,
        dailyChange: Math.round(dailyChange * 10) / 10,
        percentChange: Math.round(percentChange * 10) / 10,
        rSquared: Math.round(rSquared * 100 * 10) / 10,
      },
    };
  }
  
  return null;
}

/**
 * Find correlations between metrics
 */
export function findCorrelations(state: StateAggregation): Correlation[] {
  const correlations: Correlation[] = [];
  
  if (state.dailyTrends.length < 10) return correlations;
  
  const enrolments = state.dailyTrends.map(t => t.enrolments);
  const biometric = state.dailyTrends.map(t => t.biometricUpdates);
  const demographic = state.dailyTrends.map(t => t.demographicUpdates);
  
  // Enrolments vs Biometric
  const corr1 = calculateCorrelation(enrolments, biometric);
  if (Math.abs(corr1) > 0.3) {
    correlations.push({
      metric1: 'enrolments',
      metric2: 'biometric_updates',
      coefficient: Math.round(corr1 * 1000) / 1000,
      strength: Math.abs(corr1) > 0.7 ? 'strong' : Math.abs(corr1) > 0.5 ? 'moderate' : 'weak',
      interpretation: corr1 > 0 
        ? 'Enrolments and biometric updates move together positively.'
        : 'Enrolments and biometric updates show inverse relationship.',
    });
  }
  
  // Enrolments vs Demographic
  const corr2 = calculateCorrelation(enrolments, demographic);
  if (Math.abs(corr2) > 0.3) {
    correlations.push({
      metric1: 'enrolments',
      metric2: 'demographic_updates',
      coefficient: Math.round(corr2 * 1000) / 1000,
      strength: Math.abs(corr2) > 0.7 ? 'strong' : Math.abs(corr2) > 0.5 ? 'moderate' : 'weak',
      interpretation: corr2 > 0
        ? 'Enrolments and demographic updates are positively correlated.'
        : 'Enrolments and demographic updates show inverse relationship.',
    });
  }
  
  // Biometric vs Demographic
  const corr3 = calculateCorrelation(biometric, demographic);
  if (Math.abs(corr3) > 0.3) {
    correlations.push({
      metric1: 'biometric_updates',
      metric2: 'demographic_updates',
      coefficient: Math.round(corr3 * 1000) / 1000,
      strength: Math.abs(corr3) > 0.7 ? 'strong' : Math.abs(corr3) > 0.5 ? 'moderate' : 'weak',
      interpretation: corr3 > 0
        ? 'Biometric and demographic updates tend to occur together.'
        : 'Biometric and demographic updates show inverse relationship.',
    });
  }
  
  return correlations;
}

/**
 * Cluster states by similarity
 */
export function clusterStates(
  states: StateAggregation[],
  k: number = 5
): Array<{ cluster: number; states: StateAggregation[]; centroid: Record<string, number> }> {
  if (states.length < k) {
    return states.map((state, i) => ({
      cluster: i,
      states: [state],
      centroid: {
        coverage: state.coverage,
        freshness: state.freshness,
        enrolments: state.totalEnrolments,
      },
    }));
  }
  
  // Normalize features
  const features = states.map(s => ({
    coverage: s.coverage / 100,
    freshness: s.freshness / 100,
    enrolments: Math.log10(s.totalEnrolments + 1) / 10,
  }));
  
  // Simple k-means clustering
  const clusters = kMeansClustering(features, k);
  
  return clusters.map((cluster, i) => ({
    cluster: i,
    states: cluster.map(idx => states[idx]),
    centroid: {
      coverage: _.mean(cluster.map(idx => states[idx].coverage)),
      freshness: _.mean(cluster.map(idx => states[idx].freshness)),
      enrolments: _.mean(cluster.map(idx => states[idx].totalEnrolments)),
    },
  }));
}

// Helper functions
function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = _.mean(values);
  const variance = _.mean(values.map(v => Math.pow(v - mean, 2)));
  return Math.sqrt(variance);
}

function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;
  
  const n = x.length;
  const meanX = _.mean(x);
  const meanY = _.mean(y);
  
  const numerator = _.sum(x.map((xi, i) => (xi - meanX) * (y[i] - meanY)));
  const denomX = Math.sqrt(_.sum(x.map(xi => Math.pow(xi - meanX, 2))));
  const denomY = Math.sqrt(_.sum(y.map(yi => Math.pow(yi - meanY, 2))));
  
  if (denomX === 0 || denomY === 0) return 0;
  return numerator / (denomX * denomY);
}

function calculateAutocorrelation(data: number[], lag: number): number {
  if (lag >= data.length) return 0;
  
  const n = data.length - lag;
  const mean = _.mean(data);
  
  const numerator = _.sum(Array.from({ length: n }, (_, i) => 
    (data[i] - mean) * (data[i + lag] - mean)
  ));
  
  const denominator = _.sum(data.map(d => Math.pow(d - mean, 2)));
  
  if (denominator === 0) return 0;
  return numerator / denominator;
}

function kMeansClustering(
  features: Array<{ coverage: number; freshness: number; enrolments: number }>,
  k: number,
  maxIterations: number = 100
): number[][] {
  const n = features.length;
  
  // Initialize centroids randomly
  let centroids = Array.from({ length: k }, () => {
    const randomIdx = Math.floor(Math.random() * n);
    return { ...features[randomIdx] };
  });
  
  let clusters: number[][] = [];
  
  for (let iter = 0; iter < maxIterations; iter++) {
    // Assign points to nearest centroid
    clusters = Array(k).fill(null).map(() => []);
    
    features.forEach((feature, idx) => {
      let minDist = Infinity;
      let nearestCluster = 0;
      
      centroids.forEach((centroid, cIdx) => {
        const dist = Math.sqrt(
          Math.pow(feature.coverage - centroid.coverage, 2) +
          Math.pow(feature.freshness - centroid.freshness, 2) +
          Math.pow(feature.enrolments - centroid.enrolments, 2)
        );
        
        if (dist < minDist) {
          minDist = dist;
          nearestCluster = cIdx;
        }
      });
      
      clusters[nearestCluster].push(idx);
    });
    
    // Update centroids
    let changed = false;
    centroids = centroids.map((centroid, cIdx) => {
      if (clusters[cIdx].length === 0) return centroid;
      
      const newCentroid = {
        coverage: _.mean(clusters[cIdx].map(idx => features[idx].coverage)),
        freshness: _.mean(clusters[cIdx].map(idx => features[idx].freshness)),
        enrolments: _.mean(clusters[cIdx].map(idx => features[idx].enrolments)),
      };
      
      if (Math.abs(newCentroid.coverage - centroid.coverage) > 0.001) {
        changed = true;
      }
      
      return newCentroid;
    });
    
    if (!changed) break;
  }
  
  return clusters;
}

