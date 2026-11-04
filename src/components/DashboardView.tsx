import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Eye,
  TrendingUp,
  Award,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  ArrowUpDown,
  Sparkles,
  Calculator,
  UserCheck,
  ShieldAlert,
  Star,
  ChevronRight,
  X,
  Clock,
  Briefcase,
  Mail,
  Send,
  CheckCircle2,
  Clock as ClockIcon,
  CheckSquare,
  Calendar,
} from 'lucide-react';
import { Employee, MasterKPIRecord, MonthlyAssessment } from '../types';
import { HistoricalGrowthChart } from './HistoricalGrowthChart';
import { TopPerformersTrendChart } from './TopPerformersTrendChart';
import { HRQuickActionModal } from './HRQuickActionModal';
import { computeHistoricalMetrics } from '../utils/historicalAnalytics';
import { getPeriodDateFormatted } from '../utils/assessmentDatabase';
import { CalendarCheck } from 'lucide-react';

interface Props {
  assessments: MonthlyAssessment[];
  onSelectAssessment: (assessment: MonthlyAssessment) => void;
  onNavigateTab: (tab: 'dashboard' | 'sikap' | 'kpi' | 'master' | 'employees') => void;
  onQuickSimulateAll: () => void;
  currentPeriod: string;
  availablePeriods: string[];
  onPeriodChange: (period: string) => void;
  employees: Employee[];
  masterList: MasterKPIRecord[];
  onOpenSendEmail?: (assessment: MonthlyAssessment) => void;
  onOpenBulkEmail?: () => void;
  onOpenEmailLogs?: () => void;
  onOpenSelectiveEmail?: (selectedAssessments: MonthlyAssessment[]) => void;
  onOpenHistoryModal?: () => void;
}

