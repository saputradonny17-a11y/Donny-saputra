import { Employee, MasterKPIRecord, MonthlyAssessment } from '../types';
import { buildAssessmentForEmployee } from '../data/initialData';
import { determineGradeAndStatus } from './calculations';

export const INDONESIAN_DAYS = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu'
];

export const INDONESIAN_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
];

/**
 * Returns the Indonesian day of the week for a given date.
 */
export function getIndonesianDayName(dateInput: Date | string): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return 'Kamis';
  return INDONESIAN_DAYS[d.getDay()] || 'Kamis';
}

/**
 * Returns the Indonesian month name (1 - 12).
 */
export function getIndonesianMonthName(monthNumber: number): string {
  const idx = Math.max(0, Math.min(11, monthNumber - 1));
  return INDONESIAN_MONTHS[idx] || 'September';
}

/**
 * Parses and computes detailed Indonesian day, date, month, year details.
 */
export function parseAssessmentDate(dateStr?: string, defaultPeriod = '2026-09'): {
  assessmentDate: string;
  dayName: string;
  day: number;
  month: number;
  monthName: string;
  year: number;
  assessmentDateFormatted: string;
} {
  let targetDateStr = dateStr;

  if (!targetDateStr) {
    // If no date provided, default to the 24th/25th of the assessment period
    const parts = defaultPeriod.split('-');
    const year = parts[0] || '2026';
    const month = parts[1] || '09';
    // Use the 24th as closing assessment date
    targetDateStr = `${year}-${month.padStart(2, '0')}-24`;
  }

  // Ensure format is YYYY-MM-DD
  const dateObj = new Date(targetDateStr);
  const valid = !isNaN(dateObj.getTime());

  let year = 2026;
  let month = 9;
  let day = 24;

  if (valid) {
    year = dateObj.getFullYear();
    month = dateObj.getMonth() + 1;
    day = dateObj.getDate();
  } else {
    const parts = targetDateStr.split('-');
    if (parts.length >= 3) {
      year = parseInt(parts[0], 10) || 2026;
      month = parseInt(parts[1], 10) || 9;
      day = parseInt(parts[2], 10) || 24;
    }
  }

  const safeDate = new Date(year, month - 1, day);
  const dayName = INDONESIAN_DAYS[safeDate.getDay()] || 'Kamis';
  const monthName = getIndonesianMonthName(month);
  const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const assessmentDateFormatted = `${dayName}, ${day} ${monthName} ${year}`;

  return {
    assessmentDate: formattedDate,
    dayName,
    day,
    month,
    monthName,
    year,
    assessmentDateFormatted
  };
}

/**
 * Enriches an assessment object with complete date metadata (Hari, Tanggal, Bulan, Tahun).
 */
export function enrichAssessmentWithDate(
  assessment: MonthlyAssessment,
  explicitDate?: string
): MonthlyAssessment {
  const dateInfo = parseAssessmentDate(explicitDate || assessment.assessmentDate, assessment.period);
  return {
    ...assessment,
    ...dateInfo
  };
}

/**
 * Save assessment records for a specific period in persistent database (localStorage).
 * Also updates a unified historical index.
 */
export function savePeriodAssessments(period: string, assessments: MonthlyAssessment[]): void {
  try {
    const enriched = assessments.map((a) => enrichAssessmentWithDate(a));
    const key = `kpi_assessments_v2_${period}`;
    localStorage.setItem(key, JSON.stringify(enriched));

    // Also update unified index of all periods
    try {
      const storedHistoryIndex = localStorage.getItem('kpi_available_periods_v2');
      let periodsList: string[] = storedHistoryIndex ? JSON.parse(storedHistoryIndex) : [];
      if (!periodsList.includes(period)) {
        periodsList = [period, ...periodsList.filter((p) => p !== period)];
        localStorage.setItem('kpi_available_periods_v2', JSON.stringify(periodsList));
      }
    } catch {
      // ignore
    }
  } catch (err) {
    console.warn('Failed to save assessments to localStorage database:', err);
  }
}

/**
 * Retrieves assessments for a period with complete date metadata guaranteed.
 */
export function getPeriodAssessments(
  period: string,
  employees: Employee[],
  masterList: MasterKPIRecord[]
): MonthlyAssessment[] {
  const key = `kpi_assessments_v2_${period}`;
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: MonthlyAssessment) => enrichAssessmentWithDate(item));
      }
    }
  } catch {
    // fallback
  }

  // Generate fresh from employee records and persist
  const generated = employees.map((emp) => {
    const a = buildAssessmentForEmployee(emp, period, masterList);
    return enrichAssessmentWithDate(a);
  });
  savePeriodAssessments(period, generated);
  return generated;
}

/**
 * Builds a realistic daily assessment for an employee for a specific date (YYYY-MM-DD).
 * Captures daily attendance (jam kehadiran, keterlambatan), daily attitude score, daily KPI score,
 * and daily performance notes.
 */
