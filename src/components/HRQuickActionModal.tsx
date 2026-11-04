import React, { useState, useMemo } from 'react';
import {
  X,
  Award,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  TrendingDown,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Clock,
  Briefcase
} from 'lucide-react';
import { MonthlyAssessment } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  assessments: MonthlyAssessment[];
  initialTab?: 'teladan' | 'peningkatan';
  onSelectAssessment: (assessment: MonthlyAssessment) => void;
}

export const HRQuickActionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  assessments,
  initialTab = 'peningkatan',
  onSelectAssessment,
}) => {
  const [activeTab, setActiveTab] = useState<'teladan' | 'peningkatan'>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('ALL');
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'kritis' | 'coaching' | 'telat'>('ALL');

  // Sync initialTab when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSearchTerm('');
      setSelectedDivision('ALL');
      setFilterSeverity('ALL');
    }
  }, [isOpen, initialTab]);

  // Compute lists
  const teladanList = useMemo(() => {
    return assessments
      .filter((a) => a.grade === 'A' || a.finalScore >= 8.5)
      .sort((a, b) => b.finalScore - a.finalScore);
  }, [assessments]);

  const peningkatanList = useMemo(() => {
    return assessments
      .filter((a) => ['C', 'D', 'E'].includes(a.grade) || a.finalScore < 7.0)
      .sort((a, b) => a.finalScore - b.finalScore);
  }, [assessments]);

  // Divisions for filtering
  const divisions = useMemo(() => {
    const list = Array.from(new Set(assessments.map((a) => a.division)));
    return list.sort();
  }, [assessments]);

  // Filtered active list
  const displayList = useMemo(() => {
    let source = activeTab === 'teladan' ? teladanList : peningkatanList;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      source = source.filter(
        (a) =>
          a.employeeName.toLowerCase().includes(q) ||
          a.employeeNik.toLowerCase().includes(q) ||
          a.division.toLowerCase().includes(q) ||
          a.position.toLowerCase().includes(q)
      );
    }

    if (selectedDivision !== 'ALL') {
      source = source.filter((a) => a.division === selectedDivision);
    }

    if (activeTab === 'peningkatan' && filterSeverity !== 'ALL') {
      if (filterSeverity === 'kritis') {
        source = source.filter((a) => a.finalScore < 5.0 || ['D', 'E'].includes(a.grade));
      } else if (filterSeverity === 'coaching') {
        source = source.filter((a) => a.finalScore >= 5.0 && a.finalScore < 7.0);
      } else if (filterSeverity === 'telat') {
        source = source.filter((a) => a.seringTelat === 'Ya');
      }
    }

    return source;
  }, [activeTab, teladanList, peningkatanList, searchTerm, selectedDivision, filterSeverity]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl ${
              activeTab === 'teladan'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-400/30'
            }`}>
              {activeTab === 'teladan' ? <Sparkles className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold">
                  {activeTab === 'teladan' ? 'Daftar & Rekomendasi Karyawan Teladan' : 'Daftar & Rencana Intervensi Karyawan'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/10 border border-white/20">
                  HR Action Desk
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {activeTab === 'teladan'
                  ? 'Karyawan dengan performa sangat memuaskan (Skor ≥ 8.50) yang siap menerima apresiasi dan reward'
                  : 'Karyawan dengan performa di bawah standar (Skor < 7.00) yang memerlukan pembinaan atau tindakan korektif'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 pt-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('peningkatan')}
              className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition ${
                activeTab === 'peningkatan'
                  ? 'border-rose-600 text-rose-700 bg-white rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Perlu Peningkatan</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                {peningkatanList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('teladan')}
              className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition ${
                activeTab === 'teladan'
                  ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Karyawan Teladan</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                {teladanList.length}
              </span>
            </button>
          </div>

          <div className="text-xs text-slate-500 pb-2">
            Total Dinilai: <strong>{assessments.length} Karyawan</strong>
          </div>
        </div>

        {/* Action Strategy Guide Banner */}
        <div className="px-6 py-3 bg-slate-100/70 border-b border-slate-200">
          {activeTab === 'teladan' ? (
            <div className="flex items-start space-x-3 text-xs text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-bold text-emerald-900">Panduan Apresiasi HR:</span> Seluruh karyawan di daftar ini memenuhi kualifikasi pencapaian target kerja prima dan perilaku berintegritas. Disarankan untuk memberikan <strong>Insentif Prestasi Maksimal</strong>, <strong>Sertifikat Karyawan Berprestasi</strong>, atau <strong>Prioritas Promosi Jenjang Karir</strong>.
              </div>
            </div>
          ) : (
            <div className="flex items-start space-x-3 text-xs text-slate-700">
              <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-bold text-rose-900">Prosedur Intervensi HR:</span> Karyawan dengan Skor 5.0 - 6.99 (Grade C) wajib mendapatkan <strong>Coaching 1-on-1</strong> dengan atasan. Karyawan dengan Skor &lt; 5.00 (Grade D/E) segera diterbitkan <strong>Surat Peringatan (SP 1 / SP 2)</strong> dan program PIP 30-hari.
              </div>
            </div>
          )}
        </div>

        {/* Filter & Search Bar */}
        <div className="px-6 py-3 border-b border-slate-200 bg-white flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama, NIK, jabatan, atau divisi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Division Filter */}
            <div className="flex items-center space-x-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer font-medium text-slate-700 text-xs"
              >
                <option value="ALL">Semua Divisi</option>
                {divisions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Severity Filter for 'peningkatan' */}
            {activeTab === 'peningkatan' && (
              <div className="flex items-center space-x-1 text-xs">
                <button
                  onClick={() => setFilterSeverity('ALL')}
                  className={`px-2 py-1 rounded text-xs font-medium transition ${
                    filterSeverity === 'ALL'
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua ({peningkatanList.length})
                </button>
                <button
                  onClick={() => setFilterSeverity('kritis')}
                  className={`px-2 py-1 rounded text-xs font-medium transition ${
                    filterSeverity === 'kritis'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                  }`}
                >
                  Kritis / SP (&lt;5.0)
                </button>
                <button
                  onClick={() => setFilterSeverity('coaching')}
                  className={`px-2 py-1 rounded text-xs font-medium transition ${
                    filterSeverity === 'coaching'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  Coaching (5.0-6.9)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Body: Table / List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {displayList.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium">Tidak ada data karyawan yang cocok dengan kriteria filter.</p>
              <p className="text-xs text-slate-400 mt-1">
                {activeTab === 'peningkatan'
                  ? 'Kabar baik! Tidak ada karyawan yang masuk dalam status ini untuk filter yang dipilih.'
                  : 'Coba ubah kata kunci pencarian atau filter divisi.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {displayList.map((item, idx) => {
                const isKritis = item.finalScore < 5.0 || ['D', 'E'].includes(item.grade);
                const isCoaching = item.finalScore >= 5.0 && item.finalScore < 7.0;

                return (
                  <div
                    key={item.id}
                    className={`rounded-xl p-4 border transition hover:shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      activeTab === 'teladan'
                        ? 'bg-gradient-to-r from-emerald-50/40 via-white to-white border-emerald-200'
                        : isKritis
                        ? 'bg-gradient-to-r from-rose-50/50 via-white to-white border-rose-200'
                        : 'bg-gradient-to-r from-amber-50/40 via-white to-white border-amber-200'
                    }`}
                  >
                    {/* Left: Info */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-400">#{idx + 1}</span>
                        <h4 className="text-sm font-bold text-slate-900 truncate">{item.employeeName}</h4>
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {item.division}
                        </span>

                        {activeTab === 'teladan' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-1">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            <span>Karyawan Teladan</span>
                          </span>
                        ) : isKritis ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center space-x-1">
                            <ShieldAlert className="w-3 h-3 text-rose-600" />
                            <span>Kritis / Butuh SP</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center space-x-1">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>Perlu Coaching</span>
                          </span>
                        )}

                        {item.seringTelat === 'Ya' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Sering Terlambat</span>
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 flex items-center space-x-2">
                        <span>NIK: {item.employeeNik}</span>
                        <span>&bull;</span>
                        <span>{item.position}</span>
                      </div>

                      {/* Diagnostic / Recommendation snippet */}
                      <p className="text-xs text-slate-600 pt-1">
                        {activeTab === 'teladan' ? (
                          <span className="text-emerald-800">
                            🌟 <strong>Apresiasi:</strong> {item.notes || 'Performa teladan, berhak atas bonus kinerja maksimal dan rekomendasi promosi.'}
                          </span>
                        ) : (
                          <span className={isKritis ? 'text-rose-800' : 'text-amber-800'}>
                            📋 <strong>Tindakan HR:</strong>{' '}
                            {isKritis
                              ? 'Panggilan HRD & Terbitkan SP 1 / SP 2. Rencanakan evaluasi performa intensif 30 hari.'
                              : 'Jadwalkan sesi coaching 1-on-1 dengan supervisor divisi mengenai peningkatan KPI dan kedisiplinan.'}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Right: Scores & Action */}
                    <div className="flex items-center space-x-4 flex-shrink-0 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                      {/* Metric pills */}
                      <div className="flex items-center space-x-2 text-center">
                        <div className="px-2.5 py-1.5 bg-white rounded-lg border border-slate-200">
                          <div className="text-[10px] font-medium text-slate-400">Sikap (A)</div>
                          <div className="font-mono font-bold text-xs text-slate-800">
                            {item.totalSkorA.toFixed(2)}
                          </div>
                        </div>

                        <div className="px-2.5 py-1.5 bg-white rounded-lg border border-slate-200">
                          <div className="text-[10px] font-medium text-slate-400">KPI (B)</div>
                          <div className="font-mono font-bold text-xs text-slate-800">
                            {item.totalSkorB.toFixed(2)}
                          </div>
                        </div>

                        <div className={`px-3 py-1.5 rounded-lg border text-center ${
                          activeTab === 'teladan'
                            ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                            : isKritis
                            ? 'bg-rose-100 border-rose-300 text-rose-900'
                            : 'bg-amber-100 border-amber-300 text-amber-900'
                        }`}>
                          <div className="text-[10px] font-bold uppercase">Nilai Akhir</div>
                          <div className="font-mono font-black text-sm">{item.finalScore.toFixed(2)}</div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => {
                          onClose();
                          onSelectAssessment(item);
                        }}
                        className="px-3 py-2 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
                        title="Buka Rapor & Slip Penilaian Karyawan"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Rapor</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span>Menampilkan <strong>{displayList.length}</strong> data karyawan</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl text-xs transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
