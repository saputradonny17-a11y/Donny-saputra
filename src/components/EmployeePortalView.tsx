import React, { useState, useMemo } from 'react';
import {
  User,
  Award,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Building,
  TrendingUp,
  Clock,
  Printer,
  FileText,
  ShieldCheck,
  CalendarCheck,
  Eye,
  Filter,
  BarChart2
} from 'lucide-react';
import { Employee, MasterAttitudeRecord, MasterKPIRecord, MonthlyAssessment } from '../types';
import { determineGradeAndStatus, getDetailedFormulaBreakdown } from '../utils/calculations';
import { getEmployeeAssessmentHistory } from '../utils/assessmentDatabase';
import {
  aggregateEmployeeWeekly,
  aggregateEmployeeMonthly,
  aggregateEmployeeAnnual,
  ReportScopeType
} from '../utils/reportAggregation';

interface Props {
  assessments: MonthlyAssessment[];
  onOpenReportCard: (assessment: MonthlyAssessment) => void;
  masterAttitudeList?: MasterAttitudeRecord[];
  availablePeriods?: string[];
  employees?: Employee[];
  masterList?: MasterKPIRecord[];
}

export const EmployeePortalView: React.FC<Props> = ({
  assessments,
  onOpenReportCard,
  masterAttitudeList,
  availablePeriods = ['2026-09', '2026-08', '2026-07', '2026-06', '2026-05', '2026-04'],
  employees = [],
  masterList = [],
}) => {
  const [selectedEmpId, setSelectedEmpId] = useState<string>(assessments[0]?.employeeId || '');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredList = assessments.filter(
    (a) =>
      a.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.employeeNik.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.division.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentAssessment =
    assessments.find((a) => a.employeeId === selectedEmpId) ||
    filteredList[0] ||
    assessments[0];

  // Retrieve multi-period historical assessments for selected employee from persistent database
  const employeeHistory = useMemo(() => {
    if (!currentAssessment) return [];
    if (employees.length > 0 && masterList.length > 0) {
      return getEmployeeAssessmentHistory(
        currentAssessment.employeeId,
        availablePeriods,
        employees,
        masterList
      );
    }
    return [currentAssessment];
  }, [currentAssessment?.employeeId, availablePeriods, employees, masterList]);

  // Multi-Scope Report State: Harian, Mingguan, Bulanan, Tahunan
  const [reportScope, setReportScope] = useState<ReportScopeType>('harian');
  const [showAllDaily, setShowAllDaily] = useState<boolean>(false);

  // Aggregated Weekly, Monthly & Annual records for this employee
  const weeklySummaries = useMemo(() => {
    return aggregateEmployeeWeekly(employeeHistory);
  }, [employeeHistory]);

  const monthlySummaries = useMemo(() => {
    return aggregateEmployeeMonthly(employeeHistory);
  }, [employeeHistory]);

  const annualSummaries = useMemo(() => {
    return aggregateEmployeeAnnual(employeeHistory);
  }, [employeeHistory]);

  // Daily records limit (show top 7 initially so it's not overwhelming, with expand option)
  const displayedDailyRecords = useMemo(() => {
    if (showAllDaily) return employeeHistory;
    return employeeHistory.slice(0, 7);
  }, [employeeHistory, showAllDaily]);

  if (!currentAssessment) {
    return (
      <div className="p-12 text-center text-slate-500 dark:text-slate-400">
        Belum ada data evaluasi karyawan pada periode ini.
      </div>
    );
  }

  const { statusLabel, recommendation } = determineGradeAndStatus(currentAssessment.finalScore);

  const breakdown = getDetailedFormulaBreakdown(
    {
      kerajinanAbsensi: currentAssessment.kerajinanAbsensi,
      izinKeluar: currentAssessment.izinKeluar,
      hindariKesalahanFatal: currentAssessment.hindariKesalahanFatal,
      integritasKriminal: currentAssessment.integritasKriminal,
      sopanSantun: currentAssessment.sopanSantun,
      kerapihan: currentAssessment.kerapihan,
      taatAturan: currentAssessment.taatAturan,
      fokusKeberadaan: currentAssessment.fokusKeberadaan,
      seringTelat: currentAssessment.seringTelat,
      kpi1Name: currentAssessment.kpi1Name,
      kpi1Weight: currentAssessment.kpi1Weight,
      kpi1Score: currentAssessment.kpi1Score,
      kpi2Name: currentAssessment.kpi2Name,
      kpi2Weight: currentAssessment.kpi2Weight,
      kpi2Score: currentAssessment.kpi2Score,
      scoreA: currentAssessment.totalSkorA,
      scoreB: currentAssessment.totalSkorB,
      finalScore: currentAssessment.finalScore,
      customAttitudeScores: currentAssessment.customAttitudeScores,
    },
    masterAttitudeList
  );

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      {/* Employee Selector Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
            {currentAssessment.employeeName.charAt(0)}
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Cari & Pilih Karyawan dari Database:</div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Ketik nama atau NIK..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none w-44"
              />
              <select
                value={currentAssessment.employeeId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="text-xs font-bold text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer bg-white dark:bg-slate-800 max-w-xs"
              >
                {filteredList.map((a) => (
                  <option key={a.employeeId} value={a.employeeId}>
                    {a.employeeName} ({a.division} - {a.employeeNik})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <button
          onClick={() => onOpenReportCard(currentAssessment)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center space-x-2 transition shadow-sm cursor-pointer"
        >
          <Printer className="w-4 h-4 text-blue-400" />
          <span>Buka & Cetak Slip Resmi</span>
        </button>
      </div>

      {/* Main Score Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left 2 Cols: Employee Banner & Grade */}
        <div className="md:col-span-2 bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 text-white rounded-2xl p-6 shadow-xl flex flex-col justify-between border border-slate-800">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Transparansi Kinerja Karyawan</span>
              </div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-400/30">
                <CalendarCheck className="w-3.5 h-3.5" />
                <span>
                  {currentAssessment.dayName || 'Kamis'}, {currentAssessment.day || 24} {currentAssessment.monthName || 'September'} {currentAssessment.year || 2026}
                </span>
              </div>
            </div>

            <h2 className="text-2xl font-black tracking-tight">{currentAssessment.employeeName}</h2>
            <p className="text-slate-300 text-xs flex flex-wrap gap-x-4 gap-y-1">
              <span>NIK: <strong className="font-mono text-white">{currentAssessment.employeeNik}</strong></span>
              <span>Divisi: <strong className="text-blue-300">{currentAssessment.division}</strong></span>
              <span>Posisi: <strong className="text-white">{currentAssessment.position || '-'}</strong></span>
              <span>Tanggal Evaluasi: <strong className="text-amber-300">{currentAssessment.dayName || 'Kamis'}, {currentAssessment.day || 24} {currentAssessment.monthName || 'September'} {currentAssessment.year || 2026} ({currentAssessment.period})</strong></span>
            </p>
          </div>

          <div className="pt-6 border-t border-slate-800 mt-6 grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-slate-400">Skor Sikap (A) &bull; 50%</div>
              <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
                {currentAssessment.totalSkorA.toFixed(2)}
                <span className="text-xs font-normal text-slate-400 ml-1">/ 10.00</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Skor KPI Teknis (B) &bull; 50%</div>
              <div className="text-2xl font-black text-blue-400 font-mono mt-0.5">
                {currentAssessment.totalSkorB.toFixed(2)}
                <span className="text-xs font-normal text-slate-400 ml-1">/ 10.00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Big Final Score & Status */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border-2 border-emerald-300 dark:border-emerald-700/80 shadow-sm flex flex-col justify-center items-center text-center">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Nilai Akhir Periode
          </div>
          <div className="text-5xl font-black my-2 font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
            {currentAssessment.finalScore.toFixed(2)}
          </div>
          <div className="px-4 py-1.5 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-sm">
            {statusLabel}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-4 leading-snug">
            {recommendation}
          </p>
        </div>
      </div>

      {/* Tardiness Alert if applicable */}
      {currentAssessment.seringTelat === 'Ya' ? (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border-l-4 border-amber-500 rounded-r-xl text-xs flex items-start space-x-3 text-amber-900 dark:text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Pemberitahuan Penalti Kedisiplinan Absensi:</div>
            <p className="mt-0.5 text-amber-800 dark:text-amber-300">
              Anda terdata <strong>&apos;Sering Telat = Ya&apos;</strong> pada bulan ini. Sesuai aturan transparansi perusahaan,
              bobot maksimal indikator <em>Kerajinan & Absensi</em> dipotong dari 15% menjadi 10%.
              Tingkatkan kedisiplinan jam hadir Anda di bulan depan untuk meraih skor maksimal 10.00!
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-500 rounded-r-xl text-xs flex items-start space-x-3 text-emerald-900 dark:text-emerald-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Kedisiplinan Waktu Prima:</div>
            <p className="mt-0.5 text-emerald-800 dark:text-emerald-300">
              Catatan absensi Anda bebas dari keterlambatan berulang (Sering Telat = Tidak). Anda berhak atas bobot penuh 15% pada komponen kehadiran.
            </p>
          </div>
        </div>
      )}

      {/* Two Columns: Breakdown Sikap (A) & KPI Teknis (B) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sikap (A) Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center text-[10px]">A</span>
              <span>Rincian Sikap & Etos Kerja (50%)</span>
            </h3>
            <span className="text-xs font-mono font-bold text-blue-700 dark:text-blue-400">
              {currentAssessment.totalSkorA.toFixed(2)} / 10.00
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {breakdown.partsA.map((p, idx) => (
              <div key={idx} className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/60 last:border-none">
                <div>
                  <div className="font-medium text-slate-800 dark:text-slate-200">{p.label}</div>
                  <div className="text-[10px] text-slate-400">{p.note}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-slate-900 dark:text-white">{p.raw} / 10</div>
                  <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">+{p.contribution.toFixed(2)} poin</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* KPI Teknis (B) Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">B</span>
              <span>Target KPI Teknis Divisi (50%)</span>
            </h3>
            <span className="text-xs font-mono font-bold text-blue-700 dark:text-blue-400">
              {currentAssessment.totalSkorB.toFixed(2)} / 10.00
            </span>
          </div>

          <div className="space-y-4 text-xs pt-1">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/70">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400">KPI 1 &bull; Bobot {(currentAssessment.kpi1Weight * 100).toFixed(0)}%</span>
                  <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{currentAssessment.kpi1Name}</div>
                </div>
                <div className="text-right font-mono font-black text-lg text-slate-900 dark:text-white">
                  {currentAssessment.kpi1Score}
                  <span className="text-xs text-slate-400 font-normal">/10</span>
                </div>
              </div>
              {currentAssessment.kpi1Note && (
                <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-2 italic bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                  &ldquo;{currentAssessment.kpi1Note}&rdquo;
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/70">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400">KPI 2 &bull; Bobot {(currentAssessment.kpi2Weight * 100).toFixed(0)}%</span>
                  <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{currentAssessment.kpi2Name}</div>
                </div>
                <div className="text-right font-mono font-black text-lg text-slate-900 dark:text-white">
                  {currentAssessment.kpi2Score}
                  <span className="text-xs text-slate-400 font-normal">/10</span>
                </div>
              </div>
              {currentAssessment.kpi2Note && (
                <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-2 italic bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                  &ldquo;{currentAssessment.kpi2Note}&rdquo;
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Scope Historical Performance Report: Harian, Mingguan, Bulanan, Tahunan */}
      {employeeHistory.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Pilihan Laporan Evaluasi & Riwayat Kinerja</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Pilih format laporan untuk melihat rekam jejak harian, rekap mingguan, akumulasi bulanan, atau tahunan
              </p>
            </div>

            {/* Scope Tabs Selector */}
            <div className="flex flex-wrap items-center bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200 dark:border-slate-700/80 gap-1 text-xs">
              <button
                type="button"
                onClick={() => setReportScope('harian')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                  reportScope === 'harian'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                }`}
              >
                <span>📅 Harian</span>
                <span className="text-[10px] opacity-80">({employeeHistory.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setReportScope('mingguan')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                  reportScope === 'mingguan'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                }`}
              >
                <span>📊 Mingguan</span>
                <span className="text-[10px] opacity-80">({weeklySummaries.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setReportScope('bulanan')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                  reportScope === 'bulanan'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                }`}
              >
                <span>📈 Akumulasi Bulanan</span>
                <span className="text-[10px] opacity-80">({monthlySummaries.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setReportScope('tahunan')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                  reportScope === 'tahunan'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                }`}
              >
                <span>🏆 Tahunan</span>
                <span className="text-[10px] opacity-80">({annualSummaries.length})</span>
              </button>
            </div>
          </div>

          {/* VIEW 1: LAPORAN HARIAN */}
          {reportScope === 'harian' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Menampilkan log evaluasi per hari (skor sikap harian, capaian KPI harian & kehadiran).</span>
                {employeeHistory.length > 7 && (
                  <button
                    type="button"
                    onClick={() => setShowAllDaily(!showAllDaily)}
                    className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                  >
                    {showAllDaily ? 'Tampilkan Ringkas (7 Hari Terakhir)' : `Tampilkan Semua (${employeeHistory.length} Hari)`}
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-[#1F4E78] text-white font-bold border-b border-slate-300">
                      <th className="py-2.5 px-3 border border-slate-300">Hari & Tanggal Penilaian</th>
                      <th className="py-2.5 px-3 border border-slate-300 text-center">Status Presensi</th>
                      <th className="py-2.5 px-3 border border-slate-300 text-center">Skor Sikap (A)</th>
                      <th className="py-2.5 px-3 border border-slate-300 text-center">Skor KPI (B)</th>
                      <th className="py-2.5 px-3 border border-slate-300 text-center bg-[#16365C] text-emerald-300">
                        Nilai Akhir
                      </th>
                      <th className="py-2.5 px-3 border border-slate-300 text-center">Grade & Status</th>
                      <th className="py-2.5 px-3 border border-slate-300 text-center w-24">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                    {displayedDailyRecords.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition border-b border-slate-200 dark:border-slate-800">
                        <td className="py-2.5 px-3 font-sans border border-slate-200 dark:border-slate-800">
                          <div className="flex items-center space-x-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 text-[10px] font-bold border border-blue-200 dark:border-blue-900">
                              {h.dayName || 'Kamis'}
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {h.day || 24} {h.monthName || 'September'} {h.year || 2026}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-sans border border-slate-200 dark:border-slate-800">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                              h.dailyAttendanceStatus === 'Hadir Tepat Waktu'
                                ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                                : h.dailyAttendanceStatus === 'Terlambat'
                                ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                                : 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300'
                            }`}
                          >
                            {h.dailyAttendanceStatus || 'Hadir Tepat Waktu'} {h.dailyAttendanceLateMinutes ? `(${h.dailyAttendanceLateMinutes}m)` : ''}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center border border-slate-200 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                          {h.totalSkorA.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center border border-slate-200 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                          {h.totalSkorB.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-900 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-slate-200 dark:border-slate-800 text-sm">
                          {h.finalScore.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center font-sans border border-slate-200 dark:border-slate-800">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                            {h.grade} &bull; {h.statusLabel}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-sans border border-slate-200 dark:border-slate-800">
                          <button
                            onClick={() => onOpenReportCard(h)}
                            className="px-2.5 py-1 bg-slate-900 dark:bg-slate-800 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition inline-flex items-center space-x-1 cursor-pointer"
                            title="Buka Slip Rapor Harian"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Buka</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 2: LAPORAN MINGGUAN */}
          {reportScope === 'mingguan' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500">
                <span>Rekapitulasi performa per minggu (rata-rata nilai sikap, capaian KPI, dan rasio kehadiran tepat waktu).</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-[#1F4E78] text-white font-bold border-b border-slate-300">
                      <th className="py-2.5 px-3 border border-slate-300">Minggu Evaluasi</th>
                      <th className="py-2.5 px-3 border border-slate-300 text-center">Bulan & Tahun</th>
                      <th className="py-2.5 px-3 border border-slate-300 text-center">Kehadiran (Hadir / Telat)</th>
                      <th className="py-2.5 px-3 border border-slate-300 text-center">Rerata Skor A</th>
                      <th className="py-2.5 px-3 border border-slate-300 text-center">Rerata Skor B</th>
                      <th className="py-2.5 px-3 border border-slate-300 text-center bg-[#16365C] text-emerald-300">
                        Nilai Akhir
                      </th>
                      <th className="py-2.5 px-3 border border-slate-300 text-center">Grade & Status</th>
                      <th className="py-2.5 px-3 border border-slate-300 text-center w-24">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                    {weeklySummaries.map((w, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition border-b border-slate-200 dark:border-slate-800">
                        <td className="py-2.5 px-3 font-sans border border-slate-200 dark:border-slate-800">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {w.weekLabel}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {w.totalDays} hari evaluasi tercatat
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-sans border border-slate-200 dark:border-slate-800">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold">
                            {w.monthName} {w.year}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-sans border border-slate-200 dark:border-slate-800">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold">
                            <span className="text-emerald-700 dark:text-emerald-400 font-bold">{w.presentOnTimeCount} Tepat</span>
                            <span>&bull;</span>
                            <span className={w.lateCount > 0 ? 'text-amber-700 dark:text-amber-400 font-bold' : 'text-slate-400'}>
                              {w.lateCount} Telat
                            </span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center border border-slate-200 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                          {w.avgSkorA.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center border border-slate-200 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                          {w.avgSkorB.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-900 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-slate-200 dark:border-slate-800 text-sm">
                          {w.finalScore.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center font-sans border border-slate-200 dark:border-slate-800">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                            {w.grade} &bull; {w.statusLabel}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-sans border border-slate-200 dark:border-slate-800">
                          <button
                            onClick={() => {
                              if (w.dailyRecords[0]) {
                                onOpenReportCard({
                                  ...w.dailyRecords[0],
                                  totalSkorA: w.avgSkorA,
                                  totalSkorB: w.avgSkorB,
                                  finalScore: w.finalScore,
                                  grade: w.grade,
                                  statusLabel: w.statusLabel,
                                  notes: w.summaryNote,
                                });
                              }
                            }}
                            className="px-2.5 py-1 bg-slate-900 dark:bg-slate-800 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition inline-flex items-center space-x-1 cursor-pointer"
                            title="Buka Rapor Mingguan"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Buka</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 3: AKUMULASI BULANAN */}
          {reportScope === 'bulanan' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500">
                <span>Rekapitulasi akumulasi bulanan resmi untuk evaluasi bonus, kenaikan berkala, dan evaluasi HRD.</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-[#1F4E78] text-white font-bold border-b border-slate-300">
                      <th className="py-2.5 px-3 border border-slate-300">Periode Bulan & Tahun</th>
                      <th className="py-2.5 px-3 border border-slate-300 text-center">Total Hari Kerja</th>
                      <th className="py-2.5 px-3 border border-slate-300 text-center">Presensi (Tepat / Telat)</th>
                      <th className="py-2.5 px-3 border border-slate-300 text-center">Akumulasi Skor A</th>
                      <th className="py-2.5 px-3 border border-slate-300 text-center">Akumulasi Skor B</th>
                      <th className="py-2.5 px-3 border border-slate-300 text-center bg-[#16365C] text-emerald-300">
                        Nilai Akhir Bulan
                      </th>
                      <th className="py-2.5 px-3 border border-slate-300 text-center">Grade & Status</th>
                      <th className="py-2.5 px-3 border border-slate-300 text-center w-24">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                    {monthlySummaries.map((m) => (
                      <tr key={m.period} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition border-b border-slate-200 dark:border-slate-800">
                        <td className="py-2.5 px-3 font-sans border border-slate-200 dark:border-slate-800">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {m.monthName} {m.year}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Periode: {m.period}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-sans border border-slate-200 dark:border-slate-800 font-semibold">
                          {m.totalWorkingDays} Hari Kerja
                        </td>
                        <td className="py-2.5 px-3 text-center font-sans border border-slate-200 dark:border-slate-800">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold">
                            <span className="text-emerald-700 dark:text-emerald-400 font-bold">{m.presentCount} Hadir</span>
                            <span>&bull;</span>
                            <span className={m.lateCount > 0 ? 'text-amber-700 dark:text-amber-400 font-bold' : 'text-slate-400'}>
                              {m.lateCount} Telat
                            </span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center border border-slate-200 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                          {m.avgSkorA.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center border border-slate-200 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                          {m.avgSkorB.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-900 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-slate-200 dark:border-slate-800 text-sm">
                          {m.finalScore.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center font-sans border border-slate-200 dark:border-slate-800">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                            {m.grade} &bull; {m.statusLabel}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-sans border border-slate-200 dark:border-slate-800">
                          <button
                            onClick={() => {
                              if (m.allDailyRecords[0]) {
                                onOpenReportCard({
                                  ...m.allDailyRecords[0],
                                  period: m.period,
                                  totalSkorA: m.avgSkorA,
                                  totalSkorB: m.avgSkorB,
                                  finalScore: m.finalScore,
                                  grade: m.grade,
                                  statusLabel: m.statusLabel,
                                  notes: m.recommendation,
                                });
                              }
                            }}
                            className="px-2.5 py-1 bg-slate-900 dark:bg-slate-800 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition inline-flex items-center space-x-1 cursor-pointer"
                            title="Buka Rapor Bulanan"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Buka</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 4: LAPORAN TAHUNAN */}
          {reportScope === 'tahunan' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500">
                <span>Akumulasi rekam jejak performa tahunan (Annual Performance Review) untuk jenjang karir dan reward.</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-[#1F4E78] text-white font-bold border-b border-slate-300">
                      <th className="py-2.5 px-3 border border-slate-300">Tahun Evaluasi</th>
                      <th className="py-2.5 px-3 border border-slate-300 text-center">Bulan Terakumulasi</th>
                      <th className="py-2.5 px-3 border border-slate-300 text-center">Total Hari Kerja</th>
                      <th className="py-2.5 px-3 border border-slate-300 text-center">Total Terlambat</th>
                      <th className="py-2.5 px-3 border border-slate-300 text-center">Rerata Skor A</th>
                      <th className="py-2.5 px-3 border border-slate-300 text-center">Rerata Skor B</th>
                      <th className="py-2.5 px-3 border border-slate-300 text-center bg-[#16365C] text-emerald-300">
                        Nilai Akhir Tahunan
                      </th>
                      <th className="py-2.5 px-3 border border-slate-300 text-center">Grade & Status</th>
                      <th className="py-2.5 px-3 border border-slate-300 text-center w-24">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                    {annualSummaries.map((yr) => (
                      <tr key={yr.year} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition border-b border-slate-200 dark:border-slate-800">
                        <td className="py-2.5 px-3 font-sans border border-slate-200 dark:border-slate-800">
                          <div className="font-bold text-base text-slate-900 dark:text-white">
                            {yr.yearLabel}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-sans border border-slate-200 dark:border-slate-800 font-semibold">
                          {yr.monthsEvaluatedCount} Bulan
                        </td>
                        <td className="py-2.5 px-3 text-center font-sans border border-slate-200 dark:border-slate-800">
                          {yr.totalWorkingDays} Hari
                        </td>
                        <td className="py-2.5 px-3 text-center font-sans border border-slate-200 dark:border-slate-800">
                          <span className={yr.totalLateCount > 0 ? 'text-amber-700 dark:text-amber-400 font-bold' : 'text-slate-400'}>
                            {yr.totalLateCount} Kali
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center border border-slate-200 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                          {yr.avgSkorA.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center border border-slate-200 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                          {yr.avgSkorB.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-900 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-slate-200 dark:border-slate-800 text-sm">
                          {yr.finalScore.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center font-sans border border-slate-200 dark:border-slate-800">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                            {yr.grade} &bull; {yr.statusLabel}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-sans border border-slate-200 dark:border-slate-800">
                          <button
                            onClick={() => {
                              if (yr.monthlySummaries[0]?.allDailyRecords[0]) {
                                onOpenReportCard({
                                  ...yr.monthlySummaries[0].allDailyRecords[0],
                                  totalSkorA: yr.avgSkorA,
                                  totalSkorB: yr.avgSkorB,
                                  finalScore: yr.finalScore,
                                  grade: yr.grade,
                                  statusLabel: yr.statusLabel,
                                  notes: yr.summaryNote,
                                });
                              }
                            }}
                            className="px-2.5 py-1 bg-slate-900 dark:bg-slate-800 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition inline-flex items-center space-x-1 cursor-pointer"
                            title="Buka Rapor Tahunan"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Buka</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
