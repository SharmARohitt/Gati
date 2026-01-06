// Mock data for GATI Platform - Demo purposes only

// State-wise Aadhaar data
export const stateData = [
  { id: 'MH', name: 'Maharashtra', coverage: 98.2, enrolments: 124500000, updates: 8900000, freshness: 94.5, risk: 'low' },
  { id: 'UP', name: 'Uttar Pradesh', coverage: 96.8, enrolments: 215000000, updates: 12500000, freshness: 89.2, risk: 'medium' },
  { id: 'TN', name: 'Tamil Nadu', coverage: 99.1, enrolments: 78200000, updates: 5600000, freshness: 96.8, risk: 'low' },
  { id: 'KA', name: 'Karnataka', coverage: 98.7, enrolments: 67800000, updates: 4900000, freshness: 95.3, risk: 'low' },
  { id: 'GJ', name: 'Gujarat', coverage: 97.5, enrolments: 68500000, updates: 5200000, freshness: 92.1, risk: 'low' },
  { id: 'RJ', name: 'Rajasthan', coverage: 95.3, enrolments: 75600000, updates: 6800000, freshness: 87.4, risk: 'medium' },
  { id: 'WB', name: 'West Bengal', coverage: 94.8, enrolments: 97200000, updates: 7400000, freshness: 85.6, risk: 'medium' },
  { id: 'MP', name: 'Madhya Pradesh', coverage: 93.2, enrolments: 82400000, updates: 7100000, freshness: 83.9, risk: 'high' },
  { id: 'BR', name: 'Bihar', coverage: 89.5, enrolments: 104000000, updates: 9800000, freshness: 78.4, risk: 'critical' },
  { id: 'AP', name: 'Andhra Pradesh', coverage: 98.9, enrolments: 52800000, updates: 3900000, freshness: 95.7, risk: 'low' },
  { id: 'TS', name: 'Telangana', coverage: 99.3, enrolments: 38500000, updates: 2800000, freshness: 97.2, risk: 'low' },
  { id: 'KL', name: 'Kerala', coverage: 99.6, enrolments: 35200000, updates: 2100000, freshness: 98.1, risk: 'low' },
  { id: 'OR', name: 'Odisha', coverage: 94.1, enrolments: 44800000, updates: 3600000, freshness: 86.3, risk: 'medium' },
  { id: 'AS', name: 'Assam', coverage: 91.2, enrolments: 33600000, updates: 2900000, freshness: 81.7, risk: 'high' },
  { id: 'PB', name: 'Punjab', coverage: 97.8, enrolments: 29400000, updates: 2200000, freshness: 93.4, risk: 'low' },
  { id: 'HR', name: 'Haryana', coverage: 98.1, enrolments: 28200000, updates: 2100000, freshness: 94.2, risk: 'low' },
  { id: 'JH', name: 'Jharkhand', coverage: 92.4, enrolments: 35800000, updates: 3200000, freshness: 82.8, risk: 'high' },
  { id: 'UK', name: 'Uttarakhand', coverage: 96.5, enrolments: 11200000, updates: 890000, freshness: 91.3, risk: 'low' },
  { id: 'HP', name: 'Himachal Pradesh', coverage: 98.4, enrolments: 7400000, updates: 520000, freshness: 95.8, risk: 'low' },
  { id: 'JK', name: 'Jammu & Kashmir', coverage: 93.8, enrolments: 13800000, updates: 1100000, freshness: 84.6, risk: 'medium' },
]

// Live pulse strip data
export const pulseStripData = {
  aadhaarCoverage: 97.2,
  updateFreshness: 91.4,
  biometricCompliance: 94.8,
  highRiskRegions: 23,
  activeOperations: 1247
}

