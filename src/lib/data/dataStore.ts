// Data Store Singleton for GATI Platform
// Manages loading, caching, and serving of all Aadhaar data
// Uses background loading to avoid blocking API requests

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
  private biometricData: BiometricRecord[] = [];
  private demographicData: DemographicRecord[] = [];
  private enrolmentData: EnrolmentRecord[] = [];

  private stateAggregations: StateAggregation[] = [];
  private nationalOverview: NationalOverview | null = null;

  private isLoaded = false;
  private isLoading = false;
  private loadPromise: Promise<void> | null = null;
  private loadError: string | null = null;

  constructor() {}

  static getInstance(): DataStore {
    if (!global.gatiDataStore) {
      global.gatiDataStore = new DataStore();
    }
    return global.gatiDataStore;
  }

  /** Start loading in background without blocking */
  startBackgroundLoad(): void {
    if (this.isLoaded || this.isLoading) return;
    // Don't auto-load during Next.js build phase
    if (process.env.NEXT_PHASE === 'phase-production-build') return;
    this.loadAllData().catch(err => {
      console.error('❌ Background data load failed:', err);
    });
  }

  /** Load all CSV data. Returns immediately if already loaded. */
  async loadAllData(): Promise<void> {
    if (this.isLoaded) return;
    if (this.isLoading && this.loadPromise) return this.loadPromise;

    this.isLoading = true;
    this.loadError = null;

    this.loadPromise = (async () => {
      console.log('🚀 GATI DataStore: Starting data load...');
      const startTime = Date.now();

      try {
        console.log('📊 Loading Enrolment data...');
        this.enrolmentData = loadEnrolmentData();
        console.log(`   ✓ ${this.enrolmentData.length.toLocaleString()} enrolment records`);

        console.log('📊 Loading Biometric data...');
        this.biometricData = loadBiometricData();
        console.log(`   ✓ ${this.biometricData.length.toLocaleString()} biometric records`);

        console.log('📊 Loading Demographic data...');
        this.demographicData = loadDemographicData();
        console.log(`   ✓ ${this.demographicData.length.toLocaleString()} demographic records`);

        console.log('🔄 Computing state aggregations...');
        this.stateAggregations = aggregateByState(
          this.enrolmentData,
          this.biometricData,
          this.demographicData
        );

        console.log('🔄 Computing national overview...');
        this.nationalOverview = this.computeNationalOverview();

        const loadTime = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ GATI DataStore: Ready in ${loadTime}s — ${this.stateAggregations.length} states`);
        this.isLoaded = true;
      } catch (error) {
        this.loadError = String(error);
        console.error('❌ GATI DataStore: Error loading data:', error);
        // Don't rethrow — allow partial operation
      } finally {
        this.isLoading = false;
      }
    })();

    return this.loadPromise;
  }

  /** Wait for data with a timeout — returns whatever is available */
  async waitForData(timeoutMs = 90000): Promise<void> {
    if (this.isLoaded) return;
    // Start loading if not already started
    if (!this.isLoading) this.startBackgroundLoad();
    if (!this.isLoading && !this.isLoaded) return; // startBackgroundLoad was blocked (build phase)

    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (this.isLoaded || !this.isLoading) {
          clearInterval(check);
          resolve();
        }
      }, 500);
      setTimeout(() => {
        clearInterval(check);
        resolve(); // Resolve even if not fully loaded — return partial data
      }, timeoutMs);
    });
  }

  isDataLoaded(): boolean { return this.isLoaded; }
  isDataLoading(): boolean { return this.isLoading; }
  getLoadError(): string | null { return this.loadError; }

  getLoadingStatus(): { loaded: boolean; loading: boolean; error: string | null } {
    return { loaded: this.isLoaded, loading: this.isLoading, error: this.loadError };
  }

  private computeNationalOverview(): NationalOverview {
    const totalEnrolments = _.sumBy(this.stateAggregations, 'totalEnrolments');
    const totalBiometricUpdates = _.sumBy(this.stateAggregations, 'totalBiometricUpdates');
    const totalDemographicUpdates = _.sumBy(this.stateAggregations, 'totalDemographicUpdates');

    const ageBreakdown = {
      age0To5: _.sumBy(this.stateAggregations, s => s.ageDistribution.infants),
      age5To17: _.sumBy(this.stateAggregations, s => s.ageDistribution.children),
      age18Plus: _.sumBy(this.stateAggregations, s => s.ageDistribution.adults),
    };

    const riskDistribution = {
      low: this.stateAggregations.filter(s => s.riskLevel === 'low').length,
      medium: this.stateAggregations.filter(s => s.riskLevel === 'medium').length,
      high: this.stateAggregations.filter(s => s.riskLevel === 'high').length,
      critical: this.stateAggregations.filter(s => s.riskLevel === 'critical').length,
    };

    const avgCoverage = this.stateAggregations.length > 0 ? _.meanBy(this.stateAggregations, 'coverage') : 0;
    const avgFreshness = this.stateAggregations.length > 0 ? _.meanBy(this.stateAggregations, 'freshness') : 0;

    const sortedByCoverage = [...this.stateAggregations].sort((a, b) => b.coverage - a.coverage);
    const topPerformingStates = sortedByCoverage.slice(0, 5);
    const highRiskStates = this.stateAggregations
      .filter(s => s.riskLevel === 'critical' || s.riskLevel === 'high')
      .slice(0, 5);

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
      districtsCount: _.sumBy(this.stateAggregations, 'districtsCount'),
      pincodesCount: _.sumBy(this.stateAggregations, 'pincodesCount'),
      ageBreakdown,
      riskDistribution,
      topPerformingStates,
      highRiskStates,
      recentTrends,
      lastUpdated: new Date().toISOString(),
    };
  }

  getNationalOverview(): NationalOverview | null { return this.nationalOverview; }
  getStateAggregations(): StateAggregation[] { return this.stateAggregations; }

  getStateByCode(stateCode: string): StateAggregation | undefined {
    return this.stateAggregations.find(s =>
      s.stateCode === stateCode ||
      s.stateName.toLowerCase() === stateCode.toLowerCase()
    );
  }

  getDistrictsByState(stateName: string): DistrictAggregation[] {
    return aggregateByDistrict(stateName, this.enrolmentData, this.biometricData, this.demographicData);
  }

  getUniqueStates(): string[] {
    return getUniqueValues(this.enrolmentData, 'state') as string[];
  }

  getDistrictsForState(stateName: string): string[] {
    return Array.from(new Set(this.enrolmentData.filter(e => e.state === stateName).map(e => e.district)));
  }

  getStateTrends(stateName: string, days = 30): DailyTrend[] {
    return calculateDailyTrends(
      this.enrolmentData.filter(e => e.state === stateName),
      this.biometricData.filter(b => b.state === stateName),
      this.demographicData.filter(d => d.state === stateName)
    ).slice(-days);
  }

  detectAllAnomalies(): AnomalyDetection[] {
    const allAnomalies: AnomalyDetection[] = [];
    for (const state of this.stateAggregations) {
      const trends = this.getStateTrends(state.stateName, 30);
      allAnomalies.push(...detectAnomalies(trends, state.stateName));
    }
    return allAnomalies
      .sort((a, b) => {
        const order = { critical: 0, high: 1, medium: 2, low: 3 };
        const d = order[a.severity] - order[b.severity];
        return d !== 0 ? d : b.confidence - a.confidence;
      })
      .slice(0, 20);
  }

  getDataCounts() {
    return {
      biometric: this.biometricData.length,
      demographic: this.demographicData.length,
      enrolment: this.enrolmentData.length,
      total: this.biometricData.length + this.demographicData.length + this.enrolmentData.length,
    };
  }

  searchByPincode(pincode: string) {
    const enrolments = this.enrolmentData.filter(e => String(e.pincode) === pincode);
    const biometrics = this.biometricData.filter(b => String(b.pincode) === pincode);
    const demographics = this.demographicData.filter(d => String(d.pincode) === pincode);
    if (!enrolments.length && !biometrics.length && !demographics.length) return null;
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

export function getDataStore(): DataStore {
  return DataStore.getInstance();
}

export { DataStore };
