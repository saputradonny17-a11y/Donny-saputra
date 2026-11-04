import React, { useState } from 'react';
import {
  CheckSquare,
  AlertTriangle,
  Info,
  Sparkles,
  Search,
  Filter,
  Save,
  RotateCcw,
  Sliders,
  Plus,
  ArrowRight,
  Database,
  Calendar,
} from 'lucide-react';
import { FrequentLateStatus, MasterAttitudeRecord, MonthlyAssessment } from '../types';
import {
  calculateDynamicScoreA,
  calculateFinalScore,
  determineGradeAndStatus,
  getCriterionScore
} from '../utils/calculations';
import { getPeriodDateFormatted } from '../utils/assessmentDatabase';

interface Props {
  assessments: MonthlyAssessment[];
  masterAttitudeList: MasterAttitudeRecord[];
  onUpdateAssessment: (updated: MonthlyAssessment) => void;
  onBatchUpdate: (updatedList: MonthlyAssessment[]) => void;
  onNavigateMasterAttitude?: () => void;
}

export const AttitudeScoringView: React.FC<Props> = ({
  assessments,
  masterAttitudeList,
  onUpdateAssessment,
  onBatchUpdate,
  onNavigateMasterAttitude,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('ALL');
  const [saveToast, setSaveToast] = useState(false);

  // Active criteria from master data
  const activeCriteria = masterAttitudeList.filter((c) => c.enabled !== false);

  // Divisions list
  const divisions = Array.from(new Set(assessments.map((a) => a.division))).sort();

  const handleCriterionScoreChange = (
    item: MonthlyAssessment,
    criterionId: string,
    value: number
  ) => {
    const updated: MonthlyAssessment = {
      ...item,
      customAttitudeScores: {
        ...(item.customAttitudeScores || {}),
        [criterionId]: value,
      },
    };

    // If criterion matches a legacy field, keep it synced
    if (criterionId in updated) {
      (updated as any)[criterionId] = value;
    }

    // Recalculate dynamic Score A
    const newScoreA = calculateDynamicScoreA(activeCriteria, updated, updated.seringTelat);
    updated.totalSkorA = newScoreA;

    // Recalculate Final score & status
    const newFinalScore = calculateFinalScore(newScoreA, updated.totalSkorB);
    const { grade, statusLabel } = determineGradeAndStatus(newFinalScore);
    updated.finalScore = newFinalScore;
    updated.grade = grade;
    updated.statusLabel = statusLabel;
    updated.updatedAt = new Date().toISOString();

    onUpdateAssessment(updated);
  };

  const handleLateChange = (item: MonthlyAssessment, telatVal: FrequentLateStatus) => {
    const updated: MonthlyAssessment = {
      ...item,
      seringTelat: telatVal,
    };

    // Recalculate dynamic Score A
    const newScoreA = calculateDynamicScoreA(activeCriteria, updated, telatVal);
    updated.totalSkorA = newScoreA;

    const newFinalScore = calculateFinalScore(newScoreA, updated.totalSkorB);
    const { grade, statusLabel } = determineGradeAndStatus(newFinalScore);
    updated.finalScore = newFinalScore;
    updated.grade = grade;
    updated.statusLabel = statusLabel;
    updated.updatedAt = new Date().toISOString();

    onUpdateAssessment(updated);
  };

  const handleSetPresetAll = (scoreVal: number, telatVal: FrequentLateStatus = 'Tidak') => {
    const updatedList = assessments.map((item) => {
      const customScores: Record<string, number> = { ...(item.customAttitudeScores || {}) };

      // Set all active criteria to the preset score
      activeCriteria.forEach((c) => {
        customScores[c.id] = scoreVal;
      });

      const updated: MonthlyAssessment = {
        ...item,
        kerajinanAbsensi: scoreVal,
        izinKeluar: scoreVal,
        hindariKesalahanFatal: scoreVal,
        integritasKriminal: 10,
        sopanSantun: scoreVal,
        kerapihan: scoreVal,
        taatAturan: scoreVal,
        fokusKeberadaan: scoreVal,
        seringTelat: telatVal,
        customAttitudeScores: customScores,
      };

      const newScoreA = calculateDynamicScoreA(activeCriteria, updated, telatVal);
      updated.totalSkorA = newScoreA;

      const newFinal = calculateFinalScore(newScoreA, updated.totalSkorB);
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
      a.division.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDiv = selectedDivision === 'ALL' || a.division === selectedDivision;
    return matchesSearch && matchesDiv;
  });

  const periodDateFormatted = assessments[0]?.assessmentDateFormatted ||
    (assessments[0]?.period ? getPeriodDateFormatted(assessments[0].period, true) : 'Kamis, 24 September 2026');

  return (
    <div className="space-y-6">
      {/* Informative Header Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
              2
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              Penilaian Sikap, Kedisiplinan & Absensi (A)
            </h2>
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>{periodDateFormatted}</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Tabel penilaian terhubung langsung dengan <strong>Master Data Sikap ({activeCriteria.length} Kriteria)</strong> &bull; Tanggal Penilaian: <strong>{periodDateFormatted}</strong>.
            Nama kolom dan persentase dihitung otomatis sesuai konfigurasi master data. Total Skor Sikap berbobot 50% terhadap Nilai Akhir.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {onNavigateMasterAttitude && (
            <button
              type="button"
              onClick={onNavigateMasterAttitude}
              className="px-3.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold border border-blue-200 transition flex items-center space-x-1.5 shadow-xs"
              title="Buka Master Data untuk mengubah nama kolom, menambah kategori baru, atau sesuaikan persentase"
            >
              <Database className="w-3.5 h-3.5 text-blue-600" />
              <span>Kelola Master Data Sikap</span>
              <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSetPresetAll(9, 'Tidak')}
            className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold border border-slate-200 transition"
            title="Set semua nilai sikap ke baseline 9.0 (Disiplin)"
          >
            Baseline 9.0
          </button>
          <button
            type="button"
            onClick={() => handleSetPresetAll(10, 'Tidak')}
            className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-semibold border border-emerald-200 transition"
            title="Set semua nilai sikap ke 10.0 (Sempurna)"
          >
            Sempurna 10.0
          </button>
        </div>
      </div>

      {saveToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Nilai sikap dan kalkulasi otomatis berhasil diperbarui secara menyeluruh!</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nama karyawan atau divisi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-600">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none font-medium"
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

      {/* Dynamic Table Sheet 2 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#1F4E78] text-white font-bold text-center border-b border-slate-300">
                <th className="py-2.5 px-3 text-left border border-slate-300 min-w-[160px] sticky left-0 bg-[#1F4E78] z-10 shadow-sm">
                  Nama Karyawan
                </th>
                <th className="py-2.5 px-2.5 text-left border border-slate-300 min-w-[100px]">
                  Divisi
                </th>
                <th className="py-2.5 px-2.5 text-center border border-slate-300 min-w-[125px]">
                  Hari & Tanggal
                </th>

                {/* Dynamically Rendered Column Headers from Master Data */}
                {activeCriteria.map((criterion) => {
                  const percent = Math.round(criterion.weight * 100);
                  const penaltyPercent = criterion.penaltyWeight
                    ? Math.round(criterion.penaltyWeight * 100)
                    : undefined;

                  return (
                    <th
                      key={criterion.id}
                      className="py-2 px-2 border border-slate-300 min-w-[105px] max-w-[150px]"
                      title={criterion.description}
                    >
                      <div className="font-bold leading-tight truncate">{criterion.name}</div>
                      <span className="text-[10px] font-normal text-blue-200 font-mono block mt-0.5">
                        {criterion.isAttendancePenalty && penaltyPercent !== undefined
                          ? `(Max ${percent}% / ${penaltyPercent}%)`
                          : `(Max ${percent}%)`}
                      </span>
                    </th>
                  );
                })}

                {/* Sering Telat? Column */}
                <th className="py-2 px-2 border border-slate-300 min-w-[100px] bg-amber-800">
                  Sering Telat?<br />
                  <span className="text-[10px] font-normal text-amber-200">(Ya / Tidak)</span>
                </th>

                {/* Total Skor A Column */}
                <th className="py-2 px-3 border border-slate-300 min-w-[110px] bg-[#16365C] text-emerald-300">
                  Total Skor A<br />
                  <span className="text-[10px] font-normal text-slate-300">(Max 10.00)</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition border-b border-slate-200">
                  {/* Employee Name */}
                  <td className="py-2 px-3 font-sans font-semibold text-slate-900 border border-slate-200 sticky left-0 bg-white z-10">
                    <div className="leading-tight">{item.employeeName}</div>
                    <div className="text-[10px] font-normal text-slate-400 font-mono">{item.employeeNik}</div>
                  </td>

                  {/* Division */}
                  <td className="py-2 px-2.5 font-sans text-slate-700 border border-slate-200">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[11px]">
                      {item.division}
                    </span>
                  </td>

                  {/* Hari & Tanggal Penilaian */}
                  <td className="py-2 px-2.5 font-sans border border-slate-200">
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

                  {/* Dynamically Rendered Score Inputs for all active columns */}
                  {activeCriteria.map((criterion) => {
                    const score = getCriterionScore(item, criterion.id, criterion.defaultValue);

                    return (
                      <td key={criterion.id} className="py-1 px-1.5 text-center border border-slate-200">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.5"
                          value={score}
                          onChange={(e) =>
                            handleCriterionScoreChange(
                              item,
                              criterion.id,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-16 text-center py-1 border border-slate-200 rounded font-semibold text-slate-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </td>
                    );
                  })}

                  {/* Sering Telat? (Dropdown Ya / Tidak) */}
                  <td className="py-1 px-2 text-center border border-slate-200 font-sans">
                    <select
                      value={item.seringTelat}
                      onChange={(e) =>
                        handleLateChange(item, e.target.value as FrequentLateStatus)
                      }
                      className={`text-xs font-bold rounded px-2 py-1 border cursor-pointer ${
                        item.seringTelat === 'Ya'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      <option value="Tidak">Tidak</option>
                      <option value="Ya">Ya (Pinalti)</option>
                    </select>
                  </td>

                  {/* Total Skor A (Calculated) */}
                  <td className="py-2 px-3 text-center border border-slate-300 font-bold text-blue-900 bg-blue-50 text-sm">
                    {item.totalSkorA.toFixed(2)}
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
