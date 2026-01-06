'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts'
import { timelineData, monthlyTrends, ageDistribution } from '@/lib/data'
import { formatIndianNumber } from '@/lib/utils'

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-100">
        <p className="text-sm font-medium text-gati-text mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' && entry.value > 1000 
              ? formatIndianNumber(entry.value)
              : entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// Timeline chart for Aadhaar evolution
export function TimelineChart({ className = '', height }: { className?: string; height?: number }) {
  return (
    <div className={className}>
      <div style={{ height: height || 288 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={timelineData}>
            <defs>
              <linearGradient id="colorEnrolments" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00B4D8" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#00B4D8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(10, 36, 99, 0.05)" />
            <XAxis 
              dataKey="year" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickFormatter={(value) => `${(value / 1000000000).toFixed(1)}B`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="enrolments" 
              stroke="#00B4D8" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorEnrolments)" 
              name="Enrolments"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// Monthly trends chart
export function MonthlyTrendsChart({ className = '' }: { className?: string }) {
  return (
    <div className={`gati-panel p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gati-text mb-2">Monthly Trends</h3>
      <p className="text-sm text-gati-muted mb-6">Enrolments vs Updates (2024)</p>
      
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyTrends} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(10, 36, 99, 0.05)" />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="enrolments" 
              fill="#0A2463" 
              radius={[4, 4, 0, 0]}
              name="Enrolments"
            />
            <Bar 
              dataKey="updates" 
              fill="#00B4D8" 
              radius={[4, 4, 0, 0]}
              name="Updates"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// Age distribution chart
export function AgeDistributionChart({ className = '', height }: { className?: string; height?: number }) {
  const COLORS = ['#0A2463', '#1E5AA8', '#00B4D8', '#48CAE4', '#90E0EF', '#ADE8F4', '#CAF0F8']
  
  return (
    <div className={className}>
      <div style={{ height: height || 288 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={ageDistribution}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="population"
              nameKey="ageGroup"
              label={({ ageGroup }) => ageGroup}
            >
              {ageDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// Coverage trend line chart
export function CoverageTrendChart({ className = '' }: { className?: string }) {
  return (
    <div className={`gati-panel p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gati-text mb-2">Coverage Trend</h3>
      <p className="text-sm text-gati-muted mb-6">National coverage percentage over time</p>
      
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(10, 36, 99, 0.05)" />
            <XAxis 
              dataKey="year" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
            />
            <YAxis 
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="coverage" 
              stroke="#10B981" 
              strokeWidth={3}
              dot={{ fill: '#10B981', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#10B981' }}
              name="Coverage %"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// State comparison bar chart
interface StateComparisonProps {
  className?: string
  data?: { name: string; coverage: number; freshness: number }[]
  height?: number
}

export function StateComparisonChart({ className = '', data, height }: StateComparisonProps) {
  const defaultData = [
    { name: 'Kerala', coverage: 99.6, freshness: 98.1 },
    { name: 'Telangana', coverage: 99.3, freshness: 97.2 },
    { name: 'Tamil Nadu', coverage: 99.1, freshness: 96.8 },
    { name: 'Andhra Pradesh', coverage: 98.9, freshness: 95.7 },
    { name: 'Karnataka', coverage: 98.7, freshness: 95.3 },
    { name: 'Bihar', coverage: 89.5, freshness: 78.4 },
  ]
  
  const chartData = data || defaultData
  
  return (
    <div className={className}>
      <div style={{ height: height || 288 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(10, 36, 99, 0.05)" horizontal={false} />
            <XAxis 
              type="number"
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickFormatter={(value) => `${value}%`}
            />
            <YAxis 
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
              width={90}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="coverage" 
              fill="#0A2463" 
              radius={[0, 4, 4, 0]}
              name="Coverage %"
            />
            <Bar 
              dataKey="freshness" 
              fill="#00B4D8" 
              radius={[0, 4, 4, 0]}
              name="Freshness %"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// Risk distribution donut chart
export function RiskDistributionChart({ className = '', height }: { className?: string; height?: number }) {
  const data = [
    { name: 'Low Risk', value: 12, color: '#10B981' },
    { name: 'Medium Risk', value: 5, color: '#F59E0B' },
    { name: 'High Risk', value: 2, color: '#EF4444' },
    { name: 'Critical', value: 1, color: '#7C3AED' },
  ]
  
  return (
    <div className={className}>
      <div style={{ height: height || 224 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mt-4">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-gati-muted">{item.name}</span>
            <span className="text-xs font-medium text-gati-text ml-auto">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
