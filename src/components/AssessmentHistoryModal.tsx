import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Search,
  Filter,
  Eye,
  X,
  Database,
  ArrowUpDown,
  FileSpreadsheet,
  CheckCircle2,
  CalendarCheck,
  Building,
  RotateCw,
  Sparkles,
  Download,
  UserCheck,
  Users
} from 'lucide-react';
import { Employee, MasterKPIRecord, MonthlyAssessment } from '../types';
import {
  getAllHistoricalAssessments,
  INDONESIAN_DAYS,
  INDONESIAN_MONTHS,
  parseAssessmentDate,
  savePeriodAssessments
} from '../utils/assessmentDatabase';
import { exportEmployeeHistoryToCSV } from '../utils/csvExport';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  availablePeriods: string[];
  employees: Employee[];
  masterList: MasterKPIRecord[];
  currentPeriod: string;
  currentAssessments: MonthlyAssessment[];
  onSelectAssessment: (assessment: MonthlyAssessment) => void;
  onUpdateAssessmentsDate?: (newDateStr: string) => void;
}

export const AssessmentHistoryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  availablePeriods,
  employees,
  masterList,
  currentPeriod,
  currentAssessments,
  onSelectAssessment,
  onUpdateAssessmentsDate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedDay, setSelectedDay] = useState<string>('ALL');
  const [selectedDayName, setSelectedDayName] = useState<string>('ALL');
  const [selectedDivision, setSelectedDivision] = useState<string>('ALL');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [batchDateInput, setBatchDateInput] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [feedbackToast, setFeedbackToast] = useState<string>('');

  // Sub-modal for selecting employee when clicking Export History without a pre-filtered employee
  const [isExportPickerOpen, setIsExportPickerOpen] = useState<boolean>(false);
  const [exportPickerSearch, setExportPickerSearch] = useState<string>('');

  // Collect all historical assessment records across periods from persistent database
  const allAssessments = useMemo(() => {
    return getAllHistoricalAssessments(availablePeriods, employees, masterList);
  }, [availablePeriods, employees, masterList, currentAssessments]);

  // Extract distinct years, months, divisions
  const years = useMemo(() => {
    const list = Array.from(
      new Set(allAssessments.map((a) => a.year || parseInt(a.period.split('-')[0], 10)))
    );
    return list.sort((a, b) => b - a);
  }, [allAssessments]);

  const divisions = useMemo(() => {
    const list = Array.from(new Set(allAssessments.map((a) => a.division)));
    return list.sort();
  }, [allAssessments]);

  // Filter assessments based on search and dropdowns
  const filteredAssessments = useMemo(() => {
    return allAssessments.filter((item) => {
      // Search
      const searchMatch =
        !searchTerm ||
        item.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.employeeNik.includes(searchTerm) ||
        item.division.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.dayName && item.dayName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.monthName && item.monthName.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!searchMatch) return false;

      // Employee filter
      if (selectedEmployeeId !== 'ALL') {
        if (item.employeeId !== selectedEmployeeId && item.employeeNik !== selectedEmployeeId) {
          return false;
        }
      }

      // Year filter
      if (selectedYear !== 'ALL') {
        const itemYear = String(item.year || item.period.split('-')[0]);
        if (itemYear !== selectedYear) return false;
      }

      // Month filter
      if (selectedMonth !== 'ALL') {
        const itemMonth = String(item.month || parseInt(item.period.split('-')[1], 10));
        if (itemMonth !== selectedMonth) return false;
      }

      // Tanggal (day of month 1-31) filter
      if (selectedDay !== 'ALL') {
        const itemDay = String(item.day || 24);
        if (itemDay !== selectedDay) return false;
      }

      // Day name filter
      if (selectedDayName !== 'ALL') {
        if (item.dayName !== selectedDayName) return false;
      }

      // Division filter
      if (selectedDivision !== 'ALL' && item.division !== selectedDivision) {
        return false;
      }

      // Grade filter
      if (selectedGrade !== 'ALL' && item.grade !== selectedGrade) {
        return false;
      }

      return true;
    });
  }, [
    allAssessments,
    searchTerm,
    selectedEmployeeId,
    selectedYear,
    selectedMonth,
    selectedDay,
    selectedDayName,
    selectedDivision,
    selectedGrade,
  ]);

  // Filtered employees for the Export History picker dialog
  const filteredEmployeesForExport = useMemo(() => {
    return employees.filter((emp) => {
      if (!exportPickerSearch) return true;
      const q = exportPickerSearch.toLowerCase();
      return (
        emp.name.toLowerCase().includes(q) ||
        emp.nik.toLowerCase().includes(q) ||
        emp.division.toLowerCase().includes(q) ||
        emp.position?.toLowerCase().includes(q)
      );
    });
  }, [employees, exportPickerSearch]);

  if (!isOpen) return null;

  const handleApplyBatchDate = () => {
    if (!batchDateInput) return;
    if (onUpdateAssessmentsDate) {
      onUpdateAssessmentsDate(batchDateInput);
      const parsed = parseAssessmentDate(batchDateInput, currentPeriod);
      setFeedbackToast(
        `Tanggal evaluasi untuk periode ${currentPeriod} diperbarui: ${parsed.assessmentDateFormatted}`
      );
      setShowDatePicker(false);
      setTimeout(() => setFeedbackToast(''), 4000);
    }
  };

  /**
   * Generates filter description text to include in CSV header metadata
   */
  const getActiveFilterSummary = () => {
    const filters: string[] = [];
    if (selectedYear !== 'ALL') filters.push(`Tahun: ${selectedYear}`);
    if (selectedMonth !== 'ALL') filters.push(`Bulan: ${selectedMonth}`);
    if (selectedDay !== 'ALL') filters.push(`Tanggal: ${selectedDay}`);
    if (selectedDayName !== 'ALL') filters.push(`Hari: ${selectedDayName}`);
    if (selectedDivision !== 'ALL') filters.push(`Divisi: ${selectedDivision}`);
    if (selectedGrade !== 'ALL') filters.push(`Grade: ${selectedGrade}`);
    if (searchTerm) filters.push(`Pencarian: "${searchTerm}"`);
    return filters.length > 0 ? filters.join(' | ') : 'Semua Periode';
  };

  /**
   * Triggers CSV download for a specific employee with their filtered historical assessments
   */
  const handleExportSpecificEmployee = (
    empId: string,
    empName?: string,
    empNik?: string,
    division?: string,
    position?: string
  ) => {
    const targetEmp = employees.find((e) => e.id === empId || e.nik === empNik) || {
      id: empId,
      name: empName || 'Karyawan',
      nik: empNik || '-',
      division: division || '-',
      position: position || '-',
    };

    // Filter historical records for this specific employee matching current active filters
    const matchingRecords = filteredAssessments.filter(
      (a) => a.employeeId === targetEmp.id || a.employeeNik === targetEmp.nik
    );

    // If active filters produced 0 records (e.g. conflicting month/year filter), fallback to all records for this employee
    const recordsToExport =
      matchingRecords.length > 0
        ? matchingRecords
        : allAssessments.filter(
            (a) => a.employeeId === targetEmp.id || a.employeeNik === targetEmp.nik
          );

    if (recordsToExport.length === 0) {
      setFeedbackToast(`Tidak ditemukan data riwayat evaluasi untuk ${targetEmp.name}.`);
      setTimeout(() => setFeedbackToast(''), 4000);
      return;
    }

    exportEmployeeHistoryToCSV(targetEmp, recordsToExport, getActiveFilterSummary());

    setFeedbackToast(
      `Berhasil mengekspor riwayat evaluasi CSV untuk ${targetEmp.name} (${recordsToExport.length} periode). File CSV sedang diunduh.`
    );
    setTimeout(() => setFeedbackToast(''), 4500);
  };

  /**
   * Main 'Export History' button handler
   */
  const handleExportHistoryClick = () => {
    // 1. If an employee is already specifically selected via dropdown filter
    if (selectedEmployeeId !== 'ALL') {
      handleExportSpecificEmployee(selectedEmployeeId);
      return;
    }

    // 2. If current filteredAssessments only belong to 1 unique employee (e.g. from search term)
    const uniqueEmployeesInView = Array.from(
      new Set(filteredAssessments.map((a) => a.employeeId || a.employeeNik))
    );

    if (uniqueEmployeesInView.length === 1 && filteredAssessments.length > 0) {
      const single = filteredAssessments[0];
      handleExportSpecificEmployee(
        single.employeeId,
        single.employeeName,
        single.employeeNik,
        single.division,
        single.position
      );
      return;
    }

    // 3. Otherwise, open the employee picker modal to let HR choose the specific employee
    setIsExportPickerOpen(true);
  };

  const getStatusBadge = (grade: string, label: string) => {
    switch (grade) {
      case 'A':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            A &bull; {label}
          </span>
        );
      case 'B':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            B &bull; {label}
          </span>
        );
      case 'C':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            C &bull; {label}
          </span>
        );
      case 'D':
      case 'E':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            {grade} &bull; {label}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            {grade}
          </span>
        );
    }
  };

  const selectedEmployeeObj = employees.find((e) => e.id === selectedEmployeeId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-6xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="bg-slate-900 dark:bg-slate-950 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <span>Riwayat Penilaian & Presensi Harian (Per Hari)</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {filteredAssessments.length} Catatan Harian
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Pengecekan riwayat historis performa karyawan per hari (tanggal, hari, presensi, sikap, & KPI harian)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Primary Header Export Button */}
            <button
              onClick={handleExportHistoryClick}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
              title="Download filtered historical data for a specific employee as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export History (CSV)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {feedbackToast && (
          <div className="bg-emerald-50 dark:bg-emerald-950/80 border-b border-emerald-200 dark:border-emerald-800 px-6 py-2.5 text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center space-x-2 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackToast}</span>
          </div>
        )}

        {/* Top Controls & Multi-Parameter Filter Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-3 shrink-0">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari karyawan, NIK, divisi, hari (mis. Kamis), atau bulan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            {/* Action Buttons: Export History & Quick Set Date */}
            <div className="flex items-center space-x-2 shrink-0">
              {/* Export History Button */}
              <button
                type="button"
                onClick={handleExportHistoryClick}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
                title="Unduh riwayat evaluasi performa karyawan terpilih ke file CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export History (CSV)</span>
                {selectedEmployeeObj && (
                  <span className="ml-1 px-1.5 py-0.2 rounded bg-emerald-800 text-[10px] font-bold">
                    {selectedEmployeeObj.name.split(' ')[0]}
                  </span>
                )}
              </button>

              {/* Quick Set Assessment Date for Active Period */}
              {onUpdateAssessmentsDate && (
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg font-semibold transition flex items-center space-x-1.5 cursor-pointer"
                  title="Ubah hari dan tanggal penilaian untuk periode aktif"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Ubah Tanggal ({currentPeriod})</span>
                </button>
              )}
            </div>
          </div>

          {/* Date Picker Input Row (when toggled) */}
          {showDatePicker && (
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-blue-200 dark:border-blue-800/80 flex flex-wrap items-center gap-3 text-xs animate-in fade-in duration-150">
              <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>Tetapkan Tanggal Evaluasi (Hari, Tanggal, Bulan, Tahun):</span>
              </span>
              <input
                type="date"
                value={batchDateInput || `${currentPeriod}-24`}
                onChange={(e) => setBatchDateInput(e.target.value)}
                className="px-2.5 py-1 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-800 dark:text-slate-100 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                onClick={handleApplyBatchDate}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition shadow-xs cursor-pointer"
              >
                Terapkan ke Periode Ini
              </button>
              <button
                onClick={() => setShowDatePicker(false)}
                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition hover:bg-slate-200 cursor-pointer"
              >
                Batal
              </button>
            </div>
          )}

          {/* Multi-Level Filtering: Karyawan, Tahun, Bulan, Hari, Divisi, Grade */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            {/* Filter Karyawan Spesifik */}
            <div className="flex items-center space-x-1">
              <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Karyawan:</span>
              </span>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className={`bg-white dark:bg-slate-800 border rounded-lg px-2 py-1 font-semibold focus:outline-none cursor-pointer max-w-[190px] truncate ${
                  selectedEmployeeId !== 'ALL'
                    ? 'border-emerald-500 text-emerald-800 dark:text-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/40'
                    : 'border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                <option value="ALL">Semua Karyawan ({employees.length})</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.nik})
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Tahun */}
            <div className="flex items-center space-x-1">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Tahun:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Tahun</option>
                {years.map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Bulan */}
            <div className="flex items-center space-x-1">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Bulan:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Bulan</option>
                {INDONESIAN_MONTHS.map((m, idx) => (
                  <option key={m} value={String(idx + 1)}>
                    {m} ({String(idx + 1).padStart(2, '0')})
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Tanggal (1-31) */}
            <div className="flex items-center space-x-1">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Tanggal:</span>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer"
                title="Filter berdasarkan tanggal (1 - 31)"
              >
                <option value="ALL">Semua Tgl</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={String(d)}>
                    Tgl {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Hari */}
            <div className="flex items-center space-x-1">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Hari:</span>
              <select
                value={selectedDayName}
                onChange={(e) => setSelectedDayName(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Hari</option>
                {INDONESIAN_DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Divisi */}
            <div className="flex items-center space-x-1">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Divisi:</span>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Divisi ({divisions.length})</option>
                {divisions.map((div) => (
                  <option key={div} value={div}>
                    {div}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Grade */}
            <div className="flex items-center space-x-1">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Grade:</span>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Grade</option>
                <option value="A">Grade A (Sangat Baik)</option>
                <option value="B">Grade B (Baik)</option>
                <option value="C">Grade C (Cukup)</option>
                <option value="D">Grade D (Kurang)</option>
                <option value="E">Grade E (Kritis/PHK)</option>
              </select>
            </div>

            {/* Reset Filter Button */}
            {(searchTerm ||
              selectedEmployeeId !== 'ALL' ||
              selectedYear !== 'ALL' ||
              selectedMonth !== 'ALL' ||
              selectedDay !== 'ALL' ||
              selectedDayName !== 'ALL' ||
              selectedDivision !== 'ALL' ||
              selectedGrade !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedEmployeeId('ALL');
                  setSelectedYear('ALL');
                  setSelectedMonth('ALL');
                  setSelectedDay('ALL');
                  setSelectedDayName('ALL');
                  setSelectedDivision('ALL');
                  setSelectedGrade('ALL');
                }}
                className="px-2 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* Historical Assessments Table */}
        <div className="p-4 overflow-y-auto flex-1">
          {filteredAssessments.length === 0 ? (
            <div className="py-16 text-center text-slate-400 dark:text-slate-500 space-y-2">
              <Calendar className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold">Tidak ditemukan riwayat penilaian yang sesuai.</p>
              <p className="text-xs">
                Coba sesuaikan kata kunci pencarian atau kombinasi filter karyawan, hari, bulan, dan tahun.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#1F4E78] text-white text-[11px] font-bold border-b border-slate-300">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-12 border border-slate-300">No</th>
                    <th className="py-2.5 px-3 border border-slate-300 min-w-[150px]">
                      Hari & Tanggal Penilaian
                    </th>
                    <th className="py-2.5 px-3 text-center border border-slate-300 min-w-[100px]">
                      Bulan & Tahun
                    </th>
                    <th className="py-2.5 px-3 border border-slate-300 min-w-[180px]">
                      Karyawan & Jabatan
                    </th>
                    <th className="py-2.5 px-3 border border-slate-300 min-w-[110px]">
                      Divisi
                    </th>
                    <th className="py-2.5 px-3 text-center border border-slate-300 min-w-[90px]">
                      Sikap (A)<br />
                      <span className="text-[10px] font-normal text-blue-200">50%</span>
                    </th>
                    <th className="py-2.5 px-3 text-center border border-slate-300 min-w-[90px]">
                      KPI (B)<br />
                      <span className="text-[10px] font-normal text-blue-200">50%</span>
                    </th>
                    <th className="py-2.5 px-3 text-center border border-slate-300 bg-[#16365C] min-w-[100px]">
                      NILAI AKHIR<br />
                      <span className="text-[10px] font-normal text-emerald-300">1-10</span>
                    </th>
                    <th className="py-2.5 px-3 text-center border border-slate-300 min-w-[140px]">
                      Kategori / Status
                    </th>
                    <th className="py-2.5 px-3 text-center border border-slate-300 w-32">
                      Aksi & Export
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {filteredAssessments.map((item, idx) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition border-b border-slate-200 dark:border-slate-800"
                    >
                      <td className="py-2.5 px-3 text-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                        {idx + 1}
                      </td>

                      {/* Hari & Tanggal Penilaian */}
                      <td className="py-2.5 px-3 font-sans border border-slate-200 dark:border-slate-800">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold border border-blue-200 dark:border-blue-900">
                            {item.dayName || 'Kamis'}
                          </span>
                          <span>
                            {item.day || 24} {item.monthName || 'Sep'} {item.year || 2026}
                          </span>
                        </div>
                        {item.dailyAttendanceStatus ? (
                          <div className="mt-1 flex items-center gap-1">
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                item.dailyAttendanceStatus === 'Hadir Tepat Waktu'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                                  : item.dailyAttendanceStatus === 'Terlambat'
                                  ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                                  : 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300'
                              }`}
                            >
                              {item.dailyAttendanceStatus}
                              {item.dailyAttendanceLateMinutes ? ` (${item.dailyAttendanceLateMinutes}m)` : ''}
                            </span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            ISO: {item.assessmentDate || `${item.period}-24`}
                          </div>
                        )}
                      </td>

                      {/* Bulan & Tahun */}
                      <td className="py-2.5 px-3 text-center font-sans border border-slate-200 dark:border-slate-800 whitespace-nowrap">
                        <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                          {item.monthName || 'September'} {item.year || 2026}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Periode: {item.period}
                        </div>
                      </td>

                      {/* Karyawan & Posisi */}
                      <td className="py-2.5 px-3 font-sans border border-slate-200 dark:border-slate-800">
                        <div className="font-bold text-slate-900 dark:text-white">{item.employeeName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          NIK: {item.employeeNik} &bull; {item.position}
                        </div>
                        {item.dailyNote && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 italic mt-0.5 line-clamp-1" title={item.dailyNote}>
                            &ldquo;{item.dailyNote}&rdquo;
                          </div>
                        )}
                      </td>

                      {/* Divisi */}
                      <td className="py-2.5 px-3 font-sans border border-slate-200 dark:border-slate-800">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                          {item.division}
                        </span>
                      </td>

                      {/* Sikap A */}
                      <td className="py-2.5 px-3 text-center border border-slate-200 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                        {item.totalSkorA.toFixed(2)}
                      </td>

                      {/* KPI B */}
                      <td className="py-2.5 px-3 text-center border border-slate-200 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                        {item.totalSkorB.toFixed(2)}
                      </td>

                      {/* Nilai Akhir */}
                      <td className="py-2.5 px-3 text-center border border-slate-300 dark:border-slate-700 bg-[#E2EFDA] dark:bg-emerald-950/70 font-black text-slate-900 dark:text-emerald-200 text-sm">
                        {item.finalScore.toFixed(2)}
                      </td>

                      {/* Kategori / Status */}
                      <td className="py-2.5 px-3 text-center font-sans border border-slate-200 dark:border-slate-800">
                        {getStatusBadge(item.grade, item.statusLabel)}
                      </td>

                      {/* Aksi & Export CSV Row */}
                      <td className="py-2.5 px-3 text-center font-sans border border-slate-200 dark:border-slate-800 whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => {
                              onSelectAssessment(item);
                              onClose();
                            }}
                            className="px-2 py-1 bg-slate-900 dark:bg-slate-800 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition inline-flex items-center space-x-1 cursor-pointer"
                            title="Buka Slip Rapor Kinerja Lengkap"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Rapor</span>
                          </button>

                          <button
                            onClick={() =>
                              handleExportSpecificEmployee(
                                item.employeeId,
                                item.employeeName,
                                item.employeeNik,
                                item.division,
                                item.position
                              )
                            }
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition inline-flex items-center space-x-1 cursor-pointer shadow-xs"
                            title={`Unduh Riwayat CSV untuk ${item.employeeName}`}
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>CSV</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 font-medium">
            <Database className="w-4 h-4 text-slate-400" />
            <span>
              Tersimpan permanen di database lokal &bull; {availablePeriods.length} Periode Aktif terarsip &bull;{' '}
              {filteredAssessments.length} rekam data ditampilkan
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportHistoryClick}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export History (CSV)</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl font-semibold transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* Employee Picker Sub-Modal for 'Export History' */}
      {isExportPickerOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] text-slate-800 dark:text-slate-100">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Pilih Karyawan untuk Export Riwayat (CSV)</h4>
                  <p className="text-[11px] text-slate-400">
                    Unduh file CSV riwayat evaluasi performa karyawan sesuai filter yang aktif ({getActiveFilterSummary()})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExportPickerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Search inside picker */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari nama, NIK, atau divisi karyawan..."
                  value={exportPickerSearch}
                  onChange={(e) => setExportPickerSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* Employee List */}
            <div className="p-3 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 max-h-[50vh]">
              {filteredEmployeesForExport.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Tidak ditemukan karyawan yang cocok dengan pencarian.
                </div>
              ) : (
                filteredEmployeesForExport.map((emp) => {
                  const empFilteredCount = filteredAssessments.filter(
                    (a) => a.employeeId === emp.id || a.employeeNik === emp.nik
                  ).length;
                  const empTotalCount = allAssessments.filter(
                    (a) => a.employeeId === emp.id || a.employeeNik === emp.nik
                  ).length;

                  return (
                    <div
                      key={emp.id}
                      className="py-2.5 px-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl transition gap-2"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
                          {emp.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                            {emp.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">
                            NIK: {emp.nik} &bull; {emp.division} &bull; {emp.position || '-'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {empFilteredCount} / {empTotalCount} Periode
                        </span>
                        <button
                          onClick={() => {
                            handleExportSpecificEmployee(
                              emp.id,
                              emp.name,
                              emp.nik,
                              emp.division,
                              emp.position
                            );
                            setIsExportPickerOpen(false);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer shadow-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh CSV</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Sub-modal Footer */}
            <div className="p-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
              <span className="text-[11px] text-slate-400">
                {filteredEmployeesForExport.length} Karyawan terdaftar
              </span>
              <button
                onClick={() => setIsExportPickerOpen(false)}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
