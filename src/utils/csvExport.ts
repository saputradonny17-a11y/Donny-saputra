import { Employee, MonthlyAssessment } from '../types';
import { determineGradeAndStatus } from './calculations';

/**
 * Escapes a cell value for standard RFC-4180 CSV compliance.
 */
function escapeCsv(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Initiates client-side download of a CSV file with UTF-8 BOM encoding.
 * The BOM (\uFEFF) ensures Excel correctly displays accents and Indonesian text.
 */
export function downloadCSV(filename: string, content: string): void {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports filtered historical assessment data for a specific employee to a CSV file.
 */
export function exportEmployeeHistoryToCSV(
  employee: { id: string; name: string; nik: string; division?: string; position?: string },
  records: MonthlyAssessment[],
  filterDescription?: string
): void {
  // Sort records chronologically descending (newest first)
  const sorted = [...records].sort((a, b) => {
    const dateA = a.assessmentDate || a.period;
    const dateB = b.assessmentDate || b.period;
    return dateB.localeCompare(dateA);
  });

  const headers = [
    'No',
    'Nama Karyawan',
    'NIK',
    'Divisi',
    'Jabatan / Posisi',
    'Hari Penilaian',
    'Tanggal',
    'Bulan Penilaian',
    'Tahun Penilaian',
    'Tanggal Penilaian Lengkap',
    'Periode (YYYY-MM)',
    'Tanggal ISO (YYYY-MM-DD)',
    'Status Presensi Harian',
    'Keterlambatan (Menit)',
    'Kerajinan & Absensi (15%)',
    'Status Sering Telat',
    'Izin Keluar Kantor (10%)',
    'Hindari Kesalahan Fatal (10%)',
    'Integritas & Kriminal (10%)',
    'Sopan Santun (10%)',
    'Kerapihan (10%)',
    'Taat Aturan Perusahaan (15%)',
    'Fokus & Keberadaan (10%)',
    'Total Skor Sikap (A - 50%)',
    'Nama KPI 1',
    'Bobot KPI 1 (%)',
    'Nilai KPI 1 (1-10)',
    'Catatan KPI 1',
    'Nama KPI 2',
    'Bobot KPI 2 (%)',
    'Nilai KPI 2 (1-10)',
    'Catatan KPI 2',
    'Total Skor KPI (B - 50%)',
    'NILAI AKHIR (1-10)',
    'Grade',
    'Kategori / Status Kinerja',
    'Rekomendasi HR',
    'Catatan Evaluasi / HR',
    'Status Publikasi',
    'Waktu Publikasi',
    'Terakhir Diperbarui'
  ];

  const rows = sorted.map((item, idx) => {
    const { statusLabel, recommendation } = determineGradeAndStatus(item.finalScore);
    const dayName = item.dayName || '-';
    const day = item.day || '-';
    const monthName = item.monthName || '-';
    const year = item.year || '-';
    const formattedDate = item.assessmentDateFormatted || `${dayName}, ${day} ${monthName} ${year}`;

    return [
      idx + 1,
      item.employeeName || employee.name,
      item.employeeNik || employee.nik,
      item.division || employee.division || '-',
      item.position || employee.position || '-',
      dayName,
      day,
      monthName,
      year,
      formattedDate,
      item.period,
      item.assessmentDate || `${item.period}-24`,
      item.dailyAttendanceStatus || (item.seringTelat === 'Ya' ? 'Terlambat' : 'Hadir Tepat Waktu'),
      item.dailyAttendanceLateMinutes ?? (item.seringTelat === 'Ya' ? 15 : 0),
      item.kerajinanAbsensi,
      item.seringTelat || 'Tidak',
      item.izinKeluar,
      item.hindariKesalahanFatal,
      item.integritasKriminal,
      item.sopanSantun,
      item.kerapihan,
      item.taatAturan,
      item.fokusKeberadaan,
      Number(item.totalSkorA.toFixed(2)),
      item.kpi1Name,
      Math.round(item.kpi1Weight * 100) + '%',
      item.kpi1Score,
      item.kpi1Note || '-',
      item.kpi2Name,
      Math.round(item.kpi2Weight * 100) + '%',
      item.kpi2Score,
      item.kpi2Note || '-',
      Number(item.totalSkorB.toFixed(2)),
      Number(item.finalScore.toFixed(2)),
      item.grade,
      item.statusLabel || statusLabel,
      recommendation,
      item.notes || '-',
      item.publishedStatus || 'draft',
      item.publishedAt || '-',
      item.updatedAt || '-'
    ].map(escapeCsv).join(',');
  });

  // Optional metadata summary block at top
  const metadataRows: string[] = [
    `"RIWAYAT PENILAIAN & PRESENSI HARIAN KARYAWAN (DAILY KPI & ATTENDANCE LOG)"`,
    `"Nama Karyawan",${escapeCsv(employee.name)},"NIK",${escapeCsv(employee.nik)}`,
    `"Divisi",${escapeCsv(employee.division || '-')},"Total Rekam Riwayat Harian",${escapeCsv(sorted.length)}`,
    `"Tanggal Ekspor",${escapeCsv(new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))}`,
    filterDescription ? `"Filter Aktif",${escapeCsv(filterDescription)}` : `""`,
    `""` // Empty row separator before table headers
  ].filter(Boolean);

  const csvContent = [...metadataRows, headers.map(escapeCsv).join(','), ...rows].join('\r\n');

  const safeName = (employee.name || 'Karyawan').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeNik = (employee.nik || 'NIK').replace(/[^a-zA-Z0-9_-]/g, '_');
  const todayStr = new Date().toISOString().slice(0, 10);
  const filename = `Riwayat_KPI_${safeName}_${safeNik}_${todayStr}.csv`;

  downloadCSV(filename, csvContent);
}
