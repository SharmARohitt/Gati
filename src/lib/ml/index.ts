// ML Module Exports for GATI Platform

// Real ML API Client (preferred - uses trained Python models)
export * from './mlApiClient';

// Heuristic-based fallbacks (used when ML API is offline)
export * from './forecasting';
export * from './anomalyDetection';
export * from './riskScoring';
export * from './patternRecognition';
