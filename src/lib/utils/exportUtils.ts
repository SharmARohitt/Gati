// Export utilities for generating PDF and CSV reports

interface StateData {
  stateCode: string
  stateName: string
  totalEnrolments: number
  totalBiometricUpdates: number
  totalDemographicUpdates: number
  districtsCount: number
  pincodesCount: number
  coverage: number
  freshness: number
  riskLevel: string
  ageDistribution: {
    infants: number
    children: number
    adults: number
  }
}

interface NationalOverview {
  totalEnrolments: number
  totalBiometricUpdates: number
  totalDemographicUpdates: number
  statesCount: number
  districtsCount: number
  pincodesCount: number
  nationalCoverage: number
  freshnessIndex: number
}

// Format number with commas
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-IN').format(num)
}

// Generate CSV content from data
export function generateCSV(statesData: StateData[], nationalData: NationalOverview | null): string {
  const headers = [
    'State Code',
    'State Name',
    'Total Enrollments',
    'Biometric Updates',
    'Demographic Updates',
    'Districts',
    'Pincodes',
    'Coverage (%)',
    'Freshness (%)',
    'Risk Level',
    'Infants (0-5)',
    'Children (5-17)',
    'Adults (18+)'
  ]

  const rows = statesData.map(state => [
    state.stateCode,
    state.stateName,
    state.totalEnrolments,
    state.totalBiometricUpdates,
    state.totalDemographicUpdates,
    state.districtsCount,
    state.pincodesCount,
    state.coverage.toFixed(2),
    state.freshness.toFixed(2),
    state.riskLevel,
    state.ageDistribution.infants,
    state.ageDistribution.children,
    state.ageDistribution.adults
  ])

  // Add national summary row
  if (nationalData) {
    rows.unshift([
      'NATIONAL',
      'All India (National)',
      nationalData.totalEnrolments,
      nationalData.totalBiometricUpdates,
      nationalData.totalDemographicUpdates,
      nationalData.districtsCount,
      nationalData.pincodesCount,
      nationalData.nationalCoverage.toFixed(2),
      nationalData.freshnessIndex.toFixed(2),
      'N/A',
      'N/A',
      'N/A',
      'N/A'
    ])
  }

  // Convert to CSV string
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  return csvContent
}

