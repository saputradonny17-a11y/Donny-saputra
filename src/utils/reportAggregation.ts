import { Employee, MonthlyAssessment } from '../types';
import { determineGradeAndStatus } from './calculations';
import { parseAssessmentDate, getIndonesianMonthName, INDONESIAN_DAYS } from './assessmentDatabase';

export type ReportScopeType = 'harian' | 'mingguan' | 'bulanan' | 'tahunan';

export interface WeeklyAssessmentSummary {
  weekNumber: number; // 1, 2, 3, 4, 5
  weekLabel: string; // e.g. "Minggu 4 (22 - 28 Sep 2026)"
  period: string; // "2026-09"
  year: number;
  month: number;
  monthName: string;
  totalDays: number;
  presentOnTimeCount: number;
  lateCount: number;
  permitSickCount: number;
  totalLateMinutes: number;
  avgSkorA: number;
  avgSkorB: number;
  finalScore: number;
  grade: string;
  statusLabel: string;
  summaryNote: string;
  dailyRecords: MonthlyAssessment[];
}

export interface MonthlyAccumulationSummary {
  period: string; // "2026-09"
  year: number;
  month: number;
  monthName: string;
  totalWorkingDays: number;
  presentCount: number;
  lateCount: number;
  permitSickCount: number;
  totalLateMinutes: number;
  avgSkorA: number;
  avgSkorB: number;
  finalScore: number;
  grade: string;
  statusLabel: string;
  recommendation: string;
  weeklyBreakdowns: WeeklyAssessmentSummary[];
  allDailyRecords: MonthlyAssessment[];
}

export interface AnnualAssessmentSummary {
  year: number;
  yearLabel: string; // e.g. "Tahun 2026"
  monthsEvaluatedCount: number;
  totalWorkingDays: number;
  totalLateCount: number;
  avgSkorA: number;
  avgSkorB: number;
  finalScore: number;
  grade: string;
  statusLabel: string;
  summaryNote: string;
  monthlySummaries: MonthlyAccumulationSummary[];
}

/**
 * Determine which week of the month a day belongs to (1 to 5)
 */
export function getWeekOfMonth(day: number): number {
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  if (day <= 28) return 4;
  return 5;
}

/**
 * Get human-readable date range for week of a month
 */
export function getWeekRangeLabel(weekNum: number, monthName: string, year: number): string {
  const ranges: Record<number, string> = {
    1: `1 - 7 ${monthName} ${year}`,
    2: `8 - 14 ${monthName} ${year}`,
    3: `15 - 21 ${monthName} ${year}`,
    4: `22 - 28 ${monthName} ${year}`,
    5: `29 - 31 ${monthName} ${year}`,
  };
  return ranges[weekNum] || `Minggu ${weekNum} ${monthName} ${year}`;
}

/**
 * Aggregates a list of daily assessments of a single employee into Weekly Summaries
 */