// Dashboard summary stats
export const dashboardStats = [
  {
    id: 'total-enrolments',
    label: 'Total Aadhaar Enrolments',
    value: 1389000000,
    change: 0.12,
    trend: 'up',
    icon: 'users'
  },
  {
    id: 'monthly-updates',
    label: 'Monthly Updates',
    value: 28500000,
    change: 8.4,
    trend: 'up',
    icon: 'refresh'
  },
  {
    id: 'child-enrolments',
    label: 'Child Enrolments (0-5)',
    value: 89400000,
    change: 2.1,
    trend: 'up',
    icon: 'baby'
  },
  {
    id: 'biometric-updates',
    label: 'Biometric Updates',
    value: 12800000,
    change: -3.2,
    trend: 'down',
    icon: 'fingerprint'
  },
  {
    id: 'coverage-rate',
    label: 'National Coverage',
    value: 97.2,
    suffix: '%',
    change: 0.3,
    trend: 'up',
    icon: 'chart'
  },
  {
    id: 'active-issues',
    label: 'Active Issues',
    value: 1847,
    change: -12.5,
    trend: 'down',
    icon: 'alert'
  }
]

// Timeline data for Aadhaar evolution
export const timelineData = [
  { year: 2012, enrolments: 210000000, coverage: 17.2 },
  { year: 2013, enrolments: 510000000, coverage: 41.8 },
  { year: 2014, enrolments: 720000000, coverage: 58.9 },
  { year: 2015, enrolments: 920000000, coverage: 75.2 },
  { year: 2016, enrolments: 1050000000, coverage: 85.8 },
  { year: 2017, enrolments: 1180000000, coverage: 91.2 },
  { year: 2018, enrolments: 1230000000, coverage: 93.8 },
  { year: 2019, enrolments: 1260000000, coverage: 95.2 },
  { year: 2020, enrolments: 1290000000, coverage: 96.1 },
  { year: 2021, enrolments: 1320000000, coverage: 96.5 },
  { year: 2022, enrolments: 1350000000, coverage: 96.9 },
  { year: 2023, enrolments: 1370000000, coverage: 97.1 },
  { year: 2024, enrolments: 1385000000, coverage: 97.2 },
  { year: 2025, enrolments: 1389000000, coverage: 97.2 },
]

// AI-detected issues
export const detectedIssues = [
  {
    id: 'ISS-2025-0847',
    type: 'Low Child Enrolment',
    region: 'Bihar - Kishanganj',
    severity: 'critical',
    status: 'assigned',
    assignedTo: 'District Collector, Kishanganj',
    deadline: '2025-01-20',
    confidence: 94.2,
    description: 'Child enrolment rate 34% below state average for 0-5 age group',
    aiInsight: 'Pattern suggests correlation with remote area accessibility and lack of Aadhaar centers.'
  },
  {
    id: 'ISS-2025-0846',
    type: 'Biometric Update Backlog',
    region: 'Jharkhand - Dumka',
    severity: 'high',
    status: 'in-progress',
    assignedTo: 'State Coordinator, Jharkhand',
    deadline: '2025-01-18',
    confidence: 89.7,
    description: 'Adolescent biometric update rate 28% below expected',
    aiInsight: 'Increased migration patterns detected. Mobile update camps recommended.'
  },
  {
    id: 'ISS-2025-0845',
    type: 'Update Velocity Anomaly',
    region: 'Assam - Karimganj',
    severity: 'high',
    status: 'pending',
    assignedTo: null,
    deadline: null,
    confidence: 86.3,
    description: 'Sudden 45% spike in demographic updates within 72 hours',
    aiInsight: 'Unusual pattern requires investigation. May indicate data quality concern.'
  },
  {
    id: 'ISS-2025-0844',
    type: 'Demographic Churn',
    region: 'Madhya Pradesh - Shivpuri',
    severity: 'medium',
    status: 'resolved',
    assignedTo: 'Block Officer, Shivpuri',
    deadline: '2025-01-10',
    confidence: 82.1,
    description: 'High address update frequency in specific wards',
    aiInsight: 'Seasonal migration pattern identified. Flagged for monitoring.'
  },
  {
    id: 'ISS-2025-0843',
    type: 'Child Transition Gap',
    region: 'Rajasthan - Barmer',
    severity: 'medium',
    status: 'assigned',
    assignedTo: 'District Coordinator, Barmer',
    deadline: '2025-01-22',
    confidence: 91.5,
    description: '5-year biometric transition completion at 67%',
    aiInsight: 'This district shows delayed biometric transitions among adolescents.'
  }
]

