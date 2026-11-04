import { Employee, MasterKPIRecord, MonthlyAssessment } from '../types';
import { buildAssessmentForEmployee } from '../data/initialData';

export interface MonthHistoricalMetric {
  period: string;
  label: string;
  shortLabel: string;
  avgFinalScore: number;
  avgScoreA: number;
  avgScoreB: number;
  totalEmployees: number;
  gradeA: number;
  gradeB: number;
  gradeC: number;
  gradeD: number;
  gradeE: number;
  pctGoodOrBetter: number; // % Grade A + B
  divisionAverages: Record<string, number>;
  topDivisionName: string;
  topDivisionScore: number;
  momGrowthDelta: number; // vs previous month in sorted order
  momGrowthPercent: number; // percentage growth
}

export function formatPeriodIndonesian(periodStr: string, format: 'full' | 'short' = 'full'): string {
  const [year, month] = periodStr.split('-');
  const monthsFull = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const monthsShort = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];
  const idx = parseInt(month, 10) - 1;
  const name = format === 'full' ? (monthsFull[idx] || month) : (monthsShort[idx] || month);
  return format === 'full' ? `${name} ${year}` : `${name} '${year.slice(2)}`;
}

/**
 * Retrieves or generates assessments for a given period to ensure historical tracking is always complete
 */
export function getAssessmentsForPeriod(
  period: string,
  employees: Employee[],
  masterList: MasterKPIRecord[],
  currentPeriod: string,
  currentAssessments: MonthlyAssessment[]
): MonthlyAssessment[] {
  // If period matches active state, return live assessments so changes reflect immediately
  if (period === currentPeriod && currentAssessments && currentAssessments.length > 0) {
    return currentAssessments;
  }

  // Check localStorage
  const saved = localStorage.getItem(`kpi_assessments_v2_${period}`);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // fallback
    }
  }

  // Fallback: generate deterministic assessment records for that period
  const generated = employees.map((emp) =>
    buildAssessmentForEmployee(emp, period, masterList)
  );
  return generated;
}

/**
 * Computes historical metrics across all available periods sorted chronologically
 */
export function computeHistoricalMetrics(
  periods: string[],
  employees: Employee[],
  masterList: MasterKPIRecord[],
  currentPeriod: string,
  currentAssessments: MonthlyAssessment[],
  filterDivision: string = 'ALL'
): MonthHistoricalMetric[] {
  // Sort chronologically ascending (e.g. 2026-07, 2026-08, 2026-09)
  const sortedPeriods = [...periods].sort((a, b) => a.localeCompare(b));

  const metrics: MonthHistoricalMetric[] = [];

  sortedPeriods.forEach((period, idx) => {
    let list = getAssessmentsForPeriod(period, employees, masterList, currentPeriod, currentAssessments);

    if (filterDivision !== 'ALL') {
      list = list.filter((a) => a.division === filterDivision);
    }

    if (list.length === 0) {
      metrics.push({
        period,
        label: formatPeriodIndonesian(period, 'full'),
        shortLabel: formatPeriodIndonesian(period, 'short'),
        avgFinalScore: 0,
        avgScoreA: 0,
        avgScoreB: 0,
        totalEmployees: 0,
        gradeA: 0,
        gradeB: 0,
        gradeC: 0,
        gradeD: 0,
        gradeE: 0,
        pctGoodOrBetter: 0,
        divisionAverages: {},
        topDivisionName: '-',
        topDivisionScore: 0,
        momGrowthDelta: 0,
        momGrowthPercent: 0,
      });
      return;
    }

    const totalCount = list.length;
    const sumFinal = list.reduce((acc, cur) => acc + cur.finalScore, 0);
    const sumA = list.reduce((acc, cur) => acc + cur.totalSkorA, 0);
    const sumB = list.reduce((acc, cur) => acc + cur.totalSkorB, 0);

    const avgFinal = Number((sumFinal / totalCount).toFixed(2));
    const avgA = Number((sumA / totalCount).toFixed(2));
    const avgB = Number((sumB / totalCount).toFixed(2));

    const gradeA = list.filter((a) => a.grade === 'A').length;
    const gradeB = list.filter((a) => a.grade === 'B').length;
    const gradeC = list.filter((a) => a.grade === 'C').length;
    const gradeD = list.filter((a) => a.grade === 'D').length;
    const gradeE = list.filter((a) => a.grade === 'E').length;

    const pctGoodOrBetter = Number((((gradeA + gradeB) / totalCount) * 100).toFixed(1));

    // Per-division averages
    const divGroups: Record<string, { sum: number; count: number }> = {};
    list.forEach((item) => {
      if (!divGroups[item.division]) {
        divGroups[item.division] = { sum: 0, count: 0 };
      }
      divGroups[item.division].sum += item.finalScore;
      divGroups[item.division].count += 1;
    });

    const divisionAverages: Record<string, number> = {};
    let topDivisionName = '-';
    let topDivisionScore = -1;

    Object.entries(divGroups).forEach(([divName, g]) => {
      const avg = Number((g.sum / g.count).toFixed(2));
      divisionAverages[divName] = avg;
      if (avg > topDivisionScore) {
        topDivisionScore = avg;
        topDivisionName = divName;
      }
    });

    // MoM comparison vs previous period
    let momGrowthDelta = 0;
    let momGrowthPercent = 0;
    if (idx > 0 && metrics[idx - 1] && metrics[idx - 1].avgFinalScore > 0) {
      const prevFinal = metrics[idx - 1].avgFinalScore;
      momGrowthDelta = Number((avgFinal - prevFinal).toFixed(2));
      momGrowthPercent = Number((((avgFinal - prevFinal) / prevFinal) * 100).toFixed(1));
    }

    metrics.push({
      period,
      label: formatPeriodIndonesian(period, 'full'),
      shortLabel: formatPeriodIndonesian(period, 'short'),
      avgFinalScore: avgFinal,
      avgScoreA: avgA,
      avgScoreB: avgB,
      totalEmployees: totalCount,
      gradeA,
      gradeB,
      gradeC,
      gradeD,
      gradeE,
      pctGoodOrBetter,
      divisionAverages,
      topDivisionName,
      topDivisionScore: topDivisionScore > 0 ? topDivisionScore : 0,
      momGrowthDelta,
      momGrowthPercent,
    });
  });

  return metrics;
}