export function aggregateEmployeeWeekly(
  dailyAssessments: MonthlyAssessment[],
  filterPeriod?: string
): WeeklyAssessmentSummary[] {
  // Filter by period if requested
  const records = filterPeriod
    ? dailyAssessments.filter((a) => a.period === filterPeriod)
    : dailyAssessments;

  // Group by "period-weekNum"
  const groups: Record<string, MonthlyAssessment[]> = {};

  records.forEach((record) => {
    const day = record.day || (record.assessmentDate ? parseInt(record.assessmentDate.split('-')[2], 10) : 24);
    const weekNum = getWeekOfMonth(day);
    const key = `${record.period}-W${weekNum}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(record);
  });

  const weeklyList: WeeklyAssessmentSummary[] = [];

  Object.entries(groups).forEach(([key, items]) => {
    if (items.length === 0) return;
    const first = items[0];
    const period = first.period;
    const [yStr, mStr] = period.split('-');
    const year = parseInt(yStr, 10) || 2026;
    const month = parseInt(mStr, 10) || 9;
    const monthName = getIndonesianMonthName(month);
    const weekNum = parseInt(key.split('-W')[1], 10) || 1;

    let totalA = 0;
    let totalB = 0;
    let presentCount = 0;
    let lateCount = 0;
    let permitSickCount = 0;
    let totalLateMins = 0;

    items.forEach((item) => {
      totalA += item.totalSkorA;
      totalB += item.totalSkorB;
      const status = item.dailyAttendanceStatus;
      if (status === 'Hadir Tepat Waktu') presentCount++;
      else if (status === 'Terlambat') {
        lateCount++;
        totalLateMins += item.dailyAttendanceLateMinutes || 15;
      } else {
        permitSickCount++;
      }
    });

    const count = items.length;
    const avgSkorA = Number((totalA / count).toFixed(2));
    const avgSkorB = Number((totalB / count).toFixed(2));
    const finalScore = Number(((avgSkorA * 0.5) + (avgSkorB * 0.5)).toFixed(2));
    const { grade, statusLabel } = determineGradeAndStatus(finalScore);

    const weekRange = getWeekRangeLabel(weekNum, monthName, year);
    const summaryNote =
      lateCount > 0
        ? `Tercatat ${count} hari evaluasi (${lateCount}x terlambat total ${totalLateMins} mnt). Capaian nilai akhir rata-rata ${finalScore.toFixed(2)}.`
        : `Tercatat ${count} hari evaluasi, seluruhnya tepat waktu. Capaian nilai akhir rata-rata ${finalScore.toFixed(2)} (${statusLabel}).`;

    weeklyList.push({
      weekNumber: weekNum,
      weekLabel: `Minggu ${weekNum} (${weekRange})`,
      period,
      year,
      month,
      monthName,
      totalDays: count,
      presentOnTimeCount: presentCount,
      lateCount,
      permitSickCount,
      totalLateMinutes: totalLateMins,
      avgSkorA,
      avgSkorB,
      finalScore,
      grade,
      statusLabel,
      summaryNote,
      dailyRecords: items.sort((a, b) => (b.assessmentDate || '').localeCompare(a.assessmentDate || '')),
    });
  });

  // Sort descending by period then weekNumber
  return weeklyList.sort((a, b) => {
    if (a.period !== b.period) return b.period.localeCompare(a.period);
    return b.weekNumber - a.weekNumber;
  });
}

/**
 * Aggregates a list of daily assessments of a single employee into Monthly Accumulation Summaries
 */
export function aggregateEmployeeMonthly(
  dailyAssessments: MonthlyAssessment[]
): MonthlyAccumulationSummary[] {
  // Group by period
  const groups: Record<string, MonthlyAssessment[]> = {};

  dailyAssessments.forEach((record) => {
    const p = record.period || '2026-09';
    if (!groups[p]) groups[p] = [];
    groups[p].push(record);
  });

  const monthlyList: MonthlyAccumulationSummary[] = [];

  Object.entries(groups).forEach(([period, items]) => {
    if (items.length === 0) return;
    const [yStr, mStr] = period.split('-');
    const year = parseInt(yStr, 10) || 2026;
    const month = parseInt(mStr, 10) || 9;
    const monthName = getIndonesianMonthName(month);

    let totalA = 0;
    let totalB = 0;
    let presentCount = 0;
    let lateCount = 0;
    let permitSickCount = 0;
    let totalLateMins = 0;

    items.forEach((item) => {
      totalA += item.totalSkorA;
      totalB += item.totalSkorB;
      const status = item.dailyAttendanceStatus;
      if (status === 'Hadir Tepat Waktu') presentCount++;
      else if (status === 'Terlambat') {
        lateCount++;
        totalLateMins += item.dailyAttendanceLateMinutes || 15;
      } else {
        permitSickCount++;
      }
    });

    const count = items.length;
    const avgSkorA = Number((totalA / count).toFixed(2));
    const avgSkorB = Number((totalB / count).toFixed(2));
    const finalScore = Number(((avgSkorA * 0.5) + (avgSkorB * 0.5)).toFixed(2));
    const { grade, statusLabel } = determineGradeAndStatus(finalScore);

    const weeklyBreakdowns = aggregateEmployeeWeekly(items, period);

    const recommendation =
      grade === 'A'
        ? 'Performa kerja sangat memuaskan, konsisten melampaui target harian & mingguan. Memenuhi kualifikasi bonus prestasi.'
        : grade === 'B'
        ? 'Performa kerja baik dan stabil sesuai SOP perusahaan. Pertahankan ritme kerja dan kedisiplinan.'
        : grade === 'C'
        ? 'Performa kerja cukup. Diperlukan konsistensi kedisiplinan dan peningkatan pencapaian KPI harian.'
        : 'Performa kerja membutuhkan bimbingan intensif dan pemantauan harian oleh HRD & atasan langsung.';

    monthlyList.push({
      period,
      year,
      month,
      monthName,
      totalWorkingDays: count,
      presentCount,
      lateCount,
      permitSickCount,
      totalLateMinutes: totalLateMins,
      avgSkorA,
      avgSkorB,
      finalScore,
      grade,
      statusLabel,
      recommendation,
      weeklyBreakdowns,
      allDailyRecords: items.sort((a, b) => (b.assessmentDate || '').localeCompare(a.assessmentDate || '')),
    });
  });

  return monthlyList.sort((a, b) => b.period.localeCompare(a.period));
}

/**
 * Aggregates a list of daily assessments of a single employee into Annual Summaries
 */
export function aggregateEmployeeAnnual(
  dailyAssessments: MonthlyAssessment[]
): AnnualAssessmentSummary[] {
  const monthlyList = aggregateEmployeeMonthly(dailyAssessments);

  // Group monthly summaries by year
  const yearGroups: Record<number, MonthlyAccumulationSummary[]> = {};

  monthlyList.forEach((m) => {
    if (!yearGroups[m.year]) yearGroups[m.year] = [];
    yearGroups[m.year].push(m);
  });

  const annualList: AnnualAssessmentSummary[] = [];

  Object.entries(yearGroups).forEach(([yStr, mList]) => {
    const year = parseInt(yStr, 10);
    let sumScore = 0;
    let sumA = 0;
    let sumB = 0;
    let sumDays = 0;
    let sumLate = 0;

    mList.forEach((m) => {
      sumScore += m.finalScore;
      sumA += m.avgSkorA;
      sumB += m.avgSkorB;
      sumDays += m.totalWorkingDays;
      sumLate += m.lateCount;
    });

    const mCount = mList.length;
    const finalScore = Number((sumScore / mCount).toFixed(2));
    const avgSkorA = Number((sumA / mCount).toFixed(2));
    const avgSkorB = Number((sumB / mCount).toFixed(2));
    const { grade, statusLabel } = determineGradeAndStatus(finalScore);

    const summaryNote = `Akumulasi tahun ${year} merangkum ${mCount} bulan evaluasi (${sumDays} hari kerja tercatat). Total keterlambatan: ${sumLate} kali. Nilai akhir tahunan: ${finalScore.toFixed(2)} (${statusLabel}).`;

    annualList.push({
      year,
      yearLabel: `Tahun ${year}`,
      monthsEvaluatedCount: mCount,
      totalWorkingDays: sumDays,
      totalLateCount: sumLate,
      avgSkorA,
      avgSkorB,
      finalScore,
      grade,
      statusLabel,
      summaryNote,
      monthlySummaries: mList.sort((a, b) => b.period.localeCompare(a.period)),
    });
  });

  return annualList.sort((a, b) => b.year - a.year);
}