export const DashboardView: React.FC<Props> = ({
  assessments,
  onSelectAssessment,
  onNavigateTab,
  onQuickSimulateAll,
  currentPeriod,
  availablePeriods,
  onPeriodChange,
  employees,
  masterList,
  onOpenSendEmail,
  onOpenBulkEmail,
  onOpenEmailLogs,
  onOpenSelectiveEmail,
  onOpenHistoryModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('ALL');
  const [selectedGrade, setSelectedGrade] = useState('ALL');
  const [quickStatusFilter, setQuickStatusFilter] = useState<'ALL' | 'teladan' | 'peningkatan'>('ALL');
  const [isHRActionModalOpen, setIsHRActionModalOpen] = useState(false);
  const [selectedAssessmentIds, setSelectedAssessmentIds] = useState<Set<string>>(new Set());
  const [hrModalTab, setHrModalTab] = useState<'teladan' | 'peningkatan'>('peningkatan');
  const [growthDivision, setGrowthDivision] = useState('ALL');
  const [sortBy, setSortBy] = useState<'scoreDesc' | 'scoreAsc' | 'name' | 'division'>('scoreDesc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Compute divisions
  const divisions = useMemo(() => {
    const list = Array.from(new Set(assessments.map((a) => a.division)));
    return list.sort();
  }, [assessments]);

  // Quick Statistics Metrics for HR Intervention & Recognition
  const teladanEmployees = useMemo(() => {
    return assessments.filter((a) => a.grade === 'A' || a.finalScore >= 8.5);
  }, [assessments]);

  const peningkatanEmployees = useMemo(() => {
    return assessments.filter((a) => ['C', 'D', 'E'].includes(a.grade) || a.finalScore < 7.0);
  }, [assessments]);

  const kritisEmployees = useMemo(() => {
    return peningkatanEmployees.filter((a) => a.finalScore < 5.0 || ['D', 'E'].includes(a.grade));
  }, [peningkatanEmployees]);

  const coachingEmployees = useMemo(() => {
    return peningkatanEmployees.filter((a) => a.finalScore >= 5.0 && a.finalScore < 7.0 && a.grade === 'C');
  }, [peningkatanEmployees]);

  const telatInPeningkatan = useMemo(() => {
    return peningkatanEmployees.filter((a) => a.seringTelat === 'Ya');
  }, [peningkatanEmployees]);

  const teladanPercent = assessments.length
    ? ((teladanEmployees.length / assessments.length) * 100).toFixed(1)
    : '0';

  const peningkatanPercent = assessments.length
    ? ((peningkatanEmployees.length / assessments.length) * 100).toFixed(1)
    : '0';

  const avgTeladanScore = teladanEmployees.length
    ? (teladanEmployees.reduce((sum, a) => sum + a.finalScore, 0) / teladanEmployees.length).toFixed(2)
    : '0.00';

  const avgPeningkatanScore = peningkatanEmployees.length
    ? (peningkatanEmployees.reduce((sum, a) => sum + a.finalScore, 0) / peningkatanEmployees.length).toFixed(2)
    : '0.00';

  // Compute historical multi-month metrics with Recharts
  const historicalData = useMemo(() => {
    return computeHistoricalMetrics(
      availablePeriods,
      employees,
      masterList,
      currentPeriod,
      assessments,
      growthDivision
    );
  }, [availablePeriods, employees, masterList, currentPeriod, assessments, growthDivision]);

  // Aggregate stats
  const stats = useMemo(() => {
    if (assessments.length === 0) {
      return {
        count: 0,
        avgFinal: 0,
        avgA: 0,
        avgB: 0,
        gradeA: 0,
        gradeB: 0,
        gradeC: 0,
        gradeD: 0,
        gradeE: 0,
      };
    }
    const sumFinal = assessments.reduce((acc, a) => acc + a.finalScore, 0);
    const sumA = assessments.reduce((acc, a) => acc + a.totalSkorA, 0);
    const sumB = assessments.reduce((acc, a) => acc + a.totalSkorB, 0);

    return {
      count: assessments.length,
      avgFinal: Number((sumFinal / assessments.length).toFixed(2)),
      avgA: Number((sumA / assessments.length).toFixed(2)),
      avgB: Number((sumB / assessments.length).toFixed(2)),
      gradeA: assessments.filter((a) => a.grade === 'A').length,
      gradeB: assessments.filter((a) => a.grade === 'B').length,
      gradeC: assessments.filter((a) => a.grade === 'C').length,
      gradeD: assessments.filter((a) => a.grade === 'D').length,
      gradeE: assessments.filter((a) => a.grade === 'E').length,
    };
  }, [assessments]);

  // Filtered & Sorted list
  const filteredAssessments = useMemo(() => {
    let result = [...assessments];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (a) =>
          a.employeeName.toLowerCase().includes(q) ||
          a.employeeNik.toLowerCase().includes(q) ||
          a.division.toLowerCase().includes(q) ||
          a.position.toLowerCase().includes(q)
      );
    }

    if (selectedDivision !== 'ALL') {
      result = result.filter((a) => a.division === selectedDivision);
    }

    if (selectedGrade !== 'ALL') {
      result = result.filter((a) => a.grade === selectedGrade);
    }

    // Quick Status Filter: 'teladan' vs 'peningkatan'
    if (quickStatusFilter === 'teladan') {
      result = result.filter((a) => a.grade === 'A' || a.finalScore >= 8.5);
    } else if (quickStatusFilter === 'peningkatan') {
      result = result.filter((a) => ['C', 'D', 'E'].includes(a.grade) || a.finalScore < 7.0);
    }

    result.sort((a, b) => {
      if (sortBy === 'scoreDesc') return b.finalScore - a.finalScore;
      if (sortBy === 'scoreAsc') return a.finalScore - b.finalScore;
      if (sortBy === 'name') return a.employeeName.localeCompare(b.employeeName);
      if (sortBy === 'division') return a.division.localeCompare(b.division);
      return 0;
    });

    return result;
  }, [assessments, searchTerm, selectedDivision, selectedGrade, quickStatusFilter, sortBy]);

  // Reset to page 1 when search or filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDivision, selectedGrade, quickStatusFilter, sortBy, pageSize]);

  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(filteredAssessments.length / pageSize));
  const pagedAssessments = useMemo(() => {
    if (pageSize === -1) return filteredAssessments;
    const start = (currentPage - 1) * pageSize;
    return filteredAssessments.slice(start, start + pageSize);
  }, [filteredAssessments, currentPage, pageSize]);

  // Checkbox Selection Logic for custom email sending
  const isAllCurrentPageSelected =
    pagedAssessments.length > 0 &&
    pagedAssessments.every((a) => selectedAssessmentIds.has(a.id));

  const handleToggleSelectAllCurrentPage = () => {
    const next = new Set(selectedAssessmentIds);
    if (isAllCurrentPageSelected) {
      pagedAssessments.forEach((a) => next.delete(a.id));
    } else {
      pagedAssessments.forEach((a) => next.add(a.id));
    }
    setSelectedAssessmentIds(next);
  };

  const handleToggleSelectOne = (id: string) => {
    const next = new Set(selectedAssessmentIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedAssessmentIds(next);
  };

  const handleSelectAllFiltered = () => {
    const next = new Set(selectedAssessmentIds);
    filteredAssessments.forEach((a) => next.add(a.id));
    setSelectedAssessmentIds(next);
  };

  const handleSelectDraftFiltered = () => {
    const drafts = filteredAssessments
      .filter((a) => a.publishedStatus !== 'published')
      .map((a) => a.id);
    setSelectedAssessmentIds(new Set(drafts));
  };

  const handleSelectGradeAFiltered = () => {
    const gradeA = filteredAssessments.filter((a) => a.grade === 'A').map((a) => a.id);
    setSelectedAssessmentIds(new Set(gradeA));
  };

  const handleClearSelection = () => {
    setSelectedAssessmentIds(new Set());
  };

  const handleTriggerSelectiveEmail = () => {
    const selectedList = assessments.filter((a) => selectedAssessmentIds.has(a.id));
    if (selectedList.length === 0) {
      alert('Pilih minimal satu karyawan dengan mencentang kolom ceklis untuk mengirim email!');
      return;
    }
    if (onOpenSelectiveEmail) {
      onOpenSelectiveEmail(selectedList);
    } else if (onOpenBulkEmail) {
      onOpenBulkEmail();
    }
  };

  const getStatusBadge = (grade: string, label: string) => {
    switch (grade) {
      case 'A':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5"></span>
            {label}
          </span>
        );
      case 'B':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-1.5"></span>
            {label}
          </span>
        );
      case 'C':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mr-1.5"></span>
            {label}
          </span>
        );
      case 'D':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-600 mr-1.5"></span>
            {label}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mr-1.5"></span>
            {label}
          </span>
        );
    }
  };

  const activePeriodFullDate = getPeriodDateFormatted(currentPeriod, true);

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-300 text-xs font-medium border border-blue-400/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sistem Penilaian Terbuka & Otomatis</span>
              </div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tanggal Evaluasi: {activePeriodFullDate}</span>
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Dashboard Rekapitulasi Nilai Akhir Karyawan
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
              Memproses otomatis penilaian sikap (50%) dan pencapaian KPI teknis (50%) per divisi.
              Semua perhitungan transparan, terdata dengan tanggal lengkap, dan siap diekspor ke Excel secara instan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigateTab('sikap')}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold backdrop-blur-sm border border-white/20 transition flex items-center space-x-1.5"
            >
              <Calculator className="w-3.5 h-3.5 text-blue-300" />
              <span>Input Sikap (A)</span>
            </button>
            <button
              onClick={() => onNavigateTab('kpi')}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold backdrop-blur-sm border border-white/20 transition flex items-center space-x-1.5"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
              <span>Input KPI (B)</span>
            </button>
            <button
              onClick={onQuickSimulateAll}
              className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold shadow-lg shadow-blue-500/30 transition flex items-center space-x-1.5"
              title="Hitung ulang semua data & segarkan status otomatis"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Kalkulasi Otomatis</span>
            </button>

            {onOpenBulkEmail && (
              <button
                onClick={onOpenBulkEmail}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center space-x-1.5 cursor-pointer"
                title="Kirim email notifikasi hasil penilaian bulanan ke semua karyawan"
              >
                <Mail className="w-3.5 h-3.5 text-indigo-200" />
                <span>Publikasikan & Email Notifikasi</span>
              </button>
            )}

            {onOpenEmailLogs && (
              <button
                onClick={onOpenEmailLogs}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold backdrop-blur-sm border border-white/20 transition flex items-center space-x-1.5 cursor-pointer"
                title="Lihat riwayat bukti pengiriman email notifikasi"
              >
                <ClockIcon className="w-3.5 h-3.5 text-blue-300" />
                <span className="hidden sm:inline">Log Pengiriman</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Ringkasan Statistik Cepat: Intervensi & Apresiasi HR */}
      <div className="bg-slate-900/5 rounded-2xl p-4 sm:p-5 border border-slate-200/90 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
              </span>
              <h3 className="text-sm font-black text-slate-900 tracking-tight">
                Ringkasan Cepat Intervensi & Apresiasi HR
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                Action Center
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pantau segera jumlah karyawan berstatus <strong>Perlu Peningkatan</strong> untuk pendampingan/SP dan <strong>Karyawan Teladan</strong> untuk pemberian reward & apresiasi prestasi.
            </p>
          </div>

          {quickStatusFilter !== 'ALL' && (
            <button
              onClick={() => setQuickStatusFilter('ALL')}
              className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition flex items-center space-x-1.5 shadow-sm"
            >
              <X className="w-3.5 h-3.5" />
              <span>Hapus Filter ({quickStatusFilter === 'teladan' ? 'Teladan' : 'Peningkatan'})</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Card 1: Karyawan Teladan (Apresiasi HR) */}
          <div
            className={`rounded-2xl p-4 sm:p-5 border transition-all duration-200 shadow-sm relative overflow-hidden flex flex-col justify-between ${
              quickStatusFilter === 'teladan'
                ? 'bg-gradient-to-br from-emerald-50 via-emerald-50/60 to-white border-emerald-400 ring-2 ring-emerald-500/20 shadow-emerald-500/10'
                : 'bg-gradient-to-br from-emerald-50/40 via-white to-white border-emerald-200 hover:border-emerald-300 hover:shadow-md'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl shadow-sm">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md border border-emerald-200">
                      🌟 Rekomendasi Apresiasi
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">Karyawan Teladan</h4>
                  </div>
                </div>

                {quickStatusFilter === 'teladan' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white flex items-center space-x-1 shadow-sm">
                    <span>Sedang Difilter</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Grade A (&ge; 8.50)
                  </span>
                )}
              </div>

              <div className="mt-3.5 flex items-baseline space-x-2">
                <span className="text-3xl font-black text-emerald-700 font-mono tracking-tight">
                  {teladanEmployees.length}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Karyawan ({teladanPercent}% dari total)
                </span>
              </div>

              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Kategori <strong>Sangat Baik (Grade A)</strong> dengan capaian target KPI optimal dan integritas etika tinggi. Memenuhi syarat apresiasi instansi.
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200 font-mono">
                  Rata-rata: {avgTeladanScore} / 10
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                  Insentif Prestasi Maksimal
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                  Prioritas Promosi Karir
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3.5 border-t border-emerald-100 flex items-center justify-between gap-2 flex-wrap">
              <button
                onClick={() => setQuickStatusFilter(quickStatusFilter === 'teladan' ? 'ALL' : 'teladan')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                  quickStatusFilter === 'teladan'
                    ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                    : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300/50'
                }`}
                title="Tampilkan hanya Karyawan Teladan pada tabel nilai akhir"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>{quickStatusFilter === 'teladan' ? 'Batal Filter' : 'Filter di Tabel'}</span>
              </button>

              <button
                onClick={() => {
                  setHrModalTab('teladan');
                  setIsHRActionModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition flex items-center space-x-1 shadow-sm"
              >
                <span>Tinjau Rekomendasi Apresiasi</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Card 2: Perlu Peningkatan (Intervensi HR) */}
          <div
            className={`rounded-2xl p-4 sm:p-5 border transition-all duration-200 shadow-sm relative overflow-hidden flex flex-col justify-between ${
              quickStatusFilter === 'peningkatan'
                ? 'bg-gradient-to-br from-rose-50 via-amber-50/50 to-white border-rose-400 ring-2 ring-rose-500/20 shadow-rose-500/10'
                : 'bg-gradient-to-br from-rose-50/40 via-white to-white border-rose-200 hover:border-rose-300 hover:shadow-md'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl shadow-sm">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 bg-rose-100/70 px-2 py-0.5 rounded-md border border-rose-200">
                      ⚠️ Butuh Intervensi & Coaching
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">Perlu Peningkatan</h4>
                  </div>
                </div>

                {quickStatusFilter === 'peningkatan' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white flex items-center space-x-1 shadow-sm">
                    <span>Sedang Difilter</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    Nilai &lt; 7.00
                  </span>
                )}
              </div>

              <div className="mt-3.5 flex items-baseline space-x-2">
                <span className="text-3xl font-black text-rose-700 font-mono tracking-tight">
                  {peningkatanEmployees.length}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Karyawan ({peningkatanPercent}% dari total)
                </span>
              </div>

              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Kategori <strong>Cukup (C), Kurang (D), Sangat Kurang (E)</strong> dengan Nilai Akhir &lt; 7.00. Di bawah standar minimal dan memerlukan pembinaan intensif.
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-semibold border border-rose-200">
                  {kritisEmployees.length} Kritis / Butuh SP (&lt;5.0)
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-semibold border border-amber-200">
                  {coachingEmployees.length} Butuh Coaching (5.0 - 6.9)
                </span>
                {telatInPeningkatan.length > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                    {telatInPeningkatan.length} Sering Terlambat
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3.5 border-t border-rose-100 flex items-center justify-between gap-2 flex-wrap">
              <button
                onClick={() => setQuickStatusFilter(quickStatusFilter === 'peningkatan' ? 'ALL' : 'peningkatan')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                  quickStatusFilter === 'peningkatan'
                    ? 'bg-rose-600 text-white shadow-sm hover:bg-rose-700'
                    : 'bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300/50'
                }`}
                title="Tampilkan hanya Karyawan Perlu Peningkatan pada tabel nilai akhir"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>{quickStatusFilter === 'peningkatan' ? 'Batal Filter' : 'Filter di Tabel'}</span>
              </button>

              <button
                onClick={() => {
                  setHrModalTab('peningkatan');
                  setIsHRActionModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition flex items-center space-x-1 shadow-sm"
              >
                <span>Tinjau Rencana Intervensi</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Rata-rata Nilai Akhir */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Rata-rata Nilai Akhir
              </p>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 font-mono">
                {stats.avgFinal}
                <span className="text-xs font-normal text-slate-400 ml-1">/ 10.00</span>
              </div>
            </div>
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>
            Kombinasi 50% Sikap + 50% KPI
          </p>
        </div>

        {/* Card 2: Rata-rata Skor Sikap (A) */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Rata-rata Sikap (A)
              </p>
              <div className="text-2xl sm:text-3xl font-black text-blue-700 mt-1 font-mono">
                {stats.avgA}
                <span className="text-xs font-normal text-slate-400 ml-1">/ 10.00</span>
              </div>
            </div>
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 flex items-center">
            <span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></span>
            Termasuk faktor absensi & penalti telat
          </p>
        </div>

        {/* Card 3: Rata-rata Skor KPI Teknis (B) */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Rata-rata KPI (B)
              </p>
              <div className="text-2xl sm:text-3xl font-black text-indigo-700 mt-1 font-mono">
                {stats.avgB}
                <span className="text-xs font-normal text-slate-400 ml-1">/ 10.00</span>
              </div>
            </div>
            <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 flex items-center">
            <span className="w-2 h-2 rounded-full bg-indigo-500 mr-1.5"></span>
            Target spesifik per 10 divisi
          </p>
        </div>

        {/* Card 4: Total Karyawan */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Dinilai
              </p>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 font-mono">
                {stats.count}
                <span className="text-xs font-normal text-slate-400 ml-1">Karyawan</span>
              </div>
            </div>
            <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 flex items-center">
            <span className="w-2 h-2 rounded-full bg-purple-500 mr-1.5"></span>
            Semua divisi terdata di sistem
          </p>
        </div>
      </div>

      {/* Historical Growth Over Time Visualization (Recharts) */}
      <HistoricalGrowthChart
        historicalData={historicalData}
        currentPeriod={currentPeriod}
        onSelectPeriod={onPeriodChange}
        availableDivisions={divisions}
        selectedDivision={growthDivision}
        onDivisionChange={setGrowthDivision}
      />

      {/* Top 5 Highest Performing Employees Line Chart (Recharts) for Talent Recognition */}
      <TopPerformersTrendChart
        currentPeriod={currentPeriod}
        assessments={assessments}
        employees={employees}
        masterList={masterList}
        availableDivisions={divisions}
        onSelectAssessment={onSelectAssessment}
      />

      {/* Grade Distribution Bar */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
            <Award className="w-4 h-4 text-blue-600" />
            <span>Distribusi Kategori Penilaian Periode Ini</span>
          </h3>
          <div className="text-xs text-slate-500">
            Total {assessments.length} Orang Terdaftar
          </div>
        </div>

        {/* Progress pills */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-xs">
          <button
            onClick={() => setSelectedGrade(selectedGrade === 'A' ? 'ALL' : 'A')}
            className={`p-2.5 rounded-lg border text-left transition ${
              selectedGrade === 'A'
                ? 'bg-emerald-100 border-emerald-400 ring-2 ring-emerald-500/20'
                : 'bg-emerald-50/60 border-emerald-200 hover:bg-emerald-100/50'
            }`}
          >
            <div className="flex justify-between font-bold text-emerald-800">
              <span>Sangat Baik (A)</span>
              <span className="font-mono">{stats.gradeA}</span>
            </div>
            <div className="text-[11px] text-emerald-700 mt-0.5">&ge; 8.50</div>
          </button>

          <button
            onClick={() => setSelectedGrade(selectedGrade === 'B' ? 'ALL' : 'B')}
            className={`p-2.5 rounded-lg border text-left transition ${
              selectedGrade === 'B'
                ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-500/20'
                : 'bg-blue-50/60 border-blue-200 hover:bg-blue-100/50'
            }`}
          >
            <div className="flex justify-between font-bold text-blue-800">
              <span>Baik (B)</span>
              <span className="font-mono">{stats.gradeB}</span>
            </div>
            <div className="text-[11px] text-blue-700 mt-0.5">7.00 - 8.49</div>
          </button>

          <button
            onClick={() => setSelectedGrade(selectedGrade === 'C' ? 'ALL' : 'C')}
            className={`p-2.5 rounded-lg border text-left transition ${
              selectedGrade === 'C'
                ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-500/20'
                : 'bg-amber-50/60 border-amber-200 hover:bg-amber-100/50'
            }`}
          >
            <div className="flex justify-between font-bold text-amber-800">
              <span>Cukup (C)</span>
              <span className="font-mono">{stats.gradeC}</span>
            </div>
            <div className="text-[11px] text-amber-700 mt-0.5">5.00 - 6.99</div>
          </button>

          <button
            onClick={() => setSelectedGrade(selectedGrade === 'D' ? 'ALL' : 'D')}
            className={`p-2.5 rounded-lg border text-left transition ${
              selectedGrade === 'D'
                ? 'bg-orange-100 border-orange-400 ring-2 ring-orange-500/20'
                : 'bg-orange-50/60 border-orange-200 hover:bg-orange-100/50'
            }`}
          >
            <div className="flex justify-between font-bold text-orange-800">
              <span>Kurang (D)</span>
              <span className="font-mono">{stats.gradeD}</span>
            </div>
            <div className="text-[11px] text-orange-700 mt-0.5">3.00 - 4.99</div>
          </button>

          <button
            onClick={() => setSelectedGrade(selectedGrade === 'E' ? 'ALL' : 'E')}
            className={`p-2.5 rounded-lg border text-left transition ${
              selectedGrade === 'E'
                ? 'bg-rose-100 border-rose-400 ring-2 ring-rose-500/20'
                : 'bg-rose-50/60 border-rose-200 hover:bg-rose-100/50'
            }`}
          >
            <div className="flex justify-between font-bold text-rose-800">
              <span>Sangat Kurang (E)</span>
              <span className="font-mono">{stats.gradeE}</span>
            </div>
            <div className="text-[11px] text-rose-700 mt-0.5">&lt; 3.00 (PHK)</div>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama karyawan, NIK, atau divisi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Division Filter */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer font-medium text-slate-700"
            >
              <option value="ALL">Semua Divisi ({divisions.length})</option>
              {divisions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent focus:outline-none cursor-pointer font-medium text-slate-700"
            >
              <option value="scoreDesc">Nilai Tertinggi (Rank Top)</option>
              <option value="scoreAsc">Nilai Terendah</option>
              <option value="name">Nama Karyawan (A - Z)</option>
              <option value="division">Divisi</option>
            </select>
          </div>

          {(searchTerm || selectedDivision !== 'ALL' || selectedGrade !== 'ALL' || quickStatusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedDivision('ALL');
                setSelectedGrade('ALL');
                setQuickStatusFilter('ALL');
              }}
              className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 underline font-medium"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Active Quick Filter Notification Banner */}
      {quickStatusFilter !== 'ALL' && (
        <div
          className={`px-4 py-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in duration-150 ${
            quickStatusFilter === 'teladan'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-rose-50 border-rose-300 text-rose-950'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {quickStatusFilter === 'teladan' ? (
              <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <div>
              <span className="font-bold">
                {quickStatusFilter === 'teladan'
                  ? `Filter Aktif: Menampilkan ${filteredAssessments.length} Karyawan Teladan (Grade A, Skor ≥ 8.50)`
                  : `Filter Aktif: Menampilkan ${filteredAssessments.length} Karyawan Perlu Peningkatan (Skor < 7.00)`}
              </span>
              <p className="text-[11px] opacity-85 mt-0.5">
                {quickStatusFilter === 'teladan'
                  ? 'Gunakan tombol Rapor pada setiap baris untuk mencetak atau meninjau slip prestasi karyawan.'
                  : 'Fasilitasi pembinaan coaching atau penerbitan surat peringatan (SP) sesuai tingkat keparahan skor.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={() => {
                setHrModalTab(quickStatusFilter);
                setIsHRActionModalOpen(true);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs shadow-sm transition ${
                quickStatusFilter === 'teladan'
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-rose-600 text-white hover:bg-rose-700'
              }`}
            >
              {quickStatusFilter === 'teladan' ? 'Buka Rekomendasi Apresiasi' : 'Buka Rencana Intervensi'}
            </button>
            <button
              onClick={() => setQuickStatusFilter('ALL')}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold transition flex items-center space-x-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Hapus Filter</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Table Matching Sheet "1. Dashboard Nilai Akhir" */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Top Header */}
        <div className="px-5 py-3.5 bg-slate-800 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-sm tracking-wide">
                1. Dashboard Nilai Akhir
              </h3>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1 font-sans">
                <Calendar className="w-3 h-3 text-blue-300" />
                <span>{activePeriodFullDate}</span>
              </span>
              {selectedAssessmentIds.size > 0 && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500 text-white shadow-xs">
                  {selectedAssessmentIds.size} Dipilih
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Format tampilan tabel sesuai struktur sheet Excel HRD &bull; Tanggal Penilaian: <strong>{activePeriodFullDate}</strong>
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {onOpenHistoryModal && (
              <button
                type="button"
                onClick={onOpenHistoryModal}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                title="Buka Rekapitulasi Riwayat Penilaian Lengkap (Hari, Tanggal, Bulan & Tahun)"
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                <span>Cek Riwayat (Hari, Tanggal, Bulan, Tahun)</span>
              </button>
            )}
            <span className="text-xs text-slate-300 font-mono hidden sm:inline">
              {filteredAssessments.length} dari {assessments.length} Karyawan
            </span>
          </div>
        </div>

        {/* Checkbox Quick Actions Toolbar */}
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-bold text-slate-700 text-[11px] mr-1 flex items-center gap-1">
              <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
              <span>Kolom Ceklis:</span>
            </span>
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-700 font-semibold transition text-[11px] cursor-pointer"
            >
              Centang Semua ({filteredAssessments.length})
            </button>
            <button
              type="button"
              onClick={handleSelectDraftFiltered}
              className="px-2.5 py-1 bg-amber-50 border border-amber-300 hover:bg-amber-100 rounded-lg text-amber-800 font-semibold transition text-[11px] cursor-pointer"
            >
              Hanya Draft ({filteredAssessments.filter((a) => a.publishedStatus !== 'published').length})
            </button>
            <button
              type="button"
              onClick={handleSelectGradeAFiltered}
              className="px-2.5 py-1 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 rounded-lg text-emerald-800 font-semibold transition text-[11px] cursor-pointer"
            >
              Grade A ({filteredAssessments.filter((a) => a.grade === 'A').length})
            </button>
            {selectedAssessmentIds.size > 0 && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="px-2.5 py-1 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg text-rose-700 font-medium transition text-[11px] cursor-pointer"
              >
                Batal Centang
              </button>
            )}
          </div>

          {selectedAssessmentIds.size > 0 && (
            <button
              type="button"
              onClick={handleTriggerSelectiveEmail}
              className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg font-bold text-xs shadow-xs transition flex items-center space-x-1.5 cursor-pointer animate-in fade-in duration-150"
            >
              <Mail className="w-3.5 h-3.5 text-blue-200" />
              <span>Kirim Email ke ({selectedAssessmentIds.size}) Karyawan Terpilih</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#1F4E78] text-white font-bold text-center border-b border-slate-300">
                {/* KOLOM CEKLIS HEADER */}
                <th className="py-3 px-2 text-center w-10 border border-slate-300 bg-[#173e61]">
                  <input
                    type="checkbox"
                    checked={isAllCurrentPageSelected}
                    onChange={handleToggleSelectAllCurrentPage}
                    title="Centang / Batal Centang Semua di Halaman Ini"
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3 text-center w-12 border border-slate-300">No</th>
                <th className="py-3 px-3 text-left border border-slate-300 min-w-[150px]">
                  Hari & Tanggal<br />
                  <span className="text-[10px] font-normal text-blue-100">(Waktu Penilaian)</span>
                </th>
                <th className="py-3 px-4 text-left border border-slate-300 min-w-[180px]">Nama Karyawan</th>
                <th className="py-3 px-3 text-left border border-slate-300 min-w-[120px]">Divisi</th>
                <th className="py-3 px-3 text-center border border-slate-300 min-w-[130px]">
                  Skor Sikap (A)<br />
                  <span className="text-[10px] font-normal text-blue-100">(Bobot 50%)</span>
                </th>
                <th className="py-3 px-3 text-center border border-slate-300 min-w-[140px]">
                  Skor KPI Teknis (B)<br />
                  <span className="text-[10px] font-normal text-blue-100">(Bobot 50%)</span>
                </th>
                {/* Nilai Akhir column highlighted matching openpyxl: PatternFill start_color="E2EFDA" */}
                <th className="py-3 px-4 text-center border border-slate-300 bg-[#16365C] min-w-[130px]">
                  NILAI AKHIR<br />
                  <span className="text-[10px] font-normal text-emerald-200">(1-10)</span>
                </th>
                <th className="py-3 px-4 text-center border border-slate-300 min-w-[160px]">Kategori / Status</th>
                <th className="py-3 px-3 text-center border border-slate-300 w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {pagedAssessments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Tidak ada data karyawan yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                pagedAssessments.map((item, idx) => {
                  const seqNo = (currentPage - 1) * (pageSize === -1 ? 0 : pageSize) + idx + 1;
                  const isChecked = selectedAssessmentIds.has(item.id);
                  return (
                    <tr
                      key={item.id}
                      className={`transition border-b border-slate-200 ${
                        isChecked ? 'bg-blue-50/60 hover:bg-blue-50/80' : 'hover:bg-blue-50/20'
                      }`}
                    >
                      {/* KOLOM CEKLIS ROW */}
                      <td className="py-2.5 px-2 text-center border border-slate-200">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectOne(item.id)}
                          title={`Centang ${item.employeeName} untuk kirim email notifikasi`}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-500 font-mono border border-slate-200">
                        {seqNo}
                      </td>

                      {/* HARI & TANGGAL PENILAIAN */}
                      <td className="py-2.5 px-3 border border-slate-200">
                        <div className="flex items-center space-x-1.5 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 font-bold text-[10px] border border-blue-200 dark:border-blue-900">
                            {item.dayName || 'Kamis'}
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                            {item.day || 24} {item.monthName?.slice(0, 3) || 'Sep'} {item.year || 2026}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {item.assessmentDate || `${item.period}-24`}
                        </div>
                      </td>

                      <td className="py-2.5 px-4 font-semibold text-slate-900 border border-slate-200">
                        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                          <span>{item.employeeName}</span>
                          {(item.grade === 'A' || item.finalScore >= 8.5) && (
                            <span
                              title="Karyawan Teladan (Grade A, Skor ≥ 8.50)"
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center space-x-1 shadow-xs"
                            >
                              <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                              <span>Teladan</span>
                            </span>
                          )}
                          {(item.finalScore < 7.0 || ['C', 'D', 'E'].includes(item.grade)) && (
                            <span
                              title={item.finalScore < 5.0 ? 'Kritis / Butuh SP' : 'Perlu Coaching'}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border inline-flex items-center space-x-1 shadow-xs ${
                                item.finalScore < 5.0
                                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                                  : 'bg-amber-100 text-amber-800 border-amber-300'
                              }`}
                            >
                              <AlertTriangle className="w-2.5 h-2.5" />
                              <span>{item.finalScore < 5.0 ? 'Kritis / SP' : 'Perlu Peningkatan'}</span>
                            </span>
                          )}
                          {item.seringTelat === 'Ya' && (
                            <span
                              title="Peringatan: Sering Terlambat (Penalti absensi aktif)"
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center space-x-0.5"
                            >
                              <Clock className="w-2.5 h-2.5 text-amber-600" />
                              <span>Telat</span>
                            </span>
                          )}
                          {item.publishedStatus === 'published' ? (
                            <span
                              title={`Sudah dikirim ke email: ${item.notificationRecipientEmail || 'karyawan'} (${item.lastNotifiedAt ? new Date(item.lastNotifiedAt).toLocaleDateString('id-ID') : ''})`}
                              className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center space-x-0.5"
                            >
                              <Mail className="w-2.5 h-2.5 text-blue-600" />
                              <span>Email Terkirim</span>
                            </span>
                          ) : (
                            <span
                              title="Hasil penilaian ini masih berstatus draft (belum dipublikasikan ke email karyawan)"
                              className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200 inline-flex items-center space-x-0.5"
                            >
                              <span>Draft</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-normal text-slate-400 mt-0.5">
                          {item.employeeNik} &bull; {item.position}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 font-medium border border-slate-200">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded text-[11px] border border-slate-200">
                          {item.division}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-800 border border-slate-200">
                        {item.totalSkorA.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-800 border border-slate-200">
                        {item.totalSkorB.toFixed(2)}
                      </td>

                      {/* Exact highlight #E2EFDA from openpyxl script */}
                      <td className="py-2.5 px-4 text-center font-mono font-black text-slate-900 bg-[#E2EFDA] border border-slate-300 text-sm">
                        {item.finalScore.toFixed(2)}
                      </td>

                      <td className="py-2.5 px-4 text-center border border-slate-200">
                        {getStatusBadge(item.grade, item.statusLabel)}
                      </td>

                      <td className="py-2.5 px-3 text-center border border-slate-200 whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => onSelectAssessment(item)}
                            className="px-2 py-1.5 bg-slate-900 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition inline-flex items-center space-x-1 shadow-xs cursor-pointer"
                            title="Buka Slip Penilaian Transparan & Cetak Rapor"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Rapor</span>
                          </button>

                          {onOpenSendEmail && (
                            <button
                              onClick={() => onOpenSendEmail(item)}
                              className={`p-1.5 rounded-lg border text-xs transition inline-flex items-center justify-center shadow-xs cursor-pointer ${
                                item.publishedStatus === 'published'
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                                  : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                              }`}
                              title={
                                item.publishedStatus === 'published'
                                  ? `Sudah dipublikasikan ke email (${item.lastNotifiedAt ? new Date(item.lastNotifiedAt).toLocaleDateString('id-ID') : ''}) - Klik untuk kirim pembaruan`
                                  : 'Kirim email notifikasi hasil penilaian resmi ke karyawan ini'
                              }
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <span>Tampilkan per halaman:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-medium focus:outline-none"
            >
              <option value={25}>25 Karyawan</option>
              <option value={50}>50 Karyawan</option>
              <option value={100}>100 Karyawan</option>
              <option value={-1}>Tampilkan Semua ({filteredAssessments.length})</option>
            </select>
            <span className="text-slate-400">|</span>
            <span>
              Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong> (Total {filteredAssessments.length} Karyawan)
            </span>
          </div>

          {pageSize !== -1 && totalPages > 1 && (
            <div className="flex items-center space-x-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded border border-slate-300 bg-white font-medium hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Sebelumnya
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => {
                // Show first, last, and near current page
                if (
                  pg === 1 ||
                  pg === totalPages ||
                  (pg >= currentPage - 2 && pg <= currentPage + 2)
                ) {
                  return (
                    <button
                      key={pg}
                      onClick={() => setCurrentPage(pg)}
                      className={`w-7 h-7 rounded text-xs font-bold transition ${
                        currentPage === pg
                          ? 'bg-blue-600 text-white'
                          : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {pg}
                    </button>
                  );
                } else if (pg === currentPage - 3 || pg === currentPage + 3) {
                  return <span key={pg} className="px-1 text-slate-400">...</span>;
                }
                return null;
              })}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded border border-slate-300 bg-white font-medium hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Selanjutnya
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Pusat Intervensi & Apresiasi HR */}
      <HRQuickActionModal
        isOpen={isHRActionModalOpen}
        onClose={() => setIsHRActionModalOpen(false)}
        assessments={assessments}
        initialTab={hrModalTab}
        onSelectAssessment={onSelectAssessment}
      />

      {/* Floating Selection Action Bar for Quick Emailing */}
      {selectedAssessmentIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center space-x-4 animate-in slide-in-from-bottom-5 duration-200 max-w-full">
          <div className="flex items-center space-x-2 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold text-xs sm:text-sm whitespace-nowrap">
              {selectedAssessmentIds.size} Karyawan Dipilih
            </span>
          </div>

          <button
            type="button"
            onClick={handleTriggerSelectiveEmail}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap"
          >
            <Mail className="w-4 h-4 text-blue-200" />
            <span>Kirim Email ke ({selectedAssessmentIds.size}) Karyawan</span>
          </button>

          <button
            type="button"
            onClick={handleClearSelection}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition shrink-0"
            title="Batalkan Pilihan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
