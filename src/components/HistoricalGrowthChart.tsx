import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  Calendar,
  CheckCircle2,
  Filter,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { MonthHistoricalMetric } from '../utils/historicalAnalytics';

interface Props {
  historicalData: MonthHistoricalMetric[];
  currentPeriod: string;
  onSelectPeriod: (period: string) => void;
  availableDivisions: string[];
  selectedDivision: string;
  onDivisionChange: (division: string) => void;
}

export const HistoricalGrowthChart: React.FC<Props> = ({
  historicalData,
  currentPeriod,
  onSelectPeriod,
  availableDivisions,
  selectedDivision,
  onDivisionChange,
}) => {
  const [chartType, setChartType] = useState<'trend' | 'distribution' | 'component'>('trend');

  // Find current and previous month metrics for quick stats
  const activeMetric = historicalData.find((m) => m.period === currentPeriod) || historicalData[historicalData.length - 1];
  const firstMetric = historicalData[0];
  const overallGrowth = activeMetric && firstMetric && firstMetric.avgFinalScore > 0
    ? Number((activeMetric.avgFinalScore - firstMetric.avgFinalScore).toFixed(2))
    : 0;
  const overallGrowthPct = activeMetric && firstMetric && firstMetric.avgFinalScore > 0
    ? Number((((activeMetric.avgFinalScore - firstMetric.avgFinalScore) / firstMetric.avgFinalScore) * 100).toFixed(1))
    : 0;

  // Custom Tooltip for Trend
  const CustomTrendTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint: MonthHistoricalMetric = payload[0].payload;
      const isSelected = dataPoint.period === currentPeriod;
      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs min-w-[220px]">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="font-bold text-slate-200">{dataPoint.label}</span>
            {isSelected && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300 font-semibold border border-blue-400/30">
                Periode Aktif
              </span>
            )}
          </div>
          <div className="space-y-1.5 font-mono">
            <div className="flex justify-between items-center text-emerald-400 font-bold">
              <span className="font-sans text-slate-300">Nilai Akhir Rata-rata:</span>
              <span className="text-sm">{dataPoint.avgFinalScore.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-blue-300">
              <span className="font-sans text-slate-400">Skor Sikap (A - 50%):</span>
              <span>{dataPoint.avgScoreA.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-indigo-300">
              <span className="font-sans text-slate-400">Skor KPI (B - 50%):</span>
              <span>{dataPoint.avgScoreB.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300 pt-1.5 border-t border-slate-800 font-sans">
              <span>Total Karyawan:</span>
              <span className="font-mono font-bold text-white">{dataPoint.totalEmployees} Orang</span>
            </div>
            {dataPoint.momGrowthDelta !== 0 && (
              <div className="flex justify-between items-center pt-1 font-sans text-[11px]">
                <span className="text-slate-400">Pertumbuhan MoM:</span>
                <span className={dataPoint.momGrowthDelta > 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {dataPoint.momGrowthDelta > 0 ? `+${dataPoint.momGrowthDelta}` : dataPoint.momGrowthDelta} ({dataPoint.momGrowthPercent > 0 ? `+${dataPoint.momGrowthPercent}%` : `${dataPoint.momGrowthPercent}%`})
                </span>
              </div>
            )}
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 text-center italic">
            Klik titik untuk membuka periode ini
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Grade Distribution
  const CustomDistTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint: MonthHistoricalMetric = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs min-w-[200px]">
          <div className="font-bold text-slate-200 pb-2 mb-2 border-b border-slate-800">
            {dataPoint.label} (Total {dataPoint.totalEmployees} Orang)
          </div>
          <div className="space-y-1.5 font-mono">
            <div className="flex justify-between text-emerald-400">
              <span className="font-sans">Sangat Baik (A):</span>
              <span>{dataPoint.gradeA} orang</span>
            </div>
            <div className="flex justify-between text-blue-400">
              <span className="font-sans">Baik (B):</span>
              <span>{dataPoint.gradeB} orang</span>
            </div>
            <div className="flex justify-between text-amber-400">
              <span className="font-sans">Cukup (C):</span>
              <span>{dataPoint.gradeC} orang</span>
            </div>
            <div className="flex justify-between text-orange-400">
              <span className="font-sans">Kurang (D):</span>
              <span>{dataPoint.gradeD} orang</span>
            </div>
            <div className="flex justify-between text-rose-400">
              <span className="font-sans">Sangat Kurang (E):</span>
              <span>{dataPoint.gradeE} orang</span>
            </div>
            <div className="pt-2 border-t border-slate-800 text-slate-300 font-sans flex justify-between font-bold">
              <span>Memenuhi Standar (A+B):</span>
              <span className="text-emerald-400">{dataPoint.pctGoodOrBetter}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">
      {/* Top Header & Interactive Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                Analisis Pertumbuhan Kinerja Organisasi (Multi-Bulan)
              </h3>
              <p className="text-xs text-slate-500">
                Visualisasi tren nilai rata-rata bulanan untuk memantau progres dan perbaikan kinerja secara transparan
              </p>
            </div>
          </div>
        </div>

        {/* Controls: Chart Type Selector & Division Filter */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Division Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDivision}
              onChange={(e) => onDivisionChange(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer font-medium text-slate-700"
            >
              <option value="ALL">Semua Divisi (Perusahaan)</option>
              {availableDivisions.map((div) => (
                <option key={div} value={div}>
                  Divisi {div}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle Buttons */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setChartType('trend')}
              className={`px-3 py-1 rounded-md font-semibold transition ${
                chartType === 'trend'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tren Nilai Akhir
            </button>
            <button
              onClick={() => setChartType('component')}
              className={`px-3 py-1 rounded-md font-semibold transition ${
                chartType === 'component'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sikap vs KPI
            </button>
            <button
              onClick={() => setChartType('distribution')}
              className={`px-3 py-1 rounded-md font-semibold transition ${
                chartType === 'distribution'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Distribusi Grade
            </button>
          </div>
        </div>
      </div>

      {/* Snapshot KPI Metrics Across Periods */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Metric 1: Nilai Rata-rata Terkini */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Rata-rata Terkini ({activeMetric?.shortLabel || currentPeriod})
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {activeMetric?.avgFinalScore.toFixed(2) || '0.00'}
            </span>
            <span className="text-xs text-slate-400 font-sans">/ 10.00</span>
          </div>
          <div className="flex items-center text-[11px] mt-1.5">
            {activeMetric && activeMetric.momGrowthDelta >= 0 ? (
              <span className="text-emerald-700 font-semibold flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                +{activeMetric.momGrowthDelta} pts ({activeMetric.momGrowthPercent > 0 ? `+${activeMetric.momGrowthPercent}%` : '0%'}) MoM
              </span>
            ) : (
              <span className="text-rose-700 font-semibold flex items-center">
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                {activeMetric?.momGrowthDelta} pts ({activeMetric?.momGrowthPercent}%) MoM
              </span>
            )}
          </div>
        </div>

        {/* Metric 2: Pertumbuhan Kumulatif */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Pertumbuhan Total ({firstMetric?.shortLabel} &rarr; {activeMetric?.shortLabel})
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className={`text-2xl font-black font-mono ${overallGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {overallGrowth >= 0 ? `+${overallGrowth}` : overallGrowth}
            </span>
            <span className="text-xs text-slate-500 font-sans">
              ({overallGrowthPct >= 0 ? `+${overallGrowthPct}%` : `${overallGrowthPct}%`})
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 truncate">
            {overallGrowth >= 0 ? 'Tren pertumbuhan positif' : 'Perlu evaluasi berkala'}
          </p>
        </div>

        {/* Metric 3: Standar Kinerja Terpenuhi */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Memenuhi Standar (Grade A & B)
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-blue-700 font-mono">
              {activeMetric?.pctGoodOrBetter || 0}%
            </span>
            <span className="text-xs text-slate-400 font-sans">dari total</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 flex items-center">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 mr-1" />
            <span>{(activeMetric?.gradeA || 0) + (activeMetric?.gradeB || 0)} dari {activeMetric?.totalEmployees || 0} Karyawan</span>
          </p>
        </div>

        {/* Metric 4: Divisi Teratas Periode Ini */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Divisi Terunggul
          </span>
          <div className="text-sm font-bold text-slate-900 mt-1 truncate" title={activeMetric?.topDivisionName}>
            {activeMetric?.topDivisionName || '-'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 font-mono">
            Rata-rata: <strong className="text-indigo-700 font-bold">{activeMetric?.topDivisionScore.toFixed(2) || '0.00'}</strong> / 10
          </p>
        </div>
      </div>

      {/* Main Chart Container */}
      <div className="bg-slate-50/60 rounded-xl p-3 sm:p-4 border border-slate-200">
        <div className="flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-600 font-semibold">
            {chartType === 'trend' && <span>Tren Nilai Akhir Gabungan (Skala 1 - 10)</span>}
            {chartType === 'component' && <span>Komparasi Skor Sikap/Absensi (A) vs Target KPI (B)</span>}
            {chartType === 'distribution' && <span>Komposisi Jumlah Karyawan per Kategori Grade</span>}
          </div>
          <div className="text-[11px] text-slate-500 hidden sm:block">
            Target Sangat Baik: <strong>&ge; 8.50</strong> &bull; Standar Baik: <strong>7.00 - 8.49</strong>
          </div>
        </div>

        <div className="w-full h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'trend' ? (
              <AreaChart
                data={historicalData}
                margin={{ top: 10, right: 25, left: -15, bottom: 5 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length) {
                    onSelectPeriod(e.activePayload[0].payload.period);
                  }
                }}
              >
                <defs>
                  <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="shortLabel"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  dy={6}
                />
                <YAxis
                  domain={[5.0, 10.0]}
                  ticks={[5.0, 6.0, 7.0, 8.0, 8.5, 9.0, 10.0]}
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  dx={-4}
                />
                <Tooltip content={<CustomTrendTooltip />} />
                <ReferenceLine
                  y={8.5}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Target Sangat Baik (8.50)',
                    fill: '#059669',
                    fontSize: 10,
                    position: 'insideTopRight',
                  }}
                />
                <ReferenceLine
                  y={7.0}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Batas Baik (7.00)',
                    fill: '#d97706',
                    fontSize: 10,
                    position: 'insideBottomRight',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="avgFinalScore"
                  name="Nilai Akhir Rata-rata"
                  stroke="#1d4ed8"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#growthGradient)"
                  activeDot={{
                    r: 6,
                    fill: '#1d4ed8',
                    stroke: '#ffffff',
                    strokeWidth: 2,
                    className: 'cursor-pointer',
                  }}
                  dot={{
                    r: 4,
                    fill: '#1d4ed8',
                    strokeWidth: 2,
                    stroke: '#ffffff',
                  }}
                />
              </AreaChart>
            ) : chartType === 'component' ? (
              <LineChart
                data={historicalData}
                margin={{ top: 10, right: 25, left: -15, bottom: 5 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length) {
                    onSelectPeriod(e.activePayload[0].payload.period);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="shortLabel" stroke="#64748b" fontSize={11} tickLine={false} dy={6} />
                <YAxis domain={[5.0, 10.0]} stroke="#64748b" fontSize={11} tickLine={false} dx={-4} />
                <Tooltip content={<CustomTrendTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  wrapperStyle={{ fontSize: '11px', fontWeight: 600 }}
                />
                <Line
                  type="monotone"
                  dataKey="avgScoreA"
                  name="Skor Sikap & Absensi (A - 50%)"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  strokeDasharray="5 3"
                  dot={{ r: 4, fill: '#4f46e5' }}
                />
                <Line
                  type="monotone"
                  dataKey="avgScoreB"
                  name="Skor KPI Teknis (B - 50%)"
                  stroke="#0891b2"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#0891b2' }}
                />
                <Line
                  type="monotone"
                  dataKey="avgFinalScore"
                  name="Nilai Akhir Gabungan (1-10)"
                  stroke="#16a34a"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#16a34a' }}
                />
              </LineChart>
            ) : (
              <BarChart
                data={historicalData}
                margin={{ top: 10, right: 25, left: -15, bottom: 5 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length) {
                    onSelectPeriod(e.activePayload[0].payload.period);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="shortLabel" stroke="#64748b" fontSize={11} tickLine={false} dy={6} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} dx={-4} />
                <Tooltip content={<CustomDistTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  wrapperStyle={{ fontSize: '11px', fontWeight: 600 }}
                />
                <Bar dataKey="gradeA" name="Sangat Baik (A)" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="gradeB" name="Baik (B)" fill="#3b82f6" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="gradeC" name="Cukup (C)" fill="#f59e0b" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="gradeD" name="Kurang (D)" fill="#f97316" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="gradeE" name="Sangat Kurang (E)" fill="#ef4444" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Quick Month Selector Buttons */}
        <div className="pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="text-slate-500 flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Klik periode untuk beralih data:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {historicalData.map((item) => {
              const isActive = item.period === currentPeriod;
              return (
                <button
                  key={item.period}
                  onClick={() => onSelectPeriod(item.period)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition border ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>{item.shortLabel}</span>
                  <span className="ml-1.5 font-mono text-[11px] opacity-90">
                    ({item.avgFinalScore.toFixed(2)})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
