// Data Store Singleton for GATI Platform
// Manages loading, caching, and serving of all Aadhaar data

import type { 
  BiometricRecord, 
  DemographicRecord, 
  EnrolmentRecord,
  StateAggregation,
  DistrictAggregation,
  NationalOverview,
  DailyTrend,
  AnomalyDetection
} from './types';
import { STATE_CODE_MAP } from './types';
import { 
  loadBiometricData, 
  loadDemographicData, 
  loadEnrolmentData,
  getUniqueValues 
} from './csvParser';
import { 
  aggregateByState, 
  aggregateByDistrict,
  calculateDailyTrends,
  detectAnomalies,
  calculateGrowthRates
} from './dataAggregator';
import _ from 'lodash';

// Use global to maintain singleton across Next.js hot reloads
declare global {
  var gatiDataStore: DataStore | undefined;
}

class DataStore {
  // Raw data
  private biometricData: BiometricRecord[] = [];
  private demographicData: DemographicRecord[] = [];
  private enrolmentData: EnrolmentRecord[] = [];
  
  // Aggregated data (cached)
  private stateAggregations: StateAggregation[] = [];
  private nationalOverview: NationalOverview | null = null;
  
  // Loading state
  private isLoaded = false;
  private isLoading = false;
  private loadPromise: Promise<void> | null = null;

  constructor() {}

  /**
   * Get singleton instance using global variable
   */
  static getInstance(): DataStore {
    if (!global.gatiDataStore) {
      global.gatiDataStore = new DataStore();
    }
    return global.gatiDataStore;
  }

  /**
   * Load all data from CSV files
   */
  async loadAllData(): Promise<void> {
    if (this.isLoaded) return;
    
    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }

    this.isLoading = true;
    
