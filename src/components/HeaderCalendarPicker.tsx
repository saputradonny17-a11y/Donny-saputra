import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import {
  INDONESIAN_DAYS,
  INDONESIAN_MONTHS,
  parseAssessmentDate,
  getIndonesianMonthName
} from '../utils/assessmentDatabase';

interface Props {
  selectedDate: string; // Format: "YYYY-MM-DD", e.g. "2026-09-24"
  onSelectDate: (dateStr: string) => void;
  availablePeriods?: string[];
  isHrMode?: boolean;
}

export const HeaderCalendarPicker: React.FC<Props> = ({
  selectedDate,
  onSelectDate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse currently active selected date
  const parsedActive = parseAssessmentDate(selectedDate);

  // View state for navigating calendar month & year
  const [viewYear, setViewYear] = useState<number>(parsedActive.year || 2026);
  const [viewMonth, setViewMonth] = useState<number>(parsedActive.month || 9); // 1 - 12

  // Sync view when selectedDate changes externally
  useEffect(() => {
    const p = parseAssessmentDate(selectedDate);
    setViewYear(p.year);
    setViewMonth(p.month);
  }, [selectedDate]);

  // Click outside listener to close calendar popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Calculate days in the viewMonth of viewYear
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  // Day of week of the 1st day of month (0 = Sunday, 1 = Monday, ...)
  const firstDayOfWeek = new Date(viewYear, viewMonth - 1, 1).getDay();

  // Navigation handlers
  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (dayNum: number) => {
    const mm = String(viewMonth).padStart(2, '0');
    const dd = String(dayNum).padStart(2, '0');
    const formatted = `${viewYear}-${mm}-${dd}`;
    onSelectDate(formatted);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const today = '2026-09-24';
    onSelectDate(today);
    const p = parseAssessmentDate(today);
    setViewYear(p.year);
    setViewMonth(p.month);
    setIsOpen(false);
  };

  const handleSelectYesterday = () => {
    const yesterday = '2026-09-23';
    onSelectDate(yesterday);
    const p = parseAssessmentDate(yesterday);
    setViewYear(p.year);
    setViewMonth(p.month);
    setIsOpen(false);
  };

  // Generate Year options (2020 - 2030)
  const yearOptions = Array.from({ length: 11 }, (_, i) => 2020 + i);

  // Short day labels: Min, Sen, Sel, Rab, Kam, Jum, Sab
  const shortDayLabels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Calendar Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700/90 text-white rounded-lg px-2.5 py-1.5 border border-slate-700 shadow-sm transition cursor-pointer select-none group"
        title="Buka Kalender Interaktif: Pilih Tanggal, Bulan & Tahun Penilaian"
      >
        <div className="w-6 h-6 rounded-md bg-blue-600/30 border border-blue-500/40 flex items-center justify-center shrink-0">
          <CalendarIcon className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
        </div>
        <div className="text-left leading-tight pr-1">
          <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
            <span>Kalender Evaluasi</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="text-xs font-bold text-white flex items-center gap-1.5 whitespace-nowrap">
            <span>
              {parsedActive.dayName}, {parsedActive.day} {parsedActive.monthName} {parsedActive.year}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-blue-400' : ''
              }`}
            />
          </div>
        </div>
      </button>

      {/* Calendar Popover / Dropdown Dialog */}
      {isOpen && (
        <div
          className="absolute right-0 sm:left-0 sm:right-auto mt-2 w-[320px] sm:w-[350px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150 text-white font-sans"
          style={{ top: '100%' }}
        >
          {/* Header Controls: Bulan & Tahun Dropdown + Prev/Next Arrows */}
          <div className="flex items-center justify-between gap-1 pb-3 mb-3 border-b border-slate-800">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-1.5 flex-1 justify-center">
              {/* Select Bulan */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                {INDONESIAN_MONTHS.map((m, idx) => (
                  <option key={m} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>

              {/* Select Tahun */}
              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Interactive Calendar Table (Tabel Kalender) */}
          <div className="mb-3">
            {/* Day of Week Header row */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1 text-[11px] font-semibold text-slate-400">
              {shortDayLabels.map((lbl, idx) => (
                <div
                  key={lbl}
                  className={`py-1 ${
                    idx === 0
                      ? 'text-red-400'
                      : idx === 6
                      ? 'text-amber-400'
                      : 'text-slate-300'
                  }`}
                >
                  {lbl}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {/* Empty leading cells */}
              {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-8 rounded-lg" />
              ))}

              {/* Day cells 1 .. daysInMonth */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const mm = String(viewMonth).padStart(2, '0');
                const dd = String(dayNum).padStart(2, '0');
                const cellDate = `${viewYear}-${mm}-${dd}`;
                const isSelected = cellDate === selectedDate;
                const isToday = cellDate === '2026-09-24';
                const dayOfWeek = (firstDayOfWeek + idx) % 7;
                const isSunday = dayOfWeek === 0;

                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => handleSelectDay(dayNum)}
                    className={`h-8 w-full rounded-lg font-semibold flex items-center justify-center transition cursor-pointer relative group ${
                      isSelected
                        ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-500/40 ring-2 ring-blue-400'
                        : isToday
                        ? 'bg-blue-950/70 border border-blue-500/50 text-blue-200 hover:bg-slate-700'
                        : isSunday
                        ? 'text-red-400 hover:bg-slate-800'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span>{dayNum}</span>
                    {isToday && !isSelected && (
                      <span className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Presets & Direct Date Selector */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleSelectToday}
                className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] font-semibold text-slate-200 border border-slate-700 transition cursor-pointer flex items-center justify-center space-x-1"
              >
                <Sparkles className="w-3 h-3 text-blue-400" />
                <span>Hari Ini (24 Sep)</span>
              </button>
              <button
                type="button"
                onClick={handleSelectYesterday}
                className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] font-semibold text-slate-200 border border-slate-700 transition cursor-pointer flex items-center justify-center space-x-1"
              >
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Kemarin (23 Sep)</span>
              </button>
            </div>

            {/* Direct Native Date Input */}
            <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-xl border border-slate-800 text-[11px]">
              <span className="text-slate-400 font-medium">Input Langsung:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) {
                    onSelectDate(e.target.value);
                  }
                }}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-0.5 text-xs text-white font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
              />
            </div>

            {/* Selected Date Summary Indicator */}
            <div className="px-2 py-1.5 bg-blue-950/40 border border-blue-500/20 rounded-lg text-[11px] text-blue-300 flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="truncate">
                Aktif: <strong>{parsedActive.dayName}, {parsedActive.day} {parsedActive.monthName} {parsedActive.year}</strong>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