// Generate HTML content for PDF
export function generatePDFHTML(statesData: StateData[], nationalData: NationalOverview | null): string {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  // Calculate risk distribution
  const riskCounts = {
    low: statesData.filter(s => s.riskLevel === 'low').length,
    medium: statesData.filter(s => s.riskLevel === 'medium').length,
    high: statesData.filter(s => s.riskLevel === 'high').length,
    critical: statesData.filter(s => s.riskLevel === 'critical').length
  }

  // Get high risk states
  const highRiskStates = statesData
    .filter(s => s.riskLevel === 'critical' || s.riskLevel === 'high')
    .sort((a, b) => a.coverage - b.coverage)
    .slice(0, 10)

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GATI Analytics Report - ${currentDate}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background: #f8fafc;
      padding: 40px;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #312e81 0%, #1e40af 50%, #0891b2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .header p {
      opacity: 0.9;
      font-size: 14px;
    }
    .badge {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 12px;
      margin-top: 16px;
    }
    .content {
      padding: 40px;
    }
    .section {
      margin-bottom: 40px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e2e8f0;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 30px;
    }
    .metric-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    }
    .metric-value {
      font-size: 24px;
      font-weight: 700;
      color: #0f172a;
    }
    .metric-label {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
    }
    .risk-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }
    .risk-card {
      padding: 16px;
      border-radius: 8px;
      text-align: center;
    }
    .risk-low { background: #d1fae5; color: #065f46; }
    .risk-medium { background: #fef3c7; color: #92400e; }
    .risk-high { background: #fed7aa; color: #c2410c; }
    .risk-critical { background: #fecaca; color: #991b1b; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th {
      background: #f1f5f9;
      padding: 12px 8px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #e2e8f0;
    }
    td {
      padding: 12px 8px;
      border-bottom: 1px solid #e2e8f0;
    }
    tr:hover {
      background: #f8fafc;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .status-low { background: #d1fae5; color: #065f46; }
    .status-medium { background: #fef3c7; color: #92400e; }
    .status-high { background: #fed7aa; color: #c2410c; }
    .status-critical { background: #fecaca; color: #991b1b; }
    .footer {
      background: #f1f5f9;
      padding: 24px 40px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
    }
    .alert-box {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .alert-title {
      color: #991b1b;
      font-weight: 600;
      margin-bottom: 8px;
    }
    @media print {
      body { padding: 0; background: white; }
      .container { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🇮🇳 GATI Analytics Report</h1>
      <p>Governance & Aadhaar Tracking Intelligence</p>
      <div class="badge">Generated: ${currentDate}</div>
    </div>
    
    <div class="content">
      <div class="section">
        <h2 class="section-title">📊 National Overview</h2>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-value">${formatNumber(nationalData?.totalEnrolments || 0)}</div>
            <div class="metric-label">Total Enrollments</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${formatNumber(nationalData?.totalBiometricUpdates || 0)}</div>
            <div class="metric-label">Biometric Updates</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${formatNumber(nationalData?.totalDemographicUpdates || 0)}</div>
            <div class="metric-label">Demographic Updates</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${nationalData?.nationalCoverage?.toFixed(1) || 0}%</div>
            <div class="metric-label">National Coverage</div>
          </div>
        </div>
        
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-value">${statesData.length}</div>
            <div class="metric-label">States/UTs Analyzed</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${formatNumber(nationalData?.districtsCount || 0)}</div>
            <div class="metric-label">Total Districts</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${formatNumber(nationalData?.pincodesCount || 0)}</div>
            <div class="metric-label">Total Pincodes</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${nationalData?.freshnessIndex?.toFixed(1) || 0}%</div>
            <div class="metric-label">Data Freshness</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">⚠️ Risk Distribution</h2>
        <div class="risk-grid">
          <div class="risk-card risk-low">
            <div style="font-size: 24px; font-weight: bold;">${riskCounts.low}</div>
            <div style="font-size: 12px;">Low Risk States</div>
          </div>
          <div class="risk-card risk-medium">
            <div style="font-size: 24px; font-weight: bold;">${riskCounts.medium}</div>
            <div style="font-size: 12px;">Medium Risk States</div>
          </div>
          <div class="risk-card risk-high">
            <div style="font-size: 24px; font-weight: bold;">${riskCounts.high}</div>
            <div style="font-size: 12px;">High Risk States</div>
          </div>
          <div class="risk-card risk-critical">
            <div style="font-size: 24px; font-weight: bold;">${riskCounts.critical}</div>
            <div style="font-size: 12px;">Critical States</div>
          </div>
        </div>
      </div>

      ${highRiskStates.length > 0 ? `
      <div class="section">
        <h2 class="section-title">🚨 Priority Attention Required</h2>
        <div class="alert-box">
          <div class="alert-title">Critical & High Risk States Requiring Immediate Action</div>
          <p style="font-size: 13px; color: #7f1d1d;">
            ${highRiskStates.map(s => s.stateName).join(', ')}
          </p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>State</th>
              <th>Coverage</th>
              <th>Freshness</th>
              <th>Enrollments</th>
              <th>Risk Level</th>
            </tr>
          </thead>
          <tbody>
            ${highRiskStates.map(state => `
              <tr>
                <td><strong>${state.stateName}</strong> (${state.stateCode})</td>
                <td>${state.coverage.toFixed(1)}%</td>
                <td>${state.freshness.toFixed(1)}%</td>
                <td>${formatNumber(state.totalEnrolments)}</td>
                <td><span class="status-badge status-${state.riskLevel}">${state.riskLevel}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      <div class="section">
        <h2 class="section-title">📋 Complete State-wise Data</h2>
        <table>
          <thead>
            <tr>
              <th>State</th>
              <th>Enrollments</th>
              <th>Biometric</th>
              <th>Demographic</th>
              <th>Coverage</th>
              <th>Risk</th>
            </tr>
          </thead>
          <tbody>
            ${statesData.map(state => `
              <tr>
                <td><strong>${state.stateName}</strong></td>
                <td>${formatNumber(state.totalEnrolments)}</td>
                <td>${formatNumber(state.totalBiometricUpdates)}</td>
                <td>${formatNumber(state.totalDemographicUpdates)}</td>
                <td>${state.coverage.toFixed(1)}%</td>
                <td><span class="status-badge status-${state.riskLevel}">${state.riskLevel}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>GATI - Governance & Aadhaar Tracking Intelligence</strong></p>
      <p>This is an official analytics report generated from UIDAI data. For internal use only.</p>
      <p>© ${new Date().getFullYear()} Unique Identification Authority of India</p>
    </div>
  </div>
</body>
</html>
`
}

// Download file helper
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Export to CSV
export function exportToCSV(statesData: StateData[], nationalData: NationalOverview | null): void {
  const csv = generateCSV(statesData, nationalData)
  const filename = `GATI_Analytics_Report_${new Date().toISOString().split('T')[0]}.csv`
  downloadFile(csv, filename, 'text/csv;charset=utf-8;')
}

// Export to PDF (opens in new window for printing)
export function exportToPDF(statesData: StateData[], nationalData: NationalOverview | null): void {
  const html = generatePDFHTML(statesData, nationalData)
  
  // Open in new window and trigger print
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    
    // Wait for content to load then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }
  }
}