    this.loadPromise = new Promise(async (resolve) => {
      console.log('🚀 GATI DataStore: Starting data load...');
      const startTime = Date.now();

      try {
        // Load all CSV data
        console.log('📊 Loading Biometric data...');
        this.biometricData = loadBiometricData();
        
        console.log('📊 Loading Demographic data...');
        this.demographicData = loadDemographicData();
        
        console.log('📊 Loading Enrolment data...');
        this.enrolmentData = loadEnrolmentData();

        // Pre-compute aggregations
        console.log('🔄 Computing state aggregations...');
        this.stateAggregations = aggregateByState(
          this.enrolmentData,
          this.biometricData,
          this.demographicData
        );

        // Compute national overview
        console.log('🔄 Computing national overview...');
        this.nationalOverview = this.computeNationalOverview();

        const loadTime = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ GATI DataStore: Data loaded in ${loadTime}s`);
        console.log(`   - Biometric records: ${this.biometricData.length.toLocaleString()}`);
        console.log(`   - Demographic records: ${this.demographicData.length.toLocaleString()}`);
        console.log(`   - Enrolment records: ${this.enrolmentData.length.toLocaleString()}`);
        console.log(`   - States aggregated: ${this.stateAggregations.length}`);

        this.isLoaded = true;
      } catch (error) {
        console.error('❌ GATI DataStore: Error loading data:', error);
      }
      
      this.isLoading = false;
      resolve();
    });

    return this.loadPromise;
  }

  /**
   * Check if data is loaded
   */
  isDataLoaded(): boolean {
    return this.isLoaded;
  }

  /**
   * Get loading status
   */
  getLoadingStatus(): { loaded: boolean; loading: boolean } {
    return { loaded: this.isLoaded, loading: this.isLoading };
  }

  /**
   * Compute national overview from aggregated data
   */
  private computeNationalOverview(): NationalOverview {
    const totalEnrolments = _.sumBy(this.stateAggregations, 'totalEnrolments');
    const totalBiometricUpdates = _.sumBy(this.stateAggregations, 'totalBiometricUpdates');
    const totalDemographicUpdates = _.sumBy(this.stateAggregations, 'totalDemographicUpdates');
    
    const ageBreakdown = {
      age0To5: _.sumBy(this.stateAggregations, s => s.ageDistribution.infants),
      age5To17: _.sumBy(this.stateAggregations, s => s.ageDistribution.children),
      age18Plus: _.sumBy(this.stateAggregations, s => s.ageDistribution.adults),
    };

    // Calculate risk distribution
    const riskDistribution = {
      low: this.stateAggregations.filter(s => s.riskLevel === 'low').length,
      medium: this.stateAggregations.filter(s => s.riskLevel === 'medium').length,
      high: this.stateAggregations.filter(s => s.riskLevel === 'high').length,
      critical: this.stateAggregations.filter(s => s.riskLevel === 'critical').length,
    };

    const allDistricts = _.sumBy(this.stateAggregations, 'districtsCount');
    const allPincodes = _.sumBy(this.stateAggregations, 'pincodesCount');

    // Calculate national averages
    const avgCoverage = _.meanBy(this.stateAggregations, 'coverage');
    const avgFreshness = _.meanBy(this.stateAggregations, 'freshness');

    // Get top and risk states
    const sortedByCoverage = [...this.stateAggregations].sort((a, b) => b.coverage - a.coverage);
    const topPerformingStates = sortedByCoverage.slice(0, 5);
    const highRiskStates = this.stateAggregations
      .filter(s => s.riskLevel === 'critical' || s.riskLevel === 'high')
      .slice(0, 5);

    // National daily trends
    const recentTrends = calculateDailyTrends(
      this.enrolmentData,
      this.biometricData,
      this.demographicData
    ).slice(-30);

    return {
      totalEnrolments,
      totalBiometricUpdates,
      totalDemographicUpdates,
      nationalCoverage: Math.round(avgCoverage * 10) / 10,
      freshnessIndex: Math.round(avgFreshness * 10) / 10,
      statesCount: this.stateAggregations.length,
      districtsCount: allDistricts,
      pincodesCount: allPincodes,
      ageBreakdown,
      riskDistribution,
      topPerformingStates,
      highRiskStates,
      recentTrends,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get national overview
   */
  getNationalOverview(): NationalOverview | null {
    return this.nationalOverview;
  }

  /**
   * Get all state aggregations
   */
  getStateAggregations(): StateAggregation[] {
    return this.stateAggregations;
  }

  /**
   * Get state aggregation by code or name
   */
  getStateByCode(stateCode: string): StateAggregation | undefined {
    return this.stateAggregations.find(s => 
      s.stateCode === stateCode || 
      s.stateName.toLowerCase() === stateCode.toLowerCase()
    );
  }

  /**
   * Get district data for a state
   */
  getDistrictsByState(stateName: string): DistrictAggregation[] {
    return aggregateByDistrict(
      stateName,
      this.enrolmentData,
      this.biometricData,
      this.demographicData
    );
  }

  /**
   * Get all unique states
   */
  getUniqueStates(): string[] {
    return getUniqueValues(this.enrolmentData, 'state') as string[];
  }

  /**
   * Get all unique districts for a state
   */
  getDistrictsForState(stateName: string): string[] {
    const stateData = this.enrolmentData.filter(e => e.state === stateName);
    return Array.from(new Set(stateData.map(e => e.district)));
  }

  /**
   * Get trends for a specific state
   */
  getStateTrends(stateName: string, days: number = 30): DailyTrend[] {
    const stateEnrolments = this.enrolmentData.filter(e => e.state === stateName);
    const stateBiometrics = this.biometricData.filter(b => b.state === stateName);
    const stateDemographics = this.demographicData.filter(d => d.state === stateName);

    return calculateDailyTrends(
      stateEnrolments,
      stateBiometrics,
      stateDemographics
    ).slice(-days);
  }

  /**
   * Detect anomalies across all states
   */
  detectAllAnomalies(): AnomalyDetection[] {
    const allAnomalies: AnomalyDetection[] = [];

    for (const state of this.stateAggregations) {
      const trends = this.getStateTrends(state.stateName, 30);
      const stateAnomalies = detectAnomalies(trends, state.stateName);
      allAnomalies.push(...stateAnomalies);
    }

    // Sort by severity and confidence
    return allAnomalies
      .sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (sevDiff !== 0) return sevDiff;
        return b.confidence - a.confidence;
      })
      .slice(0, 20); // Top 20 anomalies
  }

  /**
   * Get raw data counts
   */
  getDataCounts() {
    return {
      biometric: this.biometricData.length,
      demographic: this.demographicData.length,
      enrolment: this.enrolmentData.length,
      total: this.biometricData.length + this.demographicData.length + this.enrolmentData.length,
    };
  }

  /**
   * Search data by pincode
   */
  searchByPincode(pincode: string) {
    const enrolments = this.enrolmentData.filter(e => String(e.pincode) === pincode);
    const biometrics = this.biometricData.filter(b => String(b.pincode) === pincode);
    const demographics = this.demographicData.filter(d => String(d.pincode) === pincode);

    if (enrolments.length === 0 && biometrics.length === 0 && demographics.length === 0) {
      return null;
    }

    return {
      pincode,
      state: enrolments[0]?.state || biometrics[0]?.state || demographics[0]?.state,
      district: enrolments[0]?.district || biometrics[0]?.district || demographics[0]?.district,
      enrolments: {
        total: _.sumBy(enrolments, e => (e.age_0_5 || 0) + (e.age_5_17 || 0) + (e.age_18_greater || 0)),
        infants: _.sumBy(enrolments, 'age_0_5'),
        children: _.sumBy(enrolments, 'age_5_17'),
        adults: _.sumBy(enrolments, 'age_18_greater'),
      },
      biometricUpdates: _.sumBy(biometrics, b => (b.bio_age_5_17 || 0) + (b.bio_age_17_ || 0)),
      demographicUpdates: _.sumBy(demographics, d => (d.demo_age_5_17 || 0) + (d.demo_age_17_ || 0)),
    };
  }
}

// Export singleton getter
export function getDataStore(): DataStore {
  return DataStore.getInstance();
}

export { DataStore };
