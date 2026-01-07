// Server-only data exports - contains fs/path dependencies
// Only import this in API routes and server components

export * from './types';
export * from './csvParser';
export { aggregateByState, aggregateByDistrict, calculateDailyTrends, detectAnomalies, calculateGrowthRates } from './dataAggregator';
export { getDataStore, DataStore } from './dataStore';
