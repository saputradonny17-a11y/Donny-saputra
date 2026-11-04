import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  Trophy,
  Award,
  Crown,
  TrendingUp,
  Sparkles,
  Filter,
  Eye,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { MonthlyAssessment, Employee, MasterKPIRecord } from '../types';
import {
  computeTop5PerformersTrend,
  TopPerformerEmployee
} from '../utils/historicalAnalytics';

interface Props {
  currentPeriod: string;
  assessments: MonthlyAssessment[];
  employees: Employee[];
  masterList: MasterKPIRecord[];
  availableDivisions: string[];
  onSelectAssessment: (assessment: MonthlyAssessment) => void;
}

export const TopPerformersTrendChart: React.FC<Props> = ({
  currentPeriod,
  assessments,
  employees,
  masterList,
  availableDivisions,
  onSelectAssessment
}) => {
  const [selectedDivision, setSelectedDivision] = useState<string>('ALL');
  const [metricType, setMetricType] = useState<'final' | 'sikap' | 'kpi'>('final');
  const [highlightedEmpId, setHighlightedEmpId] = useState<string | null>(null);

  // Compute top 5 performers trend data across 6 months
  const trendData = useMemo(() => {
    return computeTop5PerformersTrend(
      currentPeriod,
      employees,
      masterList,
      assessments,
      selectedDivision,
      metricType
    );
  }, [currentPeriod, employees, masterList, assessments, selectedDivision, metricType]);

  const { performers, chartData, periods, periodLabels, overallTopAvg, highestPerformerName, highestPerformerScore } = trendData;

  // Compute dynamic Y-axis min
  const yAxisMin = useMemo(() => {
    let min = 10;
    chartData.forEach((row) => {
      performers.forEach((p) => {
        const val = row[p.employeeId];
        if (typeof val === 'number' && val > 0 && val < min) {
          min = val;
        }
      });
    });
    return Math.max(5, Math.floor((min - 0.4) * 2) / 2);
  }, [chartData, performers]);

  // Format metric label
  const metricLabel = metricType === 'final'
    ? 'Nilai Akhir (Kombinasi 50% Sikap + 50% KPI)'
    : metricType === 'sikap'
    ? 'Skor Sikap Kerja (A - 50%)'
    : 'Skor Pencapaian KPI Teknis (B - 50%)';

  // Custom Rich Tooltip
  const CustomTalentTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const dataPoint = payload[0]?.payload;
    const fullMonthLabel = dataPoint?.fullLabel || label;

    return (
      <div className="bg-slate-950/95 text-white p-3.5 rounded-xl shadow-2xl border border-slate-700/80 text-xs min-w-[260px] backdrop-blur-md">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
          <div className="flex items-center space-x-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold text-slate-100">{fullMonthLabel}</span>
          </div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            Top 5 Performers
          </span>
        </div>

        <div className="space-y-2">
          {payload
            .sort((a: any, b: any) => (b.value || 0) - (a.value || 0))
            .map((entry: any) => {
              const emp = performers.find((p) => p.employeeId === entry.dataKey);
              if (!emp) return null;
              const isHighlighted = highlightedEmpId === emp.employeeId;

              return (
                <div
                  key={entry.dataKey}
                  className={`flex items-center justify-between py-1 px-1.5 rounded transition ${
                    isHighlighted ? 'bg-slate-800 ring-1 ring-white/20' : ''
                  }`}
                >
                  <div className="flex items-center space-x-2 min-w-0 pr-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-slate-400 font-mono text-[11px] shrink-0">
                      #{emp.rank}
                    </span>
                    <div className="truncate">
                      <span className="font-semibold text-slate-200 truncate block">
                        {emp.employeeName}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {emp.division}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className="font-mono font-bold text-sm block"
                      style={{ color: entry.color }}
                    >
                      {Number(entry.value).toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] text-slate-400 text-center">
          Klik kartu talenta di bawah untuk melihat rapor lengkap
        </div>
      </div>
    );
  };

  const firstMonthLabel = periodLabels[0]?.label || '';
  const lastMonthLabel = periodLabels[periodLabels.length - 1]?.label || '';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Card Header & Controls */}
      <div className="p-5 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-amber-50/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1 font-bold text-amber-700">
                <Crown className="w-3.5 h-3.5 text-amber-600" />
                Talent Recognition & High Performer Trajectory
              </span>
              <span aria-hidden="true">·</span>
              <span>Tren 6 Bulan Terakhir ({firstMonthLabel} &ndash; {lastMonthLabel})</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Tren Kinerja 5 Karyawan Terbaik</span>
              {selectedDivision !== 'ALL' && (
                <span className="text-sm font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                  Divisi {selectedDivision}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Memantau konsistensi pencapaian skor 5 karyawan berprestasi tertinggi selama 6 bulan terakhir untuk memfasilitasi nominasi promosi, bonus apresiasi, dan program retensi talenta terbaik.
            </p>
          </div>

          {/* Interactive Metric & Division Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Division Filter */}
            <div className="flex items-center space-x-1.5 text-xs text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer font-medium text-slate-700 text-xs"
              >
                <option value="ALL">Semua Divisi (Top Perusahaan)</option>
                {availableDivisions.map((div) => (
                  <option key={div} value={div}>
                    Divisi {div}
                  </option>
                ))}
              </select>
            </div>

            {/* Metric Segmented Control */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMetricType('final')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  metricType === 'final'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Nilai Akhir
              </button>
              <button
                type="button"
                onClick={() => setMetricType('sikap')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  metricType === 'sikap'
                    ? 'bg-white text-blue-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sikap (A)
              </button>
              <button
                type="button"
                onClick={() => setMetricType('kpi')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  metricType === 'kpi'
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                KPI (B)
              </button>
            </div>
          </div>
        </div>

        {/* Quick Highlights Summary Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-200/80">
          <div className="bg-white/80 p-3 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Peringkat #1 Teratas
            </span>
            <div className="mt-1 flex items-baseline gap-1.5 truncate">
              <span className="text-sm font-bold text-slate-900 truncate">
                {highestPerformerName}
              </span>
              <span className="text-xs font-mono font-black text-blue-600 tabular-nums">
                ({highestPerformerScore.toFixed(2)})
              </span>
            </div>
          </div>

          <div className="bg-white/80 p-3 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Rata-rata Skor Top 5
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-base font-black text-slate-900 font-mono tabular-nums">
                {overallTopAvg.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400">/ 10.00</span>
            </div>
          </div>

          <div className="bg-white/80 p-3 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Standar Nilai Grade A
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-base font-bold text-emerald-600 font-mono tabular-nums">
                &ge; 8.50
              </span>
              <span className="text-xs text-emerald-700 font-medium">Sangat Baik</span>
            </div>
          </div>

          <div className="bg-white/80 p-3 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Fokus Metrik
            </span>
            <div className="mt-1 text-xs font-semibold text-slate-700 truncate">
              {metricType === 'final' ? 'Kombinasi Sikap & KPI' : metricType === 'sikap' ? 'Aspek Sikap Kerja' : 'Pencapaian Target KPI'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700">Grafik Garis Perkembangan:</span>
            <span>{metricLabel}</span>
          </div>
          <div className="flex items-center space-x-2 text-[11px]">
            <span className="inline-block w-4 h-0.5 bg-emerald-500 border-t border-dashed border-emerald-500"></span>
            <span className="text-emerald-700 font-medium">Garis Ambang Grade A (8.50)</span>
          </div>
        </div>

        {performers.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
            <Award className="w-8 h-8 mb-2 text-slate-300" />
            <span>Tidak ada data penilaian untuk divisi terpilih.</span>
          </div>
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 15, right: 20, left: -10, bottom: 5 }}
                onMouseLeave={() => setHighlightedEmpId(null)}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#64748B"
                  fontSize={12}
                  tickLine={false}
                  dy={6}
                />
                <YAxis
                  domain={[yAxisMin, 10]}
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  dx={-2}
                  tickFormatter={(val) => val.toFixed(1)}
                />
                <ReferenceLine
                  y={8.5}
                  stroke="#10B981"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: 'Ambang Grade A (8.50)',
                    fill: '#059669',
                    fontSize: 10,
                    position: 'insideBottomRight'
                  }}
                />
                <Tooltip content={<CustomTalentTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: 16, fontSize: 12 }}
                  onMouseEnter={(o) => setHighlightedEmpId(String(o.dataKey))}
                  onMouseLeave={() => setHighlightedEmpId(null)}
                />

                {performers.map((emp) => {
                  const isHighlighted = highlightedEmpId === emp.employeeId;
                  const isDimmed = highlightedEmpId !== null && !isHighlighted;

                  return (
                    <Line
                      key={emp.employeeId}
                      type="monotone"
                      dataKey={emp.employeeId}
                      name={`#${emp.rank} ${emp.employeeName}`}
                      stroke={emp.color}
                      strokeWidth={isHighlighted ? 4 : isDimmed ? 1.5 : 2.5}
                      strokeOpacity={isDimmed ? 0.3 : 1}
                      dot={{
                        r: isHighlighted ? 5.5 : 3.5,
                        fill: emp.color,
                        strokeWidth: 2,
                        stroke: '#FFFFFF'
                      }}
                      activeDot={{
                        r: 7,
                        stroke: emp.color,
                        strokeWidth: 3,
                        fill: '#FFFFFF'
                      }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Talent Recognition Cards (Top 5 Performers Grid) */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>Daftar 5 Karyawan Berkinerja Terbaik Periode Ini</span>
            </h4>
            <span className="text-[11px] text-slate-500">
              Sorot kartu untuk menonjolkan garis grafik
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {performers.map((emp) => {
              const isHighlighted = highlightedEmpId === emp.employeeId;
              const isPositiveMoM = emp.momChange > 0;
              const isNeutralMoM = emp.momChange === 0;

              return (
                <div
                  key={emp.employeeId}
                  onMouseEnter={() => setHighlightedEmpId(emp.employeeId)}
                  onMouseLeave={() => setHighlightedEmpId(null)}
                  className={`bg-white rounded-xl p-3.5 border transition-all duration-200 flex flex-col justify-between relative overflow-hidden cursor-pointer ${
                    isHighlighted
                      ? 'border-slate-800 shadow-md ring-2 ring-blue-500/20 -translate-y-0.5'
                      : 'border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  {/* Color Accent Indicator Strip */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: emp.color }}
                  />

                  <div>
                    {/* Top Row: Rank Badge & Division */}
                    <div className="flex items-center justify-between pt-0.5 mb-2">
                      <span
                        className="inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black text-white shadow-xs"
                        style={{ backgroundColor: emp.color }}
                      >
                        #{emp.rank}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {emp.division}
                      </span>
                    </div>

                    {/* Employee Identity */}
                    <div className="space-y-0.5">
                      <h5 className="font-bold text-slate-900 text-xs truncate" title={emp.employeeName}>
                        {emp.employeeName}
                      </h5>
                      <p className="text-[10px] text-slate-500 truncate" title={emp.position}>
                        {emp.position}
                      </p>
                      <p className="text-[9px] text-slate-400 font-mono">
                        {emp.employeeNik}
                      </p>
                    </div>

                    {/* Performance Score Metric */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[10px] text-slate-500">Skor Saat Ini:</span>
                        <div className="flex items-baseline gap-1 font-mono">
                          <span
                            className="text-lg font-black tabular-nums"
                            style={{ color: emp.color }}
                          >
                            {emp.currentScore.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-sans">
                            (Grade {emp.currentGrade})
                          </span>
                        </div>
                      </div>

                      {/* 6-Month Average & MoM Progression */}
                      <div className="mt-1 space-y-0.5 text-[10px] text-slate-500">
                        <div className="flex justify-between items-center">
                          <span>Rata-rata 6 Bln:</span>
                          <span className="font-mono font-semibold text-slate-700">
                            {emp.average6MonthScore.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span>Tren MoM:</span>
                          <span
                            className={`font-mono font-semibold flex items-center gap-0.5 ${
                              isPositiveMoM
                                ? 'text-emerald-600'
                                : isNeutralMoM
                                ? 'text-slate-500'
                                : 'text-rose-600'
                            }`}
                          >
                            {isPositiveMoM ? (
                              <ArrowUpRight className="w-3 h-3" />
                            ) : isNeutralMoM ? (
                              <Minus className="w-3 h-3" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3" />
                            )}
                            {isPositiveMoM ? `+${emp.momChange}` : `${emp.momChange}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action: Open Report Card */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAssessment(emp.currentAssessment);
                      }}
                      className="w-full py-1.5 px-2 bg-slate-900 hover:bg-blue-600 text-white rounded-lg text-[11px] font-semibold transition flex items-center justify-center gap-1 shadow-xs"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Rapor Penilaian</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
