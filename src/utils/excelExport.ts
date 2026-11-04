import * as XLSX from 'xlsx';
import { MasterAttitudeRecord, MasterKPIRecord, MonthlyAssessment } from '../types';
import { getCriterionScore } from './calculations';

export function exportToExcel(
  assessments: MonthlyAssessment[],
  masterList: MasterKPIRecord[],
  masterAttitudeList?: MasterAttitudeRecord[],
  filename = 'Sistem_Penilaian_KPI_HRD.xlsx'
) {
  // 1. Sheet: 1. Dashboard Nilai Akhir
  const dashHeaders = [
    'Nama Karyawan',
    'Divisi',
    'Skor Sikap (A)\nBobot 50%',
    'Skor KPI Teknis (B)\nBobot 50%',
    'NILAI AKHIR\n(1-10)',
    'Kategori / Status',
    'Catatan / Rekomendasi'
  ];

  const dashRows = assessments.map((a) => [
    a.employeeName,
    a.division,
    Number(a.totalSkorA.toFixed(2)),
    Number(a.totalSkorB.toFixed(2)),
    Number(a.finalScore.toFixed(2)),
    a.statusLabel,
    a.notes || '-'
  ]);

  const wsDash = XLSX.utils.aoa_to_sheet([dashHeaders, ...dashRows]);

  // Set column widths for Dashboard
  wsDash['!cols'] = [
    { wch: 22 }, // Nama
    { wch: 16 }, // Divisi
    { wch: 18 }, // Skor Sikap
    { wch: 20 }, // Skor KPI
    { wch: 16 }, // Nilai Akhir
    { wch: 24 }, // Kategori
    { wch: 35 }, // Catatan
  ];

  // 2. Sheet: 2. Penilaian Sikap (A)
  const activeAttitude = masterAttitudeList && masterAttitudeList.length > 0
    ? masterAttitudeList.filter((c) => c.enabled !== false)
    : null;

  let sikapHeaders: string[] = [];
  let sikapRows: any[][] = [];
  let sikapCols: any[] = [];

  if (activeAttitude) {
    sikapHeaders = [
      'Nama Karyawan',
      'Divisi',
      ...activeAttitude.map(
        (c) =>
          `${c.name}\n(Max ${Math.round(c.weight * 100)}%${
            c.isAttendancePenalty && c.penaltyWeight
              ? ' / ' + Math.round(c.penaltyWeight * 100) + '%'
              : ''
          })`
      ),
      'Sering Telat?\n(Ya/Tidak)',
      'Total Skor A\n(Max 10)'
    ];

    sikapRows = assessments.map((a) => [
      a.employeeName,
      a.division,
      ...activeAttitude.map((c) => getCriterionScore(a, c.id, c.defaultValue)),
      a.seringTelat,
      Number(a.totalSkorA.toFixed(2))
    ]);

    sikapCols = [
      { wch: 20 },
      { wch: 15 },
      ...activeAttitude.map(() => ({ wch: 18 })),
      { wch: 15 },
      { wch: 16 }
    ];
  } else {
    sikapHeaders = [
      'Nama Karyawan',
      'Divisi',
      'Kerajinan & Absensi\n(Max 15%)',
      'Izin Keluar\n(Max 10%)',
      'Hindari Kesalahan Fatal\n(Max 20%)',
      'Integritas/Bebas Kriminal\n(Max 25%)',
      'Sopan Santun\n(Max 5%)',
      'Kerapihan\n(Max 10%)',
      'Taat Aturan\n(Max 10%)',
      'Fokus/Keberadaan\n(Max 5%)',
      'Sering Telat?\n(Ya/Tidak)',
      'Total Skor A\n(Max 10)'
    ];

    sikapRows = assessments.map((a) => [
      a.employeeName,
      a.division,
      a.kerajinanAbsensi,
      a.izinKeluar,
      a.hindariKesalahanFatal,
      a.integritasKriminal,
      a.sopanSantun,
      a.kerapihan,
      a.taatAturan,
      a.fokusKeberadaan,
      a.seringTelat,
      Number(a.totalSkorA.toFixed(2))
    ]);

    sikapCols = [
      { wch: 20 },
      { wch: 15 },
      { wch: 18 },
      { wch: 14 },
      { wch: 22 },
      { wch: 24 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 18 },
      { wch: 15 },
      { wch: 16 }
    ];
  }

  const wsSikap = XLSX.utils.aoa_to_sheet([sikapHeaders, ...sikapRows]);
  wsSikap['!cols'] = sikapCols;

  // 3. Sheet: 3. Penilaian KPI (B)
  const kpiHeaders = [
    'Nama Karyawan',
    'Divisi',
    'Nama KPI 1',
    'Bobot 1',
    'Skor KPI 1\n(1-10)',
    'Nama KPI 2',
    'Bobot 2',
    'Skor KPI 2\n(1-10)',
    'Total Skor B\n(Max 10)'
  ];

  const kpiRows = assessments.map((a) => [
    a.employeeName,
    a.division,
    a.kpi1Name,
    `${(a.kpi1Weight * 100).toFixed(0)}%`,
    a.kpi1Score,
    a.kpi2Name,
    `${(a.kpi2Weight * 100).toFixed(0)}%`,
    a.kpi2Score,
    Number(a.totalSkorB.toFixed(2))
  ]);

  const wsKpi = XLSX.utils.aoa_to_sheet([kpiHeaders, ...kpiRows]);
  wsKpi['!cols'] = [
    { wch: 20 },
    { wch: 15 },
    { wch: 34 },
    { wch: 12 },
    { wch: 14 },
    { wch: 34 },
    { wch: 12 },
    { wch: 14 },
    { wch: 16 }
  ];

  // 4. Sheet: 4. Master Data KPI
  const masterHeaders = ['Divisi', 'KPI 1', 'Bobot 1', 'KPI 2', 'Bobot 2'];
  const masterRows = masterList.map((m) => [
    m.divisi,
    m.kpi1,
    `${(m.bobot1 * 100).toFixed(0)}%`,
    m.kpi2,
    `${(m.bobot2 * 100).toFixed(0)}%`
  ]);

  const wsMaster = XLSX.utils.aoa_to_sheet([masterHeaders, ...masterRows]);
  wsMaster['!cols'] = [
    { wch: 16 },
    { wch: 36 },
    { wch: 12 },
    { wch: 36 },
    { wch: 12 }
  ];

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsDash, '1. Dashboard Nilai Akhir');
  XLSX.utils.book_append_sheet(wb, wsSikap, '2. Penilaian Sikap (A)');
  XLSX.utils.book_append_sheet(wb, wsKpi, '3. Penilaian KPI (B)');
  XLSX.utils.book_append_sheet(wb, wsMaster, '4. Master Data KPI');

  // 5. Sheet: 5. Master Data Sikap (if available)
  if (masterAttitudeList && masterAttitudeList.length > 0) {
    const attitudeMasterHeaders = [
      'Kode',
      'Nama Kolom / Kategori',
      'Kelompok Aspek',
      'Bobot Persentase (%)',
      'Aturan Penalti Terlambat',
      'Deskripsi & Panduan Penilaian'
    ];
    const attitudeMasterRows = masterAttitudeList.map((c) => [
      c.code || c.id,
      c.name,
      c.category,
      `${Math.round(c.weight * 100)}%`,
      c.isAttendancePenalty ? `Potong ke ${Math.round((c.penaltyWeight || 0.1) * 100)}% jika telat` : 'Tidak Ada Penalti',
      c.description
    ]);
    const wsMasterAttitude = XLSX.utils.aoa_to_sheet([
      attitudeMasterHeaders,
      ...attitudeMasterRows
    ]);
    wsMasterAttitude['!cols'] = [
      { wch: 10 },
      { wch: 28 },
      { wch: 22 },
      { wch: 20 },
      { wch: 28 },
      { wch: 45 }
    ];
    XLSX.utils.book_append_sheet(wb, wsMasterAttitude, '5. Master Data Sikap');
  }

  // Trigger download in browser
  XLSX.writeFile(wb, filename);
}
