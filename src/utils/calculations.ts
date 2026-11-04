import { FrequentLateStatus, MasterAttitudeRecord, MonthlyAssessment } from '../types';

/**
 * Automatically distribute weights across all attitude criteria so that the total is exactly 100% (1.00).
 * Remainder is distributed smoothly to maintain clean percentages.
 */
export function autoDistributeWeights(items: MasterAttitudeRecord[]): MasterAttitudeRecord[] {
  const activeItems = items.filter((item) => item.enabled !== false);
  const n = activeItems.length;
  if (n === 0) return items;

  // Base percentage calculation in integer percentages
  const basePercent = Math.floor(100 / n);
  const remainder = 100 - basePercent * n;

  let activeIndex = 0;
  return items.map((item) => {
    if (item.enabled === false) {
      return { ...item, weight: 0, penaltyWeight: 0 };
    }

    const percent = basePercent + (activeIndex < remainder ? 1 : 0);
    activeIndex++;

    const weight = Number((percent / 100).toFixed(2));
    const isAttendance = item.isAttendancePenalty;
    const penaltyWeight = isAttendance
      ? Math.max(0.05, Number((weight - 0.05).toFixed(2)))
      : undefined;

    return {
      ...item,
      weight,
      penaltyWeight,
    };
  });
}

/**
 * Helper to get an employee's score for a specific attitude criterion
 */
export function getCriterionScore(
  assessment: Partial<MonthlyAssessment> & { [key: string]: any },
  criterionId: string,
  defaultValue = 8.5
): number {
  if (assessment.customAttitudeScores && assessment.customAttitudeScores[criterionId] !== undefined) {
    return Number(assessment.customAttitudeScores[criterionId]);
  }
  if ((assessment as any)[criterionId] !== undefined && typeof (assessment as any)[criterionId] === 'number') {
    return Number((assessment as any)[criterionId]);
  }
  return defaultValue;
}

/**
 * Dynamic calculation of Score A using MasterAttitudeRecord list
 */
export function calculateDynamicScoreA(
  criteria: MasterAttitudeRecord[],
  assessment: Partial<MonthlyAssessment> & { [key: string]: any },
  seringTelat: FrequentLateStatus
): number {
  const activeCriteria = criteria.filter((c) => c.enabled !== false);
  if (activeCriteria.length === 0) {
    return calculateScoreA({
      kerajinanAbsensi: assessment.kerajinanAbsensi ?? 8.5,
      izinKeluar: assessment.izinKeluar ?? 8.5,
      hindariKesalahanFatal: assessment.hindariKesalahanFatal ?? 8.5,
      integritasKriminal: assessment.integritasKriminal ?? 10,
      sopanSantun: assessment.sopanSantun ?? 8.5,
      kerapihan: assessment.kerapihan ?? 8.5,
      taatAturan: assessment.taatAturan ?? 8.5,
      fokusKeberadaan: assessment.fokusKeberadaan ?? 8.5,
      seringTelat,
    });
  }

  let totalScore = 0;
  for (const c of activeCriteria) {
    const rawVal = getCriterionScore(assessment, c.id, c.defaultValue ?? 8.5);
    let effectiveWeight = c.weight;
    if (c.isAttendancePenalty && seringTelat === 'Ya') {
      effectiveWeight = c.penaltyWeight ?? Math.max(0.05, Number((c.weight - 0.05).toFixed(2)));
    }
    totalScore += rawVal * effectiveWeight;
  }

  return Number(Math.max(0, Math.min(10, totalScore)).toFixed(2));
}

/**
 * Formula Sikap (A) from openpyxl:
 * =IF(A{r}="","", (C{r}*IF(K{r}="Ya",0.10,0.15)) + (D{r}*0.1) + (E{r}*0.2) + (F{r}*0.25) + (G{r}*0.05) + (H{r}*0.1) + (I{r}*0.1) + (J{r}*0.05))
 */
export function calculateScoreA(params: {
  kerajinanAbsensi: number;
  izinKeluar: number;
  hindariKesalahanFatal: number;
  integritasKriminal: number;
  sopanSantun: number;
  kerapihan: number;
  taatAturan: number;
  fokusKeberadaan: number;
  seringTelat: FrequentLateStatus;
}): number {
  const attendanceWeight = params.seringTelat === 'Ya' ? 0.10 : 0.15;
  const score =
    (params.kerajinanAbsensi * attendanceWeight) +
    (params.izinKeluar * 0.10) +
    (params.hindariKesalahanFatal * 0.20) +
    (params.integritasKriminal * 0.25) +
    (params.sopanSantun * 0.05) +
    (params.kerapihan * 0.10) +
    (params.taatAturan * 0.10) +
    (params.fokusKeberadaan * 0.05);

  return Number(Math.max(0, Math.min(10, score)).toFixed(2));
}