export interface TopPerformerHistoryPoint {
  period: string;
  label: string;
  fullLabel: string;
  finalScore: number;
  scoreA: number;
  scoreB: number;
  grade: string;
}

export interface TopPerformerEmployee {
  rank: number;
  employeeId: string;
  employeeNik: string;
  employeeName: string;
  division: string;
  position: string;
  currentAssessment: MonthlyAssessment;
  currentScore: number;
  currentGrade: string;
  currentScoreA: number;
  currentScoreB: number;
  average6MonthScore: number;
  peakScore: number;
  momChange: number;
  sixMonthChange: number;
  color: string;
  history: Record<string, TopPerformerHistoryPoint>;
}

export interface TopPerformersTrendData {
  periods: string[];
  periodLabels: { period: string; label: string; fullLabel: string }[];
  performers: TopPerformerEmployee[];
  chartData: Array<{
    period: string;
    label: string;
    fullLabel: string;
    [key: string]: any;
  }>;
  overallTopAvg: number;
  highestPerformerName: string;
  highestPerformerScore: number;
}

export function getLast6Periods(currentPeriod: string): string[] {
  const parts = currentPeriod.split('-');
  const year = parseInt(parts[0], 10) || 2026;
  const month = parseInt(parts[1], 10) || 9;

  const result: string[] = [];
  for (let i = 5; i >= 0; i--) {
    let m = month - i;
    let y = year;
    while (m <= 0) {
      m += 12;
      y -= 1;
    }
    result.push(`${y}-${String(m).padStart(2, '0')}`);
  }
  return result;
}