// Field officers data
export const fieldOfficers = [
  {
    id: 'FO-001',
    name: 'Rajesh Kumar',
    designation: 'District Coordinator',
    region: 'Bihar - Patna',
    status: 'active',
    tasksAssigned: 8,
    tasksCompleted: 142,
    resolutionRate: 94.2,
    avgResolutionTime: '2.3 days',
    currentLocation: { lat: 25.5941, lng: 85.1376 }
  },
  {
    id: 'FO-002',
    name: 'Priya Sharma',
    designation: 'State Coordinator',
    region: 'Jharkhand',
    status: 'active',
    tasksAssigned: 12,
    tasksCompleted: 287,
    resolutionRate: 96.8,
    avgResolutionTime: '1.8 days',
    currentLocation: { lat: 23.3441, lng: 85.3096 }
  },
  {
    id: 'FO-003',
    name: 'Mohammed Anwar',
    designation: 'Block Officer',
    region: 'Assam - Guwahati',
    status: 'in-field',
    tasksAssigned: 5,
    tasksCompleted: 98,
    resolutionRate: 91.5,
    avgResolutionTime: '2.8 days',
    currentLocation: { lat: 26.1445, lng: 91.7362 }
  },
  {
    id: 'FO-004',
    name: 'Sunita Devi',
    designation: 'Field Supervisor',
    region: 'Madhya Pradesh - Bhopal',
    status: 'active',
    tasksAssigned: 6,
    tasksCompleted: 156,
    resolutionRate: 93.7,
    avgResolutionTime: '2.1 days',
    currentLocation: { lat: 23.2599, lng: 77.4126 }
  }
]

// Blockchain audit records
export const auditRecords = [
  {
    id: 'AUD-2025-1247',
    action: 'Issue Resolved',
    issueId: 'ISS-2025-0844',
    timestamp: '2025-01-05T14:32:00Z',
    hash: '0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    modelVersion: 'GATI-ML-v2.4.1',
    verifiedBy: 'System',
    status: 'verified'
  },
  {
    id: 'AUD-2025-1246',
    action: 'Task Assigned',
    issueId: 'ISS-2025-0847',
    timestamp: '2025-01-05T11:15:00Z',
    hash: '0x8da4e775a563c18f715f802a063c5a31b8a11f5c5ee1879ec3454e5f3c738d2d',
    modelVersion: 'GATI-ML-v2.4.1',
    verifiedBy: 'Admin',
    status: 'verified'
  },
  {
    id: 'AUD-2025-1245',
    action: 'Anomaly Detected',
    issueId: 'ISS-2025-0845',
    timestamp: '2025-01-05T08:47:00Z',
    hash: '0x2c624232cdd221771294dfbb310aca000a0df6ac8b66b696d90ef06fdefb64a3',
    modelVersion: 'GATI-ML-v2.4.1',
    verifiedBy: 'System',
    status: 'verified'
  },
  {
    id: 'AUD-2025-1244',
    action: 'Report Generated',
    issueId: null,
    timestamp: '2025-01-04T23:00:00Z',
    hash: '0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    modelVersion: 'GATI-ML-v2.4.1',
    verifiedBy: 'System',
    status: 'verified'
  }
]

// Age distribution data
export const ageDistribution = [
  { ageGroup: '0-5', population: 89400000, coverage: 72.4, updates: 12.8 },
  { ageGroup: '5-10', population: 124500000, coverage: 96.2, updates: 34.5 },
  { ageGroup: '10-18', population: 198000000, coverage: 97.8, updates: 28.7 },
  { ageGroup: '18-30', population: 328000000, coverage: 98.9, updates: 45.2 },
  { ageGroup: '30-45', population: 285000000, coverage: 99.2, updates: 38.6 },
  { ageGroup: '45-60', population: 198000000, coverage: 98.7, updates: 22.4 },
  { ageGroup: '60+', population: 138000000, coverage: 96.4, updates: 15.8 },
]

// Gender distribution
export const genderDistribution = {
  male: { count: 712000000, coverage: 97.4 },
  female: { count: 677000000, coverage: 96.9 },
  other: { count: 490000, coverage: 94.2 }
}