export function buildDailyAssessmentForEmployee(
  emp: Employee,
  dateStr: string,
  masterList: MasterKPIRecord[],
  presetData?: Partial<MonthlyAssessment>
): MonthlyAssessment {
  const period = dateStr.substring(0, 7);
  const baseAssessment = buildAssessmentForEmployee(emp, period, masterList, presetData);
  const dateInfo = parseAssessmentDate(dateStr, period);

  // Deterministic daily pseudo-random factors based on employee NIK and day number
  const nikNum = parseInt(emp.nik.replace(/\D/g, ''), 10) || 1;
  const daySeed = (nikNum * 17 + dateInfo.day * 13 + dateInfo.month * 7) % 100;

  // Realistic daily attendance variation
  let dailyAttendanceStatus: 'Hadir Tepat Waktu' | 'Terlambat' | 'Izin' | 'Sakit' | 'Alpha' = 'Hadir Tepat Waktu';
  let dailyAttendanceLateMinutes = 0;
  let dailyNote = 'Presensi hadir tepat waktu. Target kerja harian diselesaikan sesuai SOP divisi.';

  if (baseAssessment.seringTelat === 'Ya') {
    // If the employee is marked as often late in master/monthly profile
    if (daySeed % 3 === 0) {
      dailyAttendanceStatus = 'Terlambat';
      dailyAttendanceLateMinutes = 10 + (daySeed % 25);
      dailyNote = `Terlambat ${dailyAttendanceLateMinutes} menit. Evaluasi kedisiplinan pagi, target harian tetap diselesaikan.`;
    } else if (daySeed % 17 === 0) {
      dailyAttendanceStatus = 'Izin';
      dailyNote = 'Izin urusan mendesak dengan surat konfirmasi HR.';
    }
  } else {
    // Normal high-performing employee
    if (daySeed === 7) {
      dailyAttendanceStatus = 'Terlambat';
      dailyAttendanceLateMinutes = 12;
      dailyNote = 'Terlambat 12 menit karena kendala perjalanan. Melapor ke atasan langsung.';
    } else if (daySeed === 29) {
      dailyAttendanceStatus = 'Sakit';
      dailyNote = 'Sakit (surat keterangan dokter terlampir).';
    } else {
      const notesTemplates = [
        'Presensi hadir tepat waktu. Output tugas harian prima dan rapi.',
        'Hadir 15 menit sebelum shift. Koordinasi tim berjalan sangat baik.',
        'Target pekerjaan harian tercapai 100%. Komunikasi kerja efektif.',
        'Presensi tepat waktu. Menyelesaikan checklist operasional harian.',
        'Kedisiplinan terjaga dengan baik. Nihil kendala operasional.'
      ];
      dailyNote = notesTemplates[daySeed % notesTemplates.length];
    }
  }

  // Daily scores
  const attendanceFactor =
    dailyAttendanceStatus === 'Terlambat'
      ? -0.4
      : dailyAttendanceStatus === 'Hadir Tepat Waktu'
      ? 0.1
      : -0.2;

  const dailyTotalSkorA = Math.max(
    5.0,
    Math.min(10.0, Number((baseAssessment.totalSkorA + attendanceFactor).toFixed(2)))
  );

  const dailyKpiVariance = ((daySeed % 7) - 3) * 0.1;
  const dailyTotalSkorB = Math.max(
    5.0,
    Math.min(10.0, Number((baseAssessment.totalSkorB + dailyKpiVariance).toFixed(2)))
  );

  const dailyFinalScore = Number(((dailyTotalSkorA * 0.5) + (dailyTotalSkorB * 0.5)).toFixed(2));
  const { grade: dailyGrade, statusLabel: dailyStatusLabel } = determineGradeAndStatus(dailyFinalScore);

  return {
    ...baseAssessment,
    id: `daily-${dateStr}-${emp.id}`,
    period,
    ...dateInfo,
    totalSkorA: dailyTotalSkorA,
    totalSkorB: dailyTotalSkorB,
    finalScore: dailyFinalScore,
    grade: dailyGrade,
    statusLabel: dailyStatusLabel,
    dailyAttendanceStatus,
    dailyAttendanceLateMinutes,
    dailyNote,
    notes: dailyNote,
  };
}

/**
 * Returns a list of daily dates (YYYY-MM-DD) for evaluation history.
 * Includes working days (excluding Sundays) for the periods, sorted descending (newest to oldest).
 */