/**
 * Formula KPI Teknis (B) from openpyxl:
 * =IF(B{r}="","", (E{r}*D{r}) + (H{r}*G{r}))
 * where E is Skor KPI 1, D is Bobot 1, H is Skor KPI 2, G is Bobot 2
 */
export function calculateScoreB(params: {
  kpi1Score: number;
  kpi1Weight: number;
  kpi2Score: number;
  kpi2Weight: number;
}): number {
  const score = (params.kpi1Score * params.kpi1Weight) + (params.kpi2Score * params.kpi2Weight);
  return Number(Math.max(0, Math.min(10, score)).toFixed(2));
}

/**
 * Formula Final Score:
 * =IF(A{r}="","", (C{r}*0.5) + (D{r}*0.5))
 * Bobot 50% Sikap + 50% KPI
 */
export function calculateFinalScore(scoreA: number, scoreB: number): number {
  const finalScore = (scoreA * 0.5) + (scoreB * 0.5);
  return Number(Math.max(0, Math.min(10, finalScore)).toFixed(2));
}

/**
 * Status / Kategori Formula from openpyxl:
 * =IF(A{r}="","", IF(E{r}>=8.5, "Sangat Baik (A)", IF(E{r}>=7, "Baik (B)", IF(E{r}>=5, "Cukup (C)", IF(E{r}>=3, "Kurang (D)", "Sangat Kurang/PHK (E)")))))
 */
export function determineGradeAndStatus(finalScore: number): {
  grade: 'A' | 'B' | 'C' | 'D' | 'E';
  statusLabel: string;
  badgeColor: {
    bg: string;
    text: string;
    border: string;
    glow: string;
  };
  recommendation: string;
} {
  if (finalScore >= 8.5) {
    return {
      grade: 'A',
      statusLabel: 'Sangat Baik (A)',
      badgeColor: {
        bg: 'bg-emerald-50 text-emerald-700',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        glow: 'shadow-emerald-500/20',
      },
      recommendation: 'Direkomendasikan menerima insentif prestasi kerja maksimal, promosi jabatan / kenaikan level berkala.',
    };
  }
  if (finalScore >= 7.0) {
    return {
      grade: 'B',
      statusLabel: 'Baik (B)',
      badgeColor: {
        bg: 'bg-blue-50 text-blue-700',
        text: 'text-blue-700',
        border: 'border-blue-200',
        glow: 'shadow-blue-500/20',
      },
      recommendation: 'Memenuhi standar ekspektasi perusahaan. Berhak atas insentif kerja standar & perpanjangan kontrak.',
    };
  }
  if (finalScore >= 5.0) {
    return {
      grade: 'C',
      statusLabel: 'Cukup (C)',
      badgeColor: {
        bg: 'bg-amber-50 text-amber-700',
        text: 'text-amber-700',
        border: 'border-amber-200',
        glow: 'shadow-amber-500/20',
      },
      recommendation: 'Performa cukup namun memerlukan pendampingan (coaching). Evaluasi ulang dalam periode 1-3 bulan ke depan.',
    };
  }
  if (finalScore >= 3.0) {
    return {
      grade: 'D',
      statusLabel: 'Kurang (D)',
      badgeColor: {
        bg: 'bg-orange-50 text-orange-700',
        text: 'text-orange-700',
        border: 'border-orange-200',
        glow: 'shadow-orange-500/20',
      },
      recommendation: 'Di bawah ekspektasi. Penerbitan Surat Peringatan (SP 1) atau pembinaan intensif khusus divisi.',
    };
  }
  return {
    grade: 'E',
    statusLabel: 'Sangat Kurang/PHK (E)',
    badgeColor: {
      bg: 'bg-rose-50 text-rose-700',
      text: 'text-rose-700',
      border: 'border-rose-200',
      glow: 'shadow-rose-500/20',
    },
    recommendation: 'Kinerja kritis tidak dapat ditolerir. Direkomendasikan evaluasi pemutusan hubungan kerja (PHK) / tidak diperpanjang.',
  };
}

/**
 * Breakdown generator for full transparency explanation
 */
