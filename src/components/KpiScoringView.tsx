import React, { useState } from 'react';
import {
  Target,
  Sparkles,
  Search,
  Filter,
  CheckCircle,
  HelpCircle,
  Calendar,
} from 'lucide-react';
import { MonthlyAssessment } from '../types';
import { calculateFinalScore, calculateScoreB, determineGradeAndStatus } from '../utils/calculations';
import { getPeriodDateFormatted } from '../utils/assessmentDatabase';

interface Props {
  assessments: MonthlyAssessment[];
  onUpdateAssessment: (updated: MonthlyAssessment) => void;
  onBatchUpdate: (updatedList: MonthlyAssessment[]) => void;
}

export const KpiScoringView: React.FC<Props> = ({
  assessments,
  onUpdateAssessment,
  onBatchUpdate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('ALL');
  const [saveToast, setSaveToast] = useState(false);

  // Divisions
  const divisions = Array.from(new Set(assessments.map((a) => a.division))).sort();

  const handleScoreChange = (
    item: MonthlyAssessment,
    whichKpi: 1 | 2,
    scoreVal: number,
    noteVal?: string
  ) => {
    const updated = { ...item };

    if (whichKpi === 1) {
      updated.kpi1Score = Math.max(0, Math.min(10, scoreVal));
      if (noteVal !== undefined) updated.kpi1Note = noteVal;
    } else {
      updated.kpi2Score = Math.max(0, Math.min(10, scoreVal));
      if (noteVal !== undefined) updated.kpi2Note = noteVal;
    }

    // Recalculate score B
    const newScoreB = calculateScoreB({
      kpi1Score: updated.kpi1Score,
      kpi1Weight: updated.kpi1Weight,
      kpi2Score: updated.kpi2Score,
      kpi2Weight: updated.kpi2Weight,
    });
    updated.totalSkorB = newScoreB;

    // Recalculate Final score & status
    const newFinalScore = calculateFinalScore(updated.totalSkorA, newScoreB);
    const { grade, statusLabel } = determineGradeAndStatus(newFinalScore);
    updated.finalScore = newFinalScore;
    updated.grade = grade;
    updated.statusLabel = statusLabel;
    updated.updatedAt = new Date().toISOString();

    onUpdateAssessment(updated);
  };

  const handleSetPresetKpi = (targetScore: number) => {
    const updatedList = assessments.map((item) => {
      const updated = {
        ...item,
        kpi1Score: targetScore,
        kpi2Score: targetScore,
      };

      const newScoreB = calculateScoreB({
        kpi1Score: updated.kpi1Score,
        kpi1Weight: updated.kpi1Weight,
        kpi2Score: updated.kpi2Score,
        kpi2Weight: updated.kpi2Weight,
      });
      updated.totalSkorB = newScoreB;

      const newFinal = calculateFinalScore(updated.totalSkorA, newScoreB);
      const { grade, statusLabel } = determineGradeAndStatus(newFinal);
      updated.finalScore = newFinal;
      updated.grade = grade;
      updated.statusLabel = statusLabel;
      return updated;
    });

    onBatchUpdate(updatedList);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  // Filter list
  const filtered = assessments.filter((a) => {
    const matchesSearch =
      a.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.division.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.kpi1Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.kpi2Name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDiv = selectedDivision === 'ALL' || a.division === selectedDivision;
    return matchesSearch && matchesDiv;
  });

  const periodDateFormatted = assessments[0]?.assessmentDateFormatted ||
    (assessments[0]?.period ? getPeriodDateFormatted(assessments[0].period, true) : 'Kamis, 24 September 2026');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              3
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              Penilaian KPI Teknis & Target Kerja Bulanan (B)
            </h2>
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>{periodDateFormatted}</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Target KPI 1 dan KPI 2 otomatis diambil dari <strong>Master Data</strong> berdasarkan divisi karyawan &bull; Tanggal Penilaian: <strong>{periodDateFormatted}</strong>.
            Total Skor KPI Teknis berbobot 50% terhadap Nilai Akhir.
          </p>
        </div>

        {/* Quick batch presets */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleSetPresetKpi(8.5)}
            className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold border border-blue-200 transition"
            title="Set semua nilai KPI ke 8.5 (Target Tercapai)"
          >
            Set Target 8.5
          </button>
          <button
            onClick={() => handleSetPresetKpi(10.0)}
            className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold border border-emerald-200 transition"
            title="Set semua nilai KPI ke 10.0 (Melampaui Target)"
          >
            Set Maksimal 10.0
          </button>
        </div>
      </div>

      {saveToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Skor KPI dan Nilai Akhir telah berhasil dihitung ulang secara otomatis!</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nama karyawan, KPI, atau divisi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-600">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none font-medium"
          >
            <option value="ALL">Semua Divisi ({divisions.length})</option>
            {divisions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Sheet 3 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#1F4E78] text-white font-bold text-center border-b border-slate-300">
                <th className="py-2.5 px-3 text-left border border-slate-300 min-w-[160px] sticky left-0 bg-[#1F4E78] z-10">
                  Nama Karyawan
                </th>
                <th className="py-2.5 px-3 text-left border border-slate-300 min-w-[110px]">
                  Divisi
                </th>
                <th className="py-2.5 px-3 text-center border border-slate-300 min-w-[125px]">
                  Hari & Tanggal
                </th>
                <th className="py-2.5 px-3 text-left border border-slate-300 min-w-[200px]">
                  Nama KPI 1
                </th>
                <th className="py-2.5 px-2 text-center border border-slate-300 w-20">
                  Bobot 1
                </th>
                <th className="py-2.5 px-2 text-center border border-slate-300 w-24 bg-blue-900/60">
                  Skor KPI 1<br />
                  <span className="text-[10px] font-normal text-blue-200">(1-10)</span>
                </th>
                <th className="py-2.5 px-3 text-left border border-slate-300 min-w-[200px]">
                  Nama KPI 2
                </th>
                <th className="py-2.5 px-2 text-center border border-slate-300 w-20">
                  Bobot 2
                </th>
                <th className="py-2.5 px-2 text-center border border-slate-300 w-24 bg-blue-900/60">
                  Skor KPI 2<br />
                  <span className="text-[10px] font-normal text-blue-200">(1-10)</span>
                </th>
                <th className="py-2.5 px-3 text-center border border-slate-300 min-w-[120px] bg-[#16365C] text-emerald-300">
                  Total Skor B<br />
                  <span className="text-[10px] font-normal text-slate-300">(Max 10.00)</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition border-b border-slate-200">
                  {/* Nama */}
                  <td className="py-2.5 px-3 font-semibold text-slate-900 border border-slate-200 sticky left-0 bg-white z-10">
                    <div>{item.employeeName}</div>
                    <div className="text-[10px] font-normal text-slate-400 font-mono">{item.employeeNik}</div>
                  </td>

                  {/* Divisi */}
                  <td className="py-2.5 px-3 text-slate-700 border border-slate-200">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-[11px] font-medium">
                      {item.division}
                    </span>
                  </td>

                  {/* Hari & Tanggal Penilaian */}
                  <td className="py-2.5 px-3 border border-slate-200">
                    <div className="flex items-center space-x-1">
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[10px] font-bold">
                        {item.dayName || 'Kamis'}
                      </span>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {item.day || 24} {item.monthName?.slice(0, 3) || 'Sep'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {item.year || 2026}
                    </div>
                  </td>

                  {/* KPI 1 Name */}
                  <td className="py-2.5 px-3 text-slate-800 border border-slate-200">
                    <div className="font-medium text-slate-900">{item.kpi1Name}</div>
                    <input
                      type="text"
                      placeholder="Catatan pencapaian target..."
                      value={item.kpi1Note || ''}
                      onChange={(e) => handleScoreChange(item, 1, item.kpi1Score, e.target.value)}
                      className="mt-1 w-full text-[11px] px-2 py-0.5 border border-slate-200 rounded text-slate-600 focus:outline-none focus:border-blue-400 bg-slate-50/50"
                    />
                  </td>

                  {/* Bobot 1 */}
                  <td className="py-2.5 px-2 text-center font-mono font-semibold text-slate-600 border border-slate-200">
                    {(item.kpi1Weight * 100).toFixed(0)}%
                  </td>

                  {/* Skor KPI 1 (1-10) */}
                  <td className="py-2.5 px-2 text-center border border-slate-200 bg-blue-50/40">
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.5"
                      value={item.kpi1Score}
                      onChange={(e) =>
                        handleScoreChange(item, 1, parseFloat(e.target.value) || 0)
                      }
                      className="w-16 text-center py-1 border border-slate-300 rounded font-mono font-bold text-slate-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </td>

                  {/* KPI 2 Name */}
                  <td className="py-2.5 px-3 text-slate-800 border border-slate-200">
                    <div className="font-medium text-slate-900">{item.kpi2Name}</div>
                    <input
                      type="text"
                      placeholder="Catatan pencapaian target..."
                      value={item.kpi2Note || ''}
                      onChange={(e) => handleScoreChange(item, 2, item.kpi2Score, e.target.value)}
                      className="mt-1 w-full text-[11px] px-2 py-0.5 border border-slate-200 rounded text-slate-600 focus:outline-none focus:border-blue-400 bg-slate-50/50"
                    />
                  </td>

                  {/* Bobot 2 */}
                  <td className="py-2.5 px-2 text-center font-mono font-semibold text-slate-600 border border-slate-200">
                    {(item.kpi2Weight * 100).toFixed(0)}%
                  </td>

                  {/* Skor KPI 2 (1-10) */}
                  <td className="py-2.5 px-2 text-center border border-slate-200 bg-blue-50/40">
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.5"
                      value={item.kpi2Score}
                      onChange={(e) =>
                        handleScoreChange(item, 2, parseFloat(e.target.value) || 0)
                      }
                      className="w-16 text-center py-1 border border-slate-300 rounded font-mono font-bold text-slate-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </td>

                  {/* Total Skor B (Calculated) */}
                  <td className="py-2.5 px-3 text-center border border-slate-300 font-mono font-bold text-blue-900 bg-blue-50 text-sm">
                    {item.totalSkorB.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
