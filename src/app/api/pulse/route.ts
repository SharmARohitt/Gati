/**
 * GatiPulse API — Real-time ops monitoring from CSV data
 * GET /api/pulse?state=Delhi&month=03&year=2025&type=all
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDataStore } from '@/lib/data/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const store = getDataStore();
    store.startBackgroundLoad();
    await store.waitForData(90000);

    const { searchParams } = new URL(request.url);
    const stateFilter  = searchParams.get('state')  || 'all';
    const monthFilter  = searchParams.get('month')  || 'all'; // '01'-'12'
    const yearFilter   = searchParams.get('year')   || 'all';
    const compareState = searchParams.get('compare') || '';

    const states = store.getStateAggregations();
    const overview = store.getNationalOverview();

    // ── Unique states list ──────────────────────────────────────────────────
    const stateList = states.map(s => s.stateName).sort();

    // ── Filter helper ───────────────────────────────────────────────────────
    const filterTrends = (stateName: string) => {
      const s = states.find(st => st.stateName === stateName);
      if (!s) return [];
      let trends = s.dailyTrends || [];

      if (monthFilter !== 'all') {
        trends = trends.filter(t => {
          const d = new Date(t.date);
          return String(d.getMonth() + 1).padStart(2, '0') === monthFilter;
        });
      }
      if (yearFilter !== 'all') {
        trends = trends.filter(t => new Date(t.date).getFullYear() === parseInt(yearFilter));
      }
      return trends;
    }

    // ── Primary state data ──────────────────────────────────────────────────
    let primaryTrends: any[] = [];
    let primaryState: any = null;

    if (stateFilter === 'all') {
      primaryTrends = overview?.recentTrends || [];
      if (monthFilter !== 'all') {
        primaryTrends = primaryTrends.filter(t => {
          const d = new Date(t.date);
          return String(d.getMonth() + 1).padStart(2, '0') === monthFilter;
        });
      }
    } else {
      primaryState = states.find(s => s.stateName === stateFilter);
      primaryTrends = filterTrends(stateFilter);
    }

    // ── Compare state data ──────────────────────────────────────────────────
    let compareTrends: any[] = [];
    let compareStateData: any = null;
    if (compareState && compareState !== stateFilter) {
      compareStateData = states.find(s => s.stateName === compareState);
      compareTrends = filterTrends(compareState);
    }

    // ── Insight cards ───────────────────────────────────────────────────────
    const totalEnrolments = primaryTrends.reduce((s, t) => s + (t.enrolments || 0), 0);
    const totalBiometric  = primaryTrends.reduce((s, t) => s + (t.biometricUpdates || 0), 0);
    const totalDemographic = primaryTrends.reduce((s, t) => s + (t.demographicUpdates || 0), 0);

    // Peak day
    const peakDay = primaryTrends.reduce((best, t) =>
      (t.enrolments + t.biometricUpdates) > ((best?.enrolments || 0) + (best?.biometricUpdates || 0)) ? t : best,
      primaryTrends[0] || null
    );

    // Growth % (compare first half vs second half)
    const half = Math.floor(primaryTrends.length / 2);
    const firstHalf  = primaryTrends.slice(0, half).reduce((s, t) => s + t.enrolments, 0);
    const secondHalf = primaryTrends.slice(half).reduce((s, t) => s + t.enrolments, 0);
    const growthPct  = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf * 100) : 0;

    // Most active state (by enrolments)
    const mostActiveState = states.reduce((best, s) =>
      s.totalEnrolments > (best?.totalEnrolments || 0) ? s : best,
      states[0]
    );

    // ── State comparison bar data ───────────────────────────────────────────
    const topStatesBar = states
      .sort((a, b) => b.totalEnrolments - a.totalEnrolments)
      .slice(0, 12)
      .map(s => ({
        state: s.stateCode || s.stateName.substring(0, 3).toUpperCase(),
        fullName: s.stateName,
        enrolments: s.totalEnrolments,
        biometric: s.totalBiometricUpdates,
        demographic: s.totalDemographicUpdates,
        coverage: s.coverage,
        risk: s.riskLevel,
      }));

    // ── Heatmap: state × month ──────────────────────────────────────────────
    // Build from top 10 states × available months
    const heatmapStates = states.slice(0, 10);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const heatmap = heatmapStates.map(s => {
      const byMonth = months.map((m, idx) => {
        const monthTrends = (s.dailyTrends || []).filter(t => {
          const d = new Date(t.date);
          return d.getMonth() === idx;
        });
        return {
          month: m,
          value: monthTrends.reduce((sum, t) => sum + t.enrolments + t.biometricUpdates, 0),
        };
      });
      return { state: s.stateName, data: byMonth };
    });

    // ── Micro table (filtered, max 50 rows) ─────────────────────────────────
    const microTable = primaryTrends.slice(-50).map(t => ({
      date: t.date,
      enrolments: t.enrolments,
      biometric: t.biometricUpdates,
      demographic: t.demographicUpdates,
      total: t.enrolments + t.biometricUpdates + t.demographicUpdates,
    }));

    return NextResponse.json({
      success: true,
      meta: {
        stateFilter,
        monthFilter,
        yearFilter,
        compareState,
        totalRecords: primaryTrends.length,
        dataLoaded: store.isDataLoaded(),
      },
      insights: {
        totalEnrolments,
        totalBiometric,
        totalDemographic,
        totalActivity: totalEnrolments + totalBiometric + totalDemographic,
        peakDay: peakDay ? { date: peakDay.date, value: peakDay.enrolments + peakDay.biometricUpdates } : null,
        growthPct: Math.round(growthPct * 10) / 10,
        mostActiveState: mostActiveState ? { name: mostActiveState.stateName, enrolments: mostActiveState.totalEnrolments } : null,
        coverage: primaryState?.coverage || overview?.nationalCoverage || 0,
        freshness: primaryState?.freshness || overview?.freshnessIndex || 0,
        riskLevel: primaryState?.riskLevel || 'medium',
      },
      trends: primaryTrends,
      compareTrends,
      compareStateData: compareStateData ? {
        name: compareStateData.stateName,
        coverage: compareStateData.coverage,
        freshness: compareStateData.freshness,
        riskLevel: compareStateData.riskLevel,
        totalEnrolments: compareStateData.totalEnrolments,
      } : null,
      topStatesBar,
      heatmap,
      microTable,
      stateList,
      availableYears: ['2025'],
    });

  } catch (error) {
    console.error('[GatiPulse API] Error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