export function computeTop5PerformersTrend(
  currentPeriod: string,
  employees: Employee[],
  masterList: MasterKPIRecord[],
  currentAssessments: MonthlyAssessment[],
  filterDivision: string = 'ALL',
  rankingMetric: 'final' | 'sikap' | 'kpi' = 'final'
): TopPerformersTrendData {
  const last6Periods = getLast6Periods(currentPeriod);

  // 1. Get assessments for the active currentPeriod
  let currentList = getAssessmentsForPeriod(
    currentPeriod,
    employees,
    masterList,
    currentPeriod,
    currentAssessments
  );

  if (filterDivision !== 'ALL') {
    currentList = currentList.filter((a) => a.division === filterDivision);
  }

  // Sort descending by selected metric
  const sorted = [...currentList].sort((a, b) => {
    if (rankingMetric === 'sikap') return b.totalSkorA - a.totalSkorA;
    if (rankingMetric === 'kpi') return b.totalSkorB - a.totalSkorB;
    return b.finalScore - a.finalScore;
  });

  const top5Assessments = sorted.slice(0, 5);

  // Pre-fetch assessments for all 6 periods
  const periodAssessmentsMap: Record<string, MonthlyAssessment[]> = {};
  last6Periods.forEach((p) => {
    periodAssessmentsMap[p] = getAssessmentsForPeriod(
      p,
      employees,
      masterList,
      currentPeriod,
      currentAssessments
    );
  });

  const PALETTE = [
    '#2563EB', // 1st - Royal Blue
    '#059669', // 2nd - Emerald Green
    '#7C3AED', // 3rd - Vivid Violet
    '#D97706', // 4th - Warm Amber Gold
    '#E11D48', // 5th - Vibrant Rose
  ];

  const performers: TopPerformerEmployee[] = top5Assessments.map((a, idx) => {
    const history: Record<string, TopPerformerHistoryPoint> = {};
    const scores: number[] = [];

    last6Periods.forEach((p) => {
      const monthAssessments = periodAssessmentsMap[p] || [];
      const match = monthAssessments.find((m) => m.employeeId === a.employeeId) || a;

      let metricScore = match.finalScore;
      if (rankingMetric === 'sikap') metricScore = match.totalSkorA;
      if (rankingMetric === 'kpi') metricScore = match.totalSkorB;

      scores.push(metricScore);
      history[p] = {
        period: p,
        label: formatPeriodIndonesian(p, 'short'),
        fullLabel: formatPeriodIndonesian(p, 'full'),
        finalScore: match.finalScore,
        scoreA: match.totalSkorA,
        scoreB: match.totalSkorB,
        grade: match.grade,
      };
    });

    const sum = scores.reduce((sAcc, s) => sAcc + s, 0);
    const avg = scores.length > 0 ? Number((sum / scores.length).toFixed(2)) : a.finalScore;
    const peak = scores.length > 0 ? Math.max(...scores) : a.finalScore;

    // MoM change
    const currScore = scores[scores.length - 1] ?? 0;
    const prevScore = scores.length > 1 ? scores[scores.length - 2] : currScore;
    const firstScore = scores.length > 0 ? scores[0] : currScore;
    const momChange = Number((currScore - prevScore).toFixed(2));
    const sixMonthChange = Number((currScore - firstScore).toFixed(2));

    return {
      rank: idx + 1,
      employeeId: a.employeeId,
      employeeNik: a.employeeNik,
      employeeName: a.employeeName,
      division: a.division,
      position: a.position,
      currentAssessment: a,
      currentScore: a.finalScore,
      currentGrade: a.grade,
      currentScoreA: a.totalSkorA,
      currentScoreB: a.totalSkorB,
      average6MonthScore: avg,
      peakScore: peak,
      momChange,
      sixMonthChange,
      color: PALETTE[idx % PALETTE.length],
      history,
    };
  });

  // Prepare chart data rows
  const chartData = last6Periods.map((period) => {
    const row: any = {
      period,
      label: formatPeriodIndonesian(period, 'short'),
      fullLabel: formatPeriodIndonesian(period, 'full'),
    };
    performers.forEach((perf) => {
      const pt = perf.history[period];
      let val = pt ? pt.finalScore : 0;
      if (rankingMetric === 'sikap') val = pt ? pt.scoreA : 0;
      if (rankingMetric === 'kpi') val = pt ? pt.scoreB : 0;
      row[perf.employeeId] = val;
    });
    return row;
  });

  const overallTopAvg = performers.length > 0
    ? Number((performers.reduce((sAcc, p) => sAcc + p.currentScore, 0) / performers.length).toFixed(2))
    : 0;

  return {
    periods: last6Periods,
    periodLabels: last6Periods.map((p) => ({
      period: p,
      label: formatPeriodIndonesian(p, 'short'),
      fullLabel: formatPeriodIndonesian(p, 'full'),
    })),
    performers,
    chartData,
    overallTopAvg,
    highestPerformerName: performers[0]?.employeeName || '-',
    highestPerformerScore: performers[0]?.currentScore || 0,
  };
}