// Monthly enrolment trends
export const monthlyTrends = [
  { month: 'Jan', enrolments: 2450000, updates: 8200000 },
  { month: 'Feb', enrolments: 2680000, updates: 8900000 },
  { month: 'Mar', enrolments: 2890000, updates: 9400000 },
  { month: 'Apr', enrolments: 2340000, updates: 7800000 },
  { month: 'May', enrolments: 2120000, updates: 7200000 },
  { month: 'Jun', enrolments: 2780000, updates: 8600000 },
  { month: 'Jul', enrolments: 2950000, updates: 9100000 },
  { month: 'Aug', enrolments: 2560000, updates: 8400000 },
  { month: 'Sep', enrolments: 2890000, updates: 9200000 },
  { month: 'Oct', enrolments: 3120000, updates: 9800000 },
  { month: 'Nov', enrolments: 2780000, updates: 8700000 },
  { month: 'Dec', enrolments: 2640000, updates: 8500000 },
]

// Report templates
export const reportTemplates = [
  {
    id: 'RPT-001',
    name: 'National Coverage Summary',
    description: 'Comprehensive coverage analysis across all states and UTs',
    type: 'coverage',
    schedule: 'monthly',
    lastGenerated: '2025-01-01T00:00:00Z',
    format: ['PDF', 'CSV']
  },
  {
    id: 'RPT-002',
    name: 'State Performance Analysis',
    description: 'Detailed state-wise performance metrics and trends',
    type: 'performance',
    schedule: 'weekly',
    lastGenerated: '2024-12-30T00:00:00Z',
    format: ['PDF', 'CSV', 'XLSX']
  },
  {
    id: 'RPT-003',
    name: 'Risk Assessment Report',
    description: 'AI-detected anomalies and risk indicators',
    type: 'risk',
    schedule: 'daily',
    lastGenerated: '2025-01-05T00:00:00Z',
    format: ['PDF']
  },
  {
    id: 'RPT-004',
    name: 'Field Operations Summary',
    description: 'Field officer activities, task completion, and efficiency',
    type: 'field',
    schedule: 'weekly',
    lastGenerated: '2024-12-29T00:00:00Z',
    format: ['PDF', 'CSV']
  },
  {
    id: 'RPT-005',
    name: 'Child Enrolment Progress',
    description: 'Tracking 0-5 age group enrolment across districts',
    type: 'coverage',
    schedule: 'weekly',
    lastGenerated: '2024-12-28T00:00:00Z',
    format: ['PDF', 'CSV']
  },
  {
    id: 'RPT-006',
    name: 'Biometric Update Compliance',
    description: 'Adolescent biometric transition and update rates',
    type: 'performance',
    schedule: 'monthly',
    lastGenerated: '2025-01-01T00:00:00Z',
    format: ['PDF']
  },
  {
    id: 'RPT-007',
    name: 'Critical Issue Tracker',
    description: 'High-priority issues requiring immediate attention',
    type: 'risk',
    schedule: 'daily',
    lastGenerated: '2025-01-05T00:00:00Z',
    format: ['PDF', 'CSV']
  },
  {
    id: 'RPT-008',
    name: 'District Collector Briefing',
    description: 'Executive summary for district-level leadership',
    type: 'field',
    schedule: 'on-demand',
    lastGenerated: '2025-01-03T00:00:00Z',
    format: ['PDF']
  }
]

// Navigation items
export const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', href: '/admin' },
  { id: 'digital-twin', label: 'India Digital Twin', icon: 'Map', href: '/digital-twin' },
  { id: 'intelligence', label: 'AI Intelligence', icon: 'Brain', href: '/intelligence' },
  { id: 'issues', label: 'Issues & Tasks', icon: 'AlertTriangle', href: '/admin/issues' },
  { id: 'verification', label: 'Verification Console', icon: 'ShieldCheck', href: '/verification' },
  { id: 'field-ops', label: 'Field Operations', icon: 'Users', href: '/field-operations' },
  { id: 'blockchain', label: 'Audit & Blockchain', icon: 'FileCheck', href: '/audit' },
  { id: 'analytics', label: 'Analytics & Reports', icon: 'BarChart3', href: '/analytics' },
]
