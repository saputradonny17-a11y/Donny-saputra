import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { MasterAttitudeRecord, MasterKPIRecord, MonthlyAssessment } from '../types';
import {
  calculateDynamicScoreA,
  calculateFinalScore,
  calculateScoreA,
  calculateScoreB,
  determineGradeAndStatus
} from '../utils/calculations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  assessments: MonthlyAssessment[];
  masterList: MasterKPIRecord[];
  masterAttitudeList?: MasterAttitudeRecord[];
  onImportAssessments: (updated: MonthlyAssessment[]) => void;
  onExportTemplate: () => void;
}

export const ImportExcelModal: React.FC<Props> = ({
  isOpen,
  onClose,
  assessments,
  masterList,
  masterAttitudeList,
  onImportAssessments,
  onExportTemplate,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<{
    success: boolean;
    message: string;
    count?: number;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setImportStatus(null);
    }
  };

  const processExcel = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });

      // Look for sheet 2 (Penilaian Sikap) or sheet 1 (Dashboard) or first sheet
      const sheetNames = workbook.SheetNames;
      let matchedCount = 0;
      const updatedAssessments = [...assessments];

      // Try reading Sheet 2 if exists
      const sheetSikapName = sheetNames.find((s) => s.includes('Sikap') || s.includes('2.')) || sheetNames[0];
      const wsSikap = workbook.Sheets[sheetSikapName];

      if (wsSikap) {
        const rows: any[][] = XLSX.utils.sheet_to_json(wsSikap, { header: 1 });
        // row 0 is header
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || !row[0]) continue;
          const empName = String(row[0]).trim().toLowerCase();

          const targetIndex = updatedAssessments.findIndex(
            (a) => a.employeeName.trim().toLowerCase() === empName
          );

          if (targetIndex !== -1) {
            const current = { ...updatedAssessments[targetIndex] };
            // row columns: [Nama, Divisi, Kerajinan, Izin, Fatal, Integritas, Sopan, Rapi, Taat, Fokus, Telat]
            if (row[2] !== undefined) current.kerajinanAbsensi = Number(row[2]) || current.kerajinanAbsensi;
            if (row[3] !== undefined) current.izinKeluar = Number(row[3]) || current.izinKeluar;
            if (row[4] !== undefined) current.hindariKesalahanFatal = Number(row[4]) || current.hindariKesalahanFatal;
            if (row[5] !== undefined) current.integritasKriminal = Number(row[5]) || current.integritasKriminal;
            if (row[6] !== undefined) current.sopanSantun = Number(row[6]) || current.sopanSantun;
            if (row[7] !== undefined) current.kerapihan = Number(row[7]) || current.kerapihan;
            if (row[8] !== undefined) current.taatAturan = Number(row[8]) || current.taatAturan;
            if (row[9] !== undefined) current.fokusKeberadaan = Number(row[9]) || current.fokusKeberadaan;
            if (row[10] !== undefined) {
              const telatVal = String(row[10]).trim().toLowerCase();
              current.seringTelat = telatVal === 'ya' || telatVal === 'true' || telatVal === '1' ? 'Ya' : 'Tidak';
            }

            // Recalculate score A
            current.totalSkorA = masterAttitudeList && masterAttitudeList.length > 0
              ? calculateDynamicScoreA(masterAttitudeList, current, current.seringTelat)
              : calculateScoreA({
                  kerajinanAbsensi: current.kerajinanAbsensi,
                  izinKeluar: current.izinKeluar,
                  hindariKesalahanFatal: current.hindariKesalahanFatal,
                  integritasKriminal: current.integritasKriminal,
                  sopanSantun: current.sopanSantun,
                  kerapihan: current.kerapihan,
                  taatAturan: current.taatAturan,
                  fokusKeberadaan: current.fokusKeberadaan,
                  seringTelat: current.seringTelat,
                });

            // Recalculate final score
            const newFinal = calculateFinalScore(current.totalSkorA, current.totalSkorB);
            const { grade, statusLabel } = determineGradeAndStatus(newFinal);
            current.finalScore = newFinal;
            current.grade = grade;
            current.statusLabel = statusLabel;

            updatedAssessments[targetIndex] = current;
            matchedCount++;
          }
        }
      }

      // Try reading Sheet 3 (KPI) if exists
      const sheetKpiName = sheetNames.find((s) => s.includes('KPI') || s.includes('3.'));
      if (sheetKpiName && workbook.Sheets[sheetKpiName]) {
        const wsKpi = workbook.Sheets[sheetKpiName];
        const rowsKpi: any[][] = XLSX.utils.sheet_to_json(wsKpi, { header: 1 });
        for (let i = 1; i < rowsKpi.length; i++) {
          const row = rowsKpi[i];
          if (!row || !row[0]) continue;
          const empName = String(row[0]).trim().toLowerCase();
          const targetIndex = updatedAssessments.findIndex(
            (a) => a.employeeName.trim().toLowerCase() === empName
          );

          if (targetIndex !== -1) {
            const current = { ...updatedAssessments[targetIndex] };
            // columns: [Nama, Divisi, KPI1, Bobot1, Skor1, KPI2, Bobot2, Skor2]
            if (row[4] !== undefined) current.kpi1Score = Number(row[4]) || current.kpi1Score;
            if (row[7] !== undefined) current.kpi2Score = Number(row[7]) || current.kpi2Score;

            current.totalSkorB = calculateScoreB({
              kpi1Score: current.kpi1Score,
              kpi1Weight: current.kpi1Weight,
              kpi2Score: current.kpi2Score,
              kpi2Weight: current.kpi2Weight,
            });

            const newFinal = calculateFinalScore(current.totalSkorA, current.totalSkorB);
            const { grade, statusLabel } = determineGradeAndStatus(newFinal);
            current.finalScore = newFinal;
            current.grade = grade;
            current.statusLabel = statusLabel;

            updatedAssessments[targetIndex] = current;
          }
        }
      }

      if (matchedCount > 0) {
        onImportAssessments(updatedAssessments);
        setImportStatus({
          success: true,
          message: `Berhasil memperbarui nilai ${matchedCount} karyawan dari file Excel! Seluruh rumus dihitung ulang secara otomatis.`,
          count: matchedCount,
        });
      } else {
        setImportStatus({
          success: false,
          message: 'Format data Excel tidak cocok atau nama karyawan tidak ditemukan di database.',
        });
      }
    } catch (err: any) {
      setImportStatus({
        success: false,
        message: `Gagal membaca file: ${err.message || 'Format tidak valid'}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in duration-150 text-slate-800 dark:text-slate-100">
        <div className="bg-slate-900 dark:bg-slate-950 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Upload className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base text-white">Import Data Penilaian dari Excel</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Unggah file Excel (format <code>.xlsx</code> atau <code>.xls</code>).
            Sistem akan secara otomatis mencocokkan nama karyawan, memetakan skor sikap dan KPI teknis, serta mengkalkulasi ulang seluruh nilai akhir.
          </p>

          {/* Download Template helper */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <div className="font-bold text-slate-800 dark:text-white">Template Resmi Excel</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Struktur multi-sheet siap pakai</div>
              </div>
            </div>
            <button
              onClick={onExportTemplate}
              className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 font-semibold flex items-center space-x-1 cursor-pointer transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>

          {/* File input box */}
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:border-blue-500 dark:hover:border-blue-400 transition bg-slate-50/50 dark:bg-slate-800/40">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
              id="excel-upload-input"
            />
            <label
              htmlFor="excel-upload-input"
              className="cursor-pointer flex flex-col items-center justify-center space-y-2"
            >
              <FileSpreadsheet className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                {file ? file.name : 'Pilih atau Seret File Excel ke Sini'}
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500">Mendukung format .xlsx, .xls</div>
            </label>
          </div>

          {/* Status Message */}
          {importStatus && (
            <div
              className={`p-3 rounded-xl border flex items-start space-x-2.5 ${
                importStatus.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              }`}
            >
              {importStatus.success ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="leading-snug">{importStatus.message}</div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              disabled={!file || isProcessing}
              onClick={processExcel}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg font-semibold transition shadow-md shadow-blue-500/20 cursor-pointer"
            >
              {isProcessing ? 'Memproses...' : 'Proses & Sinkronkan Nilai'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
