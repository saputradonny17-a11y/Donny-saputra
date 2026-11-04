import React, { useState, useMemo } from 'react';
import { X, Printer, Award, AlertCircle, CheckCircle2, User, Building, Calendar, FileText, Check, Mail, Clock, BarChart2 } from 'lucide-react';
import { MasterAttitudeRecord, MonthlyAssessment } from '../types';
import { determineGradeAndStatus, getDetailedFormulaBreakdown } from '../utils/calculations';
import {
  aggregateEmployeeWeekly,
  aggregateEmployeeMonthly,
  aggregateEmployeeAnnual,
  ReportScopeType
} from '../utils/reportAggregation';

interface Props {
  assessment: MonthlyAssessment | null;
  isOpen: boolean;
  onClose: () => void;
  masterAttitudeList?: MasterAttitudeRecord[];
  onOpenSendEmail?: (assessment: MonthlyAssessment) => void;
  historicalAssessments?: MonthlyAssessment[];
}

export const EmployeeReportCardModal: React.FC<Props> = ({
  assessment,
  isOpen,
  onClose,
  masterAttitudeList,
  onOpenSendEmail,
  historicalAssessments,
}) => {
  const [reportScope, setReportScope] = useState<ReportScopeType>('harian');

  const weeklySummaries = useMemo(() => {
    return aggregateEmployeeWeekly(historicalAssessments || [], assessment?.period);
  }, [historicalAssessments, assessment?.period]);

  const monthlySummaries = useMemo(() => {
    return aggregateEmployeeMonthly(historicalAssessments || []);
  }, [historicalAssessments]);

  const annualSummaries = useMemo(() => {
    return aggregateEmployeeAnnual(historicalAssessments || []);
  }, [historicalAssessments]);

  // When viewing in Harian mode, show only the latest 5 days so the slip is not cluttered with dozens of rows
  const recentDailyRecords = useMemo(() => {
    if (!historicalAssessments) return [];
    return historicalAssessments.slice(0, 5);
  }, [historicalAssessments]);

  if (!isOpen || !assessment) return null;

  const { statusLabel, recommendation } = determineGradeAndStatus(assessment.finalScore);

  const breakdown = getDetailedFormulaBreakdown({
    kerajinanAbsensi: assessment.kerajinanAbsensi,
    izinKeluar: assessment.izinKeluar,
    hindariKesalahanFatal: assessment.hindariKesalahanFatal,
    integritasKriminal: assessment.integritasKriminal,
    sopanSantun: assessment.sopanSantun,
    kerapihan: assessment.kerapihan,
    taatAturan: assessment.taatAturan,
    fokusKeberadaan: assessment.fokusKeberadaan,
    seringTelat: assessment.seringTelat,
    kpi1Name: assessment.kpi1Name,
    kpi1Weight: assessment.kpi1Weight,
    kpi1Score: assessment.kpi1Score,
    kpi2Name: assessment.kpi2Name,
    kpi2Weight: assessment.kpi2Weight,
    kpi2Score: assessment.kpi2Score,
    scoreA: assessment.totalSkorA,
    scoreB: assessment.totalSkorB,
    finalScore: assessment.finalScore,
    customAttitudeScores: assessment.customAttitudeScores,
  }, masterAttitudeList);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden print:m-0 print:border-none print:shadow-none print:max-h-full print:bg-white text-slate-800 dark:text-slate-100">
        {/* Top bar (Hidden when printing) */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white px-6 py-4 flex items-center justify-between print:hidden border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-lg text-white">Transparansi Rapor Penilaian Kinerja Karyawan</h3>
          </div>
          <div className="flex items-center space-x-2">
            {onOpenSendEmail && (
              <button
                onClick={() => onOpenSendEmail(assessment)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs cursor-pointer ${
                  assessment.publishedStatus === 'published'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
                title="Kirim notifikasi hasil penilaian resmi ke alamat email karyawan"
              >
                <Mail className="w-4 h-4" />
                <span>
                  {assessment.publishedStatus === 'published' ? 'Kirim Pembaruan Email' : 'Kirim Email Notifikasi'}
                </span>
              </button>
            )}
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-semibold transition cursor-pointer text-white"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-800 dark:text-slate-100 print:text-black print:p-4">
          {/* Header Organization */}
          <div className="border-b-2 border-slate-900 dark:border-slate-700 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="text-xs uppercase tracking-widest font-bold text-blue-700 dark:text-blue-400 mb-1">
                Laporan Hasil Evaluasi Kerja Bulanan Terpadu
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                SLIP PENILAIAN PRESTASI & KPI
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Sistem Penilaian Transparan Berdasarkan Kinerja, Absensi, dan Pencapaian Target
              </p>
            </div>
            <div className="text-right sm:border-l sm:pl-6 border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400">Periode Evaluasi</div>
              <div className="text-base font-bold text-slate-900 dark:text-white font-mono">
                {assessment.monthName || 'September'} {assessment.year || 2026}
              </div>
              <div className="text-[11px] font-semibold text-blue-700 dark:text-blue-400">
                {assessment.dayName || 'Kamis'}, {assessment.day || 24} {assessment.monthName || 'Sep'} {assessment.year || 2026}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Dicetak: {new Date().toLocaleDateString('id-ID')}</div>
            </div>
          </div>

          {/* Employee Info Card & Final Grade Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700/80 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Nama Karyawan</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">{assessment.employeeName}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Nomor Induk Karyawan (NIK)</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{assessment.employeeNik}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Divisi</span>
                <span className="font-semibold text-blue-700 dark:text-blue-400">{assessment.division}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Hari & Tanggal Penilaian</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {assessment.dayName || 'Kamis'}, {assessment.day || 24} {assessment.monthName || 'September'} {assessment.year || 2026}
                </span>
              </div>
            </div>

            {/* Score Highlight Box */}
            <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-700/80 rounded-xl p-4 flex flex-col justify-center items-center text-center">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Nilai Akhir (1-10)</span>
              <div className="text-4xl font-black text-emerald-900 dark:text-emerald-200 my-1 font-mono tracking-tight">
                {assessment.finalScore.toFixed(2)}
              </div>
              <div className="px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-bold shadow-sm">
                {statusLabel}
              </div>
            </div>
          </div>

          {/* Email Notification & Publication Status Banner */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs print:hidden">
            <div className="flex items-center space-x-2.5">
              <div className={`p-2 rounded-lg ${assessment.publishedStatus === 'published' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'}`}>
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  {assessment.publishedStatus === 'published'
                    ? 'Hasil Penilaian Telah Dipublikasikan ke Email'
                    : 'Status: Draft (Hasil Penilaian Belum Dikirim ke Email)'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {assessment.lastNotifiedAt
                    ? `Notifikasi terakhir terkirim pada ${new Date(assessment.lastNotifiedAt).toLocaleString('id-ID')} (${assessment.notificationRecipientEmail || 'Email Karyawan'})`
                    : 'Karyawan belum menerima notifikasi email resmi untuk periode evaluasi ini.'}
                </span>
              </div>
            </div>

            {onOpenSendEmail && (
              <button
                type="button"
                onClick={() => onOpenSendEmail(assessment)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-xs shrink-0 cursor-pointer ${
                  assessment.publishedStatus === 'published'
                    ? 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                    : 'bg-blue-600 text-white hover:bg-blue-500'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{assessment.publishedStatus === 'published' ? 'Kirim Ulang / Pembaruan' : 'Kirim Email Sekarang'}</span>
              </button>
            )}
          </div>

          {/* Transparent Score Formula Breakdown */}
          <div className="bg-slate-900 dark:bg-slate-950 border border-slate-800 text-white p-4 rounded-xl text-xs flex flex-col sm:flex-row items-center justify-between gap-3 font-mono">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-amber-400 shrink-0" />
              <span>
                NILAI AKHIR = (Skor Sikap A × 50%) + (Skor KPI B × 50%)
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-300">
                ({assessment.totalSkorA.toFixed(2)} × 0.5) + ({assessment.totalSkorB.toFixed(2)} × 0.5) ={' '}
              </span>
              <span className="text-emerald-400 font-bold text-sm">
                {assessment.finalScore.toFixed(2)}
              </span>
            </div>
          </div>

          {/* SECTION A: PENILAIAN SIKAP */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
              <div className="flex items-center space-x-2 font-bold text-slate-900 dark:text-white">
                <span className="w-5 h-5 rounded-full bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center text-[10px]">A</span>
                <span>RINCIAN PENILAIAN SIKAP & KEDISIPLINAN (BOBOT 50%)</span>
              </div>
              <div className="font-semibold text-slate-700 dark:text-slate-300">
                Total Skor Sikap: <span className="text-blue-700 dark:text-blue-400 font-mono text-sm">{assessment.totalSkorA.toFixed(2)}</span> / 10.00
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-2 font-medium">Aspek Penilaian Sikap</th>
                    <th className="px-3 py-2 text-center font-medium">Nilai (1-10)</th>
                    <th className="px-3 py-2 text-center font-medium">Bobot Maksimal</th>
                    <th className="px-4 py-2 text-right font-medium">Kontribusi Skor</th>
                    <th className="px-4 py-2 font-medium">Keterangan / Aturan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {breakdown.partsA.map((part, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-200">{part.label}</td>
                      <td className="px-3 py-2 text-center font-mono font-semibold text-slate-900 dark:text-white">{part.raw}</td>
                      <td className="px-3 py-2 text-center text-slate-600 dark:text-slate-400 font-mono">{(part.weight * 100).toFixed(0)}%</td>
                      <td className="px-4 py-2 text-right font-mono font-bold text-slate-900 dark:text-white">{part.contribution.toFixed(2)}</td>
                      <td className="px-4 py-2 text-slate-500 dark:text-slate-400 text-[11px]">{part.note}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 dark:bg-slate-800/60 font-semibold border-t border-slate-200 dark:border-slate-700">
                    <td className="px-4 py-2.5 text-slate-900 dark:text-white" colSpan={3}>
                      Status Sering Terlambat: <span className={assessment.seringTelat === 'Ya' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>{assessment.seringTelat}</span>
                      {assessment.seringTelat === 'Ya' && (
                        <span className="text-xs text-amber-700 dark:text-amber-300 font-normal ml-2">(Terkena pinalti pengurangan bobot absensi)</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-blue-700 dark:text-blue-400 text-sm">
                      {assessment.totalSkorA.toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-[11px]">Kontribusi ke Nilai Akhir (50%): {breakdown.contributionA.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION B: PENILAIAN KPI */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
              <div className="flex items-center space-x-2 font-bold text-slate-900 dark:text-white">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">B</span>
                <span>RINCIAN PENILAIAN KPI TEKNIS DIVISI (BOBOT 50%)</span>
              </div>
              <div className="font-semibold text-slate-700 dark:text-slate-300">
                Total Skor KPI: <span className="text-blue-700 dark:text-blue-400 font-mono text-sm">{assessment.totalSkorB.toFixed(2)}</span> / 10.00
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-2 font-medium">Indikator KPI Divisi ({assessment.division})</th>
                    <th className="px-3 py-2 text-center font-medium">Bobot</th>
                    <th className="px-3 py-2 text-center font-medium">Skor (1-10)</th>
                    <th className="px-4 py-2 text-right font-medium">Kontribusi Skor</th>
                    <th className="px-4 py-2 font-medium">Catatan Pencapaian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {breakdown.partsB.map((part, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">{part.label}</td>
                      <td className="px-3 py-2.5 text-center font-mono text-slate-600 dark:text-slate-400">{(part.weight * 100).toFixed(0)}%</td>
                      <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-900 dark:text-white">{part.raw}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">{part.contribution.toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400 text-[11px]">
                        {idx === 0 ? assessment.kpi1Note || '-' : assessment.kpi2Note || '-'}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 dark:bg-slate-800/60 font-semibold border-t border-slate-200 dark:border-slate-700">
                    <td className="px-4 py-2.5 text-slate-900 dark:text-white" colSpan={3}>
                      Total Terbobot Skor KPI Teknis (B)
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-blue-700 dark:text-blue-400 text-sm">
                      {assessment.totalSkorB.toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-[11px]">Kontribusi ke Nilai Akhir (50%): {breakdown.contributionB.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Rekomendasi HR & Catatan Evaluasi */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 text-xs space-y-2">
            <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Rekomendasi Tindak Lanjut & Catatan Perusahaan:</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {recommendation}
            </p>
            {assessment.notes && (
              <p className="text-slate-600 dark:text-slate-300 italic bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-700">
                &ldquo;{assessment.notes}&rdquo;
              </p>
            )}
          </div>

          {/* Multi-Scope Report Format Selector (Harian, Mingguan, Bulanan, Tahunan) */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 print:hidden text-xs">
            <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Format Laporan Riwayat:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setReportScope('harian')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  reportScope === 'harian'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                📅 Harian (Ringkas)
              </button>
              <button
                type="button"
                onClick={() => setReportScope('mingguan')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  reportScope === 'mingguan'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                📊 Mingguan
              </button>
              <button
                type="button"
                onClick={() => setReportScope('bulanan')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  reportScope === 'bulanan'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                📈 Akumulasi Bulanan
              </button>
              <button
                type="button"
                onClick={() => setReportScope('tahunan')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  reportScope === 'tahunan'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                🏆 Tahunan
              </button>
            </div>
          </div>

          {/* Rekapitulasi Riwayat Penilaian Karyawan Berdasarkan Pilihan Format */}
          {historicalAssessments && historicalAssessments.length > 0 && (
            <div className="border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/40 space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white text-xs flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>
                    {reportScope === 'harian' && 'Tabel Riwayat Harian (5 Hari Terakhir Terpilih)'}
                    {reportScope === 'mingguan' && 'Tabel Rekapitulasi Mingguan (Bulan Ini)'}
                    {reportScope === 'bulanan' && 'Tabel Akumulasi Bulanan (Multi-Bulan)'}
                    {reportScope === 'tahunan' && 'Tabel Akumulasi Tahunan'}
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Format: {reportScope.toUpperCase()}
                </span>
              </div>

              {/* Scope: Harian */}
              {reportScope === 'harian' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-200 dark:bg-slate-750 text-slate-700 dark:text-slate-200 text-[10px] font-bold">
                        <th className="py-1.5 px-2.5">Hari & Tanggal</th>
                        <th className="py-1.5 px-2 text-center">Presensi</th>
                        <th className="py-1.5 px-2 text-center">Skor Sikap (A)</th>
                        <th className="py-1.5 px-2 text-center">Skor KPI (B)</th>
                        <th className="py-1.5 px-2 text-center bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">Nilai Akhir</th>
                        <th className="py-1.5 px-2 text-center">Grade & Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 font-mono text-[11px]">
                      {recentDailyRecords.map((h) => (
                        <tr key={h.id} className="hover:bg-white dark:hover:bg-slate-800/80">
                          <td className="py-1.5 px-2.5 font-sans">
                            <span className="font-semibold">{h.dayName || 'Kamis'}</span>, {h.day || 24} {h.monthName || 'Sep'} {h.year || 2026}
                          </td>
                          <td className="py-1.5 px-2 text-center font-sans text-[10px]">
                            <span className={h.dailyAttendanceStatus === 'Terlambat' ? 'text-amber-600 font-bold' : 'text-emerald-600 font-semibold'}>
                              {h.dailyAttendanceStatus || 'Hadir Tepat'}
                            </span>
                          </td>
                          <td className="py-1.5 px-2 text-center">{h.totalSkorA.toFixed(2)}</td>
                          <td className="py-1.5 px-2 text-center">{h.totalSkorB.toFixed(2)}</td>
                          <td className="py-1.5 px-2 text-center font-bold text-emerald-700 dark:text-emerald-300">
                            {h.finalScore.toFixed(2)}
                          </td>
                          <td className="py-1.5 px-2 text-center font-sans text-[10px]">
                            <span className="px-1.5 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                              {h.grade} - {h.statusLabel}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Scope: Mingguan */}
              {reportScope === 'mingguan' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-200 dark:bg-slate-750 text-slate-700 dark:text-slate-200 text-[10px] font-bold">
                        <th className="py-1.5 px-2.5">Minggu Evaluasi</th>
                        <th className="py-1.5 px-2 text-center">Kehadiran (Tepat/Telat)</th>
                        <th className="py-1.5 px-2 text-center">Rerata Sikap (A)</th>
                        <th className="py-1.5 px-2 text-center">Rerata KPI (B)</th>
                        <th className="py-1.5 px-2 text-center bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">Nilai Akhir</th>
                        <th className="py-1.5 px-2 text-center">Grade & Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 font-mono text-[11px]">
                      {weeklySummaries.map((w, idx) => (
                        <tr key={idx} className="hover:bg-white dark:hover:bg-slate-800/80">
                          <td className="py-1.5 px-2.5 font-sans font-semibold">
                            {w.weekLabel}
                          </td>
                          <td className="py-1.5 px-2 text-center font-sans text-[10px]">
                            <span className="text-emerald-700 dark:text-emerald-400 font-bold">{w.presentOnTimeCount} Tepat</span> / <span className={w.lateCount > 0 ? 'text-amber-600 font-bold' : 'text-slate-400'}>{w.lateCount} Telat</span>
                          </td>
                          <td className="py-1.5 px-2 text-center">{w.avgSkorA.toFixed(2)}</td>
                          <td className="py-1.5 px-2 text-center">{w.avgSkorB.toFixed(2)}</td>
                          <td className="py-1.5 px-2 text-center font-bold text-emerald-700 dark:text-emerald-300">
                            {w.finalScore.toFixed(2)}
                          </td>
                          <td className="py-1.5 px-2 text-center font-sans text-[10px]">
                            <span className="px-1.5 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                              {w.grade} - {w.statusLabel}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Scope: Bulanan */}
              {reportScope === 'bulanan' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-200 dark:bg-slate-750 text-slate-700 dark:text-slate-200 text-[10px] font-bold">
                        <th className="py-1.5 px-2.5">Bulan & Tahun</th>
                        <th className="py-1.5 px-2 text-center">Hari Kerja</th>
                        <th className="py-1.5 px-2 text-center">Akumulasi Sikap (A)</th>
                        <th className="py-1.5 px-2 text-center">Akumulasi KPI (B)</th>
                        <th className="py-1.5 px-2 text-center bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">Nilai Akhir</th>
                        <th className="py-1.5 px-2 text-center">Grade & Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 font-mono text-[11px]">
                      {monthlySummaries.map((m) => (
                        <tr key={m.period} className="hover:bg-white dark:hover:bg-slate-800/80">
                          <td className="py-1.5 px-2.5 font-sans font-semibold">
                            {m.monthName} {m.year}
                          </td>
                          <td className="py-1.5 px-2 text-center font-sans text-[10px]">
                            {m.totalWorkingDays} Hari ({m.lateCount}x telat)
                          </td>
                          <td className="py-1.5 px-2 text-center">{m.avgSkorA.toFixed(2)}</td>
                          <td className="py-1.5 px-2 text-center">{m.avgSkorB.toFixed(2)}</td>
                          <td className="py-1.5 px-2 text-center font-bold text-emerald-700 dark:text-emerald-300">
                            {m.finalScore.toFixed(2)}
                          </td>
                          <td className="py-1.5 px-2 text-center font-sans text-[10px]">
                            <span className="px-1.5 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                              {m.grade} - {m.statusLabel}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Scope: Tahunan */}
              {reportScope === 'tahunan' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-200 dark:bg-slate-750 text-slate-700 dark:text-slate-200 text-[10px] font-bold">
                        <th className="py-1.5 px-2.5">Tahun</th>
                        <th className="py-1.5 px-2 text-center">Bulan Evaluasi</th>
                        <th className="py-1.5 px-2 text-center">Total Keterlambatan</th>
                        <th className="py-1.5 px-2 text-center">Rerata Sikap (A)</th>
                        <th className="py-1.5 px-2 text-center">Rerata KPI (B)</th>
                        <th className="py-1.5 px-2 text-center bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">Nilai Akhir</th>
                        <th className="py-1.5 px-2 text-center">Grade & Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 font-mono text-[11px]">
                      {annualSummaries.map((yr) => (
                        <tr key={yr.year} className="hover:bg-white dark:hover:bg-slate-800/80">
                          <td className="py-1.5 px-2.5 font-sans font-bold">
                            {yr.yearLabel}
                          </td>
                          <td className="py-1.5 px-2 text-center font-sans text-[10px]">
                            {yr.monthsEvaluatedCount} Bulan ({yr.totalWorkingDays} hari)
                          </td>
                          <td className="py-1.5 px-2 text-center font-sans text-[10px]">
                            {yr.totalLateCount} Kali
                          </td>
                          <td className="py-1.5 px-2 text-center">{yr.avgSkorA.toFixed(2)}</td>
                          <td className="py-1.5 px-2 text-center">{yr.avgSkorB.toFixed(2)}</td>
                          <td className="py-1.5 px-2 text-center font-bold text-emerald-700 dark:text-emerald-300">
                            {yr.finalScore.toFixed(2)}
                          </td>
                          <td className="py-1.5 px-2 text-center font-sans text-[10px]">
                            <span className="px-1.5 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                              {yr.grade} - {yr.statusLabel}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Signature Sign-Off for Transparency */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-4 text-center text-xs">
            <div>
              <div className="text-slate-400 dark:text-slate-500 mb-12">Karyawan Bersangkutan</div>
              <div className="font-bold text-slate-900 dark:text-white border-t border-slate-300 dark:border-slate-600 pt-1 mx-2">
                ( {assessment.employeeName} )
              </div>
            </div>
            <div>
              <div className="text-slate-400 dark:text-slate-500 mb-12">Atasan Langsung / SPV</div>
              <div className="font-bold text-slate-900 dark:text-white border-t border-slate-300 dark:border-slate-600 pt-1 mx-2">
                ( Koordinator Divisi )
              </div>
            </div>
            <div>
              <div className="text-slate-400 dark:text-slate-500 mb-12">Disetujui HRD Manager</div>
              <div className="font-bold text-slate-900 dark:text-white border-t border-slate-300 dark:border-slate-600 pt-1 mx-2">
                ( HRD Department )
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="bg-slate-100 dark:bg-slate-800/80 px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end items-center space-x-2 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition cursor-pointer"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-500 transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Cetak PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