export function getDailyHistoryDates(periods: string[], maxDaysPerPeriod = 24): string[] {
  const dates: string[] = [];
  const sortedPeriods = [...periods].sort((a, b) => b.localeCompare(a));

  for (const period of sortedPeriods) {
    const [yearStr, monthStr] = period.split('-');
    const year = parseInt(yearStr, 10) || 2026;
    const month = parseInt(monthStr, 10) || 9;
    const daysInMonth = new Date(year, month, 0).getDate();
    // For September 2026, user current date is 24
    const endDay = year === 2026 && month === 9 ? 24 : Math.min(daysInMonth, maxDaysPerPeriod);

    for (let d = endDay; d >= 1; d--) {
      const dt = new Date(year, month - 1, d);
      // Exclude Sunday (0) so history represents working days
      if (dt.getDay() !== 0) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        dates.push(dateStr);
      }
    }
  }

  return dates;
}

/**
 * Save daily assessment records for a specific date (YYYY-MM-DD).
 */
export function saveDailyAssessments(dateStr: string, assessments: MonthlyAssessment[]): void {
  try {
    const key = `kpi_daily_assessments_v2_${dateStr}`;
    localStorage.setItem(key, JSON.stringify(assessments));
  } catch (err) {
    console.warn('Failed to save daily assessments to localStorage:', err);
  }
}

/**
 * Retrieves daily assessments for all employees for a specific date (YYYY-MM-DD).
 */
export function getDailyAssessmentsForDate(
  dateStr: string,
  employees: Employee[],
  masterList: MasterKPIRecord[]
): MonthlyAssessment[] {
  const key = `kpi_daily_assessments_v2_${dateStr}`;
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item) => enrichAssessmentWithDate(item, dateStr));
      }
    }
  } catch {
    // fallback
  }

  // Generate deterministic daily assessments for that date and persist
  const generated = employees.map((emp) =>
    buildDailyAssessmentForEmployee(emp, dateStr, masterList)
  );
  saveDailyAssessments(dateStr, generated);
  return generated;
}

/**
 * Retrieves the complete DAILY historical evaluation log for an individual employee (PER HARI, bukan per periode).
 * Sorted chronologically descending (newest to oldest) so history can be checked per hari.
 */
export function getEmployeeAssessmentHistory(
  employeeId: string,
  periods: string[],
  employees: Employee[],
  masterList: MasterKPIRecord[]
): MonthlyAssessment[] {
  const dates = getDailyHistoryDates(periods, 24);
  const targetEmp = employees.find((e) => e.id === employeeId || e.nik === employeeId);
  if (!targetEmp) return [];

  const history: MonthlyAssessment[] = [];
  for (const dateStr of dates) {
    const dailyList = getDailyAssessmentsForDate(dateStr, employees, masterList);
    const found = dailyList.find(
      (a) => a.employeeId === targetEmp.id || a.employeeNik === targetEmp.nik
    );
    if (found) {
      history.push(found);
    }
  }

  return history;
}

/**
 * Retrieves all assessments across dates for unified daily history view and filtering (PER HARI).
 */
export function getAllHistoricalAssessments(
  periods: string[],
  employees: Employee[],
  masterList: MasterKPIRecord[]
): MonthlyAssessment[] {
  const dates = getDailyHistoryDates(periods, 24);
  const allRecords: MonthlyAssessment[] = [];

  for (const dateStr of dates) {
    const list = getDailyAssessmentsForDate(dateStr, employees, masterList);
    allRecords.push(...list);
  }

  return allRecords;
}

/**
 * Helper to get formatted Indonesian date (Day, Date, Month, Year) for a given period or date string.
 * Example output: "Kamis, 24 September 2026" or "24 September 2026"
 */
export function getPeriodDateFormatted(dateOrPeriod: string, includeDayName = true): string {
  if (dateOrPeriod && dateOrPeriod.split('-').length === 3) {
    // Already a full date (YYYY-MM-DD)
    const info = parseAssessmentDate(dateOrPeriod);
    return includeDayName
      ? info.assessmentDateFormatted
      : `${info.day} ${info.monthName} ${info.year}`;
  }

  const period = dateOrPeriod || '2026-09';
  try {
    const saved = localStorage.getItem(`kpi_assessments_v2_${period}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const first = parsed[0];
        if (first.assessmentDateFormatted && includeDayName) {
          return first.assessmentDateFormatted;
        }
        if (first.day && first.monthName && first.year) {
          return includeDayName && first.dayName
            ? `${first.dayName}, ${first.day} ${first.monthName} ${first.year}`
            : `${first.day} ${first.monthName} ${first.year}`;
        }
        if (first.assessmentDate) {
          const info = parseAssessmentDate(first.assessmentDate, period);
          return includeDayName ? info.assessmentDateFormatted : `${info.day} ${info.monthName} ${info.year}`;
        }
      }
    }
  } catch {
    // fallback
  }

  const fallback = parseAssessmentDate(undefined, period);
  return includeDayName
    ? fallback.assessmentDateFormatted
    : `${fallback.day} ${fallback.monthName} ${fallback.year}`;
}

