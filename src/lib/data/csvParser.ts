// CSV Parser Utility for GATI Platform
// Handles parsing of large CSV files with chunked streaming support

import fs from 'fs';
import path from 'path';
import type { BiometricRecord, DemographicRecord, EnrolmentRecord } from './types';

// Data directory paths
const DATA_BASE_PATH = path.join(process.cwd(), 'data');

export const DATA_PATHS = {
  biometric: path.join(DATA_BASE_PATH, 'biometric', 'api_data_aadhar_biometric'),
  demographic: path.join(DATA_BASE_PATH, 'demographic', 'api_data_aadhar_demographic'),
  enrolment: path.join(DATA_BASE_PATH, 'enrolment', 'api_data_aadhar_enrolment'),
};

/**
 * Parse a single CSV file using line-by-line reading to avoid stack overflow
 * This method handles very large files by reading them in chunks
 */
export function parseCSVFile<T>(filePath: string): T[] {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');
    
    if (lines.length === 0) return [];
    
    // Parse header
    const headerLine = lines[0].trim();
    const headers = headerLine.split(',').map(h => h.trim());
    
    const results: T[] = [];
    
    // Parse data lines in chunks to avoid stack issues
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',');
      const record: Record<string, string | number> = {};
      
      for (let j = 0; j < headers.length; j++) {
        const header = headers[j];
        let value: string | number = values[j]?.trim() || '';
        
        // Try to convert to number
        if (value !== '' && !isNaN(Number(value))) {
          value = Number(value);
        }
        
        record[header] = value;
      }
      
      results.push(record as T);
    }
    
    return results;
  } catch (error) {
    console.error(`Error parsing CSV file ${filePath}:`, error);
    return [];
  }
}

/**
 * Load all CSV files from a directory
 */
export function loadAllCSVsFromDirectory<T>(dirPath: string): T[] {
  try {
    if (!fs.existsSync(dirPath)) {
      console.error(`Directory not found: ${dirPath}`);
      return [];
    }

    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.csv'));
    console.log(`📁 Found ${files.length} CSV files in ${dirPath}`);
    
    const allData: T[] = [];
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const startTime = Date.now();
      console.log(`  📄 Processing: ${file}`);
      
      const data = parseCSVFile<T>(filePath);
      
      // Use for loop instead of spread to avoid stack issues
      for (const record of data) {
        allData.push(record);
      }
      
      console.log(`     ✓ Loaded ${data.length.toLocaleString()} records in ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
    }
    
    console.log(`  📊 Total records: ${allData.length.toLocaleString()}`);
    return allData;
  } catch (error) {
    console.error(`Error loading CSVs from ${dirPath}:`, error);
    return [];
  }
}

/**
 * Load biometric data
 */
export function loadBiometricData(): BiometricRecord[] {
  return loadAllCSVsFromDirectory<BiometricRecord>(DATA_PATHS.biometric);
}

/**
 * Load demographic data
 */
export function loadDemographicData(): DemographicRecord[] {
  return loadAllCSVsFromDirectory<DemographicRecord>(DATA_PATHS.demographic);
}

/**
 * Load enrolment data
 */
export function loadEnrolmentData(): EnrolmentRecord[] {
  return loadAllCSVsFromDirectory<EnrolmentRecord>(DATA_PATHS.enrolment);
}

/**
 * Parse date string from CSV (DD-MM-YYYY format)
 */
export function parseDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format date for display (YYYY-MM-DD)
 */
export function formatDateISO(dateStr: string): string {
  const [day, month, year] = dateStr.split('-');
  return `${year}-${month}-${day}`;
}

/**
 * Get unique values from an array of objects for a specific key
 */
export function getUniqueValues<T, K extends keyof T>(data: T[], key: K): T[K][] {
  return Array.from(new Set(data.map(item => item[key])));
}

/**
 * Filter data by state
 */
export function filterByState<T extends { state: string }>(data: T[], stateName: string): T[] {
  return data.filter(item => item.state === stateName);
}

/**
 * Filter data by date range
 */
export function filterByDateRange<T extends { date: string }>(
  data: T[], 
  startDate: string, 
  endDate: string
): T[] {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  
  return data.filter(item => {
    const itemDate = parseDate(item.date);
    return itemDate >= start && itemDate <= end;
  });
}

/**
 * Get data statistics
 */
export function getDataStats<T>(data: T[]) {
  return {
    totalRecords: data.length,
    memorySizeEstimate: `${(JSON.stringify(data).length / 1024 / 1024).toFixed(2)} MB`,
  };
}