export function getDetailedFormulaBreakdown(data: {
  kerajinanAbsensi: number;
  izinKeluar: number;
  hindariKesalahanFatal: number;
  integritasKriminal: number;
  sopanSantun: number;
  kerapihan: number;
  taatAturan: number;
  fokusKeberadaan: number;
  seringTelat: FrequentLateStatus;
  kpi1Name: string;
  kpi1Weight: number;
  kpi1Score: number;
  kpi2Name: string;
  kpi2Weight: number;
  kpi2Score: number;
  scoreA: number;
  scoreB: number;
  finalScore: number;
  customAttitudeScores?: Record<string, number>;
}, criteria?: MasterAttitudeRecord[]) {
  const isPenalized = data.seringTelat === 'Ya';

  let partsA: Array<{
    label: string;
    raw: number;
    weight: number;
    contribution: number;
    note: string;
  }> = [];

  if (criteria && criteria.length > 0) {
    const active = criteria.filter((c) => c.enabled !== false);
    partsA = active.map((c) => {
      const raw = getCriterionScore(data, c.id, c.defaultValue ?? 8.5);
      let weight = c.weight;
      let note = `Bobot ${(c.weight * 100).toFixed(0)}%`;
      if (c.isAttendancePenalty && isPenalized) {
        weight = c.penaltyWeight ?? Math.max(0.05, Number((c.weight - 0.05).toFixed(2)));
        note = `Penalti sering terlambat: bobot dipotong dari ${(c.weight * 100).toFixed(0)}% jadi ${(weight * 100).toFixed(0)}%`;
      } else if (c.description) {
        note = `${(weight * 100).toFixed(0)}% (${c.description.slice(0, 40)}...)`;
      }
      return {
        label: c.name,
        raw,
        weight,
        contribution: Number((raw * weight).toFixed(2)),
        note,
      };
    });
  } else {
    const attendanceWeight = data.seringTelat === 'Ya' ? 0.10 : 0.15;
    partsA = [
      { label: 'Kerajinan & Absensi', raw: data.kerajinanAbsensi, weight: attendanceWeight, contribution: Number((data.kerajinanAbsensi * attendanceWeight).toFixed(2)), note: isPenalized ? 'Penalti sering terlambat: bobot berkurang dari 15% jadi 10%' : 'Maksimal 15%' },
      { label: 'Izin Keluar', raw: data.izinKeluar, weight: 0.10, contribution: Number((data.izinKeluar * 0.10).toFixed(2)), note: 'Bobot 10%' },
      { label: 'Hindari Kesalahan Fatal', raw: data.hindariKesalahanFatal, weight: 0.20, contribution: Number((data.hindariKesalahanFatal * 0.20).toFixed(2)), note: 'Bobot 20%' },
      { label: 'Integritas / Bebas Kriminal', raw: data.integritasKriminal, weight: 0.25, contribution: Number((data.integritasKriminal * 0.25).toFixed(2)), note: 'Bobot 25%' },
      { label: 'Sopan Santun', raw: data.sopanSantun, weight: 0.05, contribution: Number((data.sopanSantun * 0.05).toFixed(2)), note: 'Bobot 5%' },
      { label: 'Kerapihan', raw: data.kerapihan, weight: 0.10, contribution: Number((data.kerapihan * 0.10).toFixed(2)), note: 'Bobot 10%' },
      { label: 'Taat Aturan', raw: data.taatAturan, weight: 0.10, contribution: Number((data.taatAturan * 0.10).toFixed(2)), note: 'Bobot 10%' },
      { label: 'Fokus & Keberadaan', raw: data.fokusKeberadaan, weight: 0.05, contribution: Number((data.fokusKeberadaan * 0.05).toFixed(2)), note: 'Bobot 5%' },
    ];
  }

  const partsB = [
    { label: data.kpi1Name, raw: data.kpi1Score, weight: data.kpi1Weight, contribution: Number((data.kpi1Score * data.kpi1Weight).toFixed(2)), note: `Bobot ${(data.kpi1Weight * 100).toFixed(0)}%` },
    { label: data.kpi2Name, raw: data.kpi2Score, weight: data.kpi2Weight, contribution: Number((data.kpi2Score * data.kpi2Weight).toFixed(2)), note: `Bobot ${(data.kpi2Weight * 100).toFixed(0)}%` },
  ];

  return {
    partsA,
    partsB,
    totalA: data.scoreA,
    totalB: data.scoreB,
    contributionA: Number((data.scoreA * 0.5).toFixed(2)),
    contributionB: Number((data.scoreB * 0.5).toFixed(2)),
    finalScore: data.finalScore,
    isPenalized,
  };
}
