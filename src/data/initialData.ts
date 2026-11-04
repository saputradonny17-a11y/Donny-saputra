import { Employee, MasterAttitudeRecord, MasterKPIRecord, MonthlyAssessment } from '../types';
import { calculateFinalScore, calculateScoreA, calculateScoreB, determineGradeAndStatus } from '../utils/calculations';
import { OFFICIAL_EMPLOYEES } from './companyEmployees';
import { parseAssessmentDate } from '../utils/assessmentDatabase';

export const INITIAL_MASTER_ATTITUDE: MasterAttitudeRecord[] = [
  {
    id: 'kerajinanAbsensi',
    code: 'A1',
    name: 'Kerajinan & Absensi',
    category: 'Kedisiplinan & Presensi',
    description: 'Tingkat kehadiran fisik, ketepatan waktu datang/pulang, dan nihil alpa tanpa izin resmi.',
    weight: 0.15,
    isAttendancePenalty: true,
    penaltyWeight: 0.10,
    defaultValue: 9.0,
    order: 1,
    enabled: true,
  },
  {
    id: 'izinKeluar',
    code: 'A2',
    name: 'Izin Keluar',
    category: 'Kedisiplinan & Presensi',
    description: 'Kepatuhan prosedur surat izin saat meninggalkan area kerja selama jam operasional berlangsung.',
    weight: 0.10,
    defaultValue: 8.5,
    order: 2,
    enabled: true,
  },
  {
    id: 'hindariKesalahanFatal',
    code: 'A3',
    name: 'Hindari Kesalahan Fatal',
    category: 'Kualitas & Ketelitian',
    description: 'Ketelitian kerja dalam mencegah kesalahan fatal, kecelakaan K3, atau kerusakan mesin/barang.',
    weight: 0.20,
    defaultValue: 9.0,
    order: 3,
    enabled: true,
  },
  {
    id: 'integritasKriminal',
    code: 'A4',
    name: 'Integritas & Bebas Kriminal',
    category: 'Integritas & Etika',
    description: 'Kejujuran mutlak, zero toleransi kecurangan (fraud), dan bebas dari rekam jejak kriminalitas.',
    weight: 0.25,
    defaultValue: 10.0,
    order: 4,
    enabled: true,
  },
  {
    id: 'sopanSantun',
    code: 'A5',
    name: 'Sopan Santun & Etika',
    category: 'Sikap & Hubungan Kerja',
    description: 'Etika bertutur kata ramah, saling menghormati rekan, atasan, bawahan, serta tamu perusahaan.',
    weight: 0.05,
    defaultValue: 9.0,
    order: 5,
    enabled: true,
  },
  {
    id: 'kerapihan',
    code: 'A6',
    name: 'Kerapihan & 5R',
    category: 'Standar Kerja & Lingkungan',
    description: 'Pemakaian seragam & APD standar, serta pemeliharaan 5R (Ringkas, Rapi, Resik, Rawat, Rajin).',
    weight: 0.10,
    defaultValue: 8.5,
    order: 6,
    enabled: true,
  },
  {
    id: 'taatAturan',
    code: 'A7',
    name: 'Taat Aturan Perusahaan',
    category: 'Kepatuhan & Regulasi',
    description: 'Kepatuhan terhadap Peraturan Perusahaan (PP), tata tertib shift, dan SOP operasional divisi.',
    weight: 0.10,
    defaultValue: 8.5,
    order: 7,
    enabled: true,
  },
  {
    id: 'fokusKeberadaan',
    code: 'A8',
    name: 'Fokus & Keberadaan di Pos',
    category: 'Sikap & Hubungan Kerja',
    description: 'Konsistensi standby di area tugas dan tidak meninggalkan workstation tanpa keperluan dinas.',
    weight: 0.05,
    defaultValue: 8.5,
    order: 8,
    enabled: true,
  },
];

export const INITIAL_MASTER_KPI: MasterKPIRecord[] = [
  {
    divisi: 'Accounting',
    kpi1: 'Akurasi Laporan Keuangan & Perpajakan',
    bobot1: 0.60,
    kpi2: 'Ketepatan Waktu Closing & Rekonsiliasi Bank',
    bobot2: 0.40,
    satuanKpi1: 'Zero Reconcile Variance & Valid Tax',
    satuanKpi2: 'Closing Maksimal H+3 Setiap Bulan',
  },
  {
    divisi: 'Purchasing',
    kpi1: 'Ketersediaan Bahan Baku Tepat Waktu',
    bobot1: 0.60,
    kpi2: 'Efisiensi Biaya Pembelian & Negosiasi Vendor',
    bobot2: 0.40,
    satuanKpi1: 'Ketepatan Lead Time Bahan Baku (%)',
    satuanKpi2: 'Cost Saving & Termin Pembayaran',
  },
  {
    divisi: 'Finished Good & Expedition',
    kpi1: 'Ketepatan Waktu Pengiriman Barang Jadi (OTD)',
    bobot1: 0.60,
    kpi2: 'Keamanan, Kerapihan Packing & Muat Armada',
    bobot2: 0.40,
    satuanKpi1: 'On-Time Delivery Target 98%',
    satuanKpi2: 'Zero Kerusakan Barang Saat Transit',
  },
  {
    divisi: 'Marketing',
    kpi1: 'Pencapaian Target Sales, Omzet & Penjualan',
    bobot1: 0.70,
    kpi2: 'Akuisisi Klien Baru & Kepuasan Pelanggan',
    bobot2: 0.30,
    satuanKpi1: 'Pencapaian Target Omzet Bulanan',
    satuanKpi2: 'Jumlah Akun & Order Klien Baru',
  },
  {
    divisi: 'QC',
    kpi1: 'Pencegahan Komplain Pelanggan (Zero Defect)',
    bobot1: 0.70,
    kpi2: 'Ketelitian Inspeksi In-Line & Sampling Lab',
    bobot2: 0.30,
    satuanKpi1: 'Zero Customer Complaint (0 Defect)',
    satuanKpi2: 'Akurasi Checklist & Dokumen COA',
  },
  {
    divisi: 'HRD & Umum',
    kpi1: 'Penegakan Kedisiplinan & Pengawasan Absensi',
    bobot1: 0.50,
    kpi2: 'Akurasi Payroll, BPJS & Administrasi Personalia',
    bobot2: 0.50,
    satuanKpi1: 'Tingkat Kepatuhan Peraturan Kerja (%)',
    satuanKpi2: 'Zero Error Perhitungan Gaji & Tepat Waktu',
  },
  {
    divisi: 'Pre Press',
    kpi1: 'Akurasi Layout, Separasi Warna & Plat CTP',
    bobot1: 0.60,
    kpi2: 'Kecepatan Proses Proofing & Desain Produk',
    bobot2: 0.40,
    satuanKpi1: 'Akurasi Plat CTP Tanpa Buang Ulang (%)',
    satuanKpi2: 'SLA Approval Proofing Klien (Jam)',
  },
  {
    divisi: 'Offset',
    kpi1: 'Pencapaian Target Output Cetak Mesin (Impresi)',
    bobot1: 0.60,
    kpi2: 'Pengendalian Tingkat Waste Kertas & Tinta',
    bobot2: 0.40,
    satuanKpi1: 'Target Output Impresi / Shift',
    satuanKpi2: 'Tingkat Inschiet / Waste (< 1.5%)',
  },
  {
    divisi: 'Corrugated',
    kpi1: 'Target Output Box Karton (Coak, Jahit, Sablon)',
    bobot1: 0.60,
    kpi2: 'Presisi Ukuran, Lipatan & Daya Rekat Box',
    bobot2: 0.40,
    satuanKpi1: 'Jumlah Box Selesai / Shift',
    satuanKpi2: 'Tingkat Ketepatan Dimensi & Lipatan',
  },
  {
    divisi: 'PPC',
    kpi1: 'Ketercapaian Schedule & Perencanaan Produksi',
    bobot1: 0.60,
    kpi2: 'Efisiensi Lead Time & Koordinasi Antar Divisi',
    bobot2: 0.40,
    satuanKpi1: 'Kesesuaian Target SPK vs Aktual (%)',
    satuanKpi2: 'Zero Bottleneck Aliran Kerja Antar Shift',
  },
  {
    divisi: 'Die Cutting',
    kpi1: 'Akurasi & Presisi Potongan Mesin Pond Bobst',
    bobot1: 0.60,
    kpi2: 'Perawatan Pisau Pond & Kecepatan Make-Ready',
    bobot2: 0.40,
    satuanKpi1: 'Presisi Garis Rell & Potong Karton',
    satuanKpi2: 'Downtime & Checklist Perawatan Pisau',
  },
  {
    divisi: 'Finishing',
    kpi1: 'Kualitas Lem, Lipatan, Jahit Kawat & Laminating',
    bobot1: 0.60,
    kpi2: 'Kecepatan Pengerjaan & Output Kemas Manual',
    bobot2: 0.40,
    satuanKpi1: 'Kerapihan Lem & Zero Lem Lepas',
    satuanKpi2: 'Pencapaian Target Kemas Harian',
  },
  {
    divisi: 'Maintenance',
    kpi1: 'Kesiapan & Keandalan Mesin (Preventive Uptime)',
    bobot1: 0.60,
    kpi2: 'Kecepatan Respons Penanganan Gangguan Mesin',
    bobot2: 0.40,
    satuanKpi1: 'Machine Uptime Target >= 98%',
    satuanKpi2: 'Mean Time to Repair (MTTR)',
  },
  {
    divisi: 'Warehouse',
    kpi1: 'Akurasi Stok Opname Bahan Baku & Kertas',
    bobot1: 0.60,
    kpi2: 'Kecepatan & Kerapihan Distribusi ke Produksi',
    bobot2: 0.40,
    satuanKpi1: 'Zero Selisih Stok Fisik vs Sistem',
    satuanKpi2: 'SLA Penyediaan Bahan Sesuai SPK',
  },
  {
    divisi: 'IT',
    kpi1: 'Kestabilan Sistem ERP, Jaringan & Server',
    bobot1: 0.60,
    kpi2: 'Kecepatan Penyelesaian Tiket Support User',
    bobot2: 0.40,
    satuanKpi1: 'System & Network Availability 99.5%',
    satuanKpi2: 'Response Time & Resolution Support',
  },
  // Compatibility Aliases
  {
    divisi: 'Produksi',
    kpi1: 'Pencapaian Target Output',
    bobot1: 0.60,
    kpi2: 'Tingkat Waste / Barang Rusak',
    bobot2: 0.40,
    satuanKpi1: 'Target Output (Karton / Impresi)',
    satuanKpi2: 'Tingkat Kerusakan (< 1.5%)',
  },
  {
    divisi: 'Akunting',
    kpi1: 'Akurasi Laporan Keuangan',
    bobot1: 0.60,
    kpi2: 'Ketepatan Waktu Closing',
    bobot2: 0.40,
    satuanKpi1: 'Zero Reconcile Variance',
    satuanKpi2: 'Closing Maksimal H+3 Setiap Bulan',
  },
  {
    divisi: 'HRD',
    kpi1: 'Penegakan Kedisiplinan Karyawan',
    bobot1: 0.50,
    kpi2: 'Akurasi Payroll & Administrasi',
    bobot2: 0.50,
    satuanKpi1: 'Tingkat Kepatuhan & Disiplin (%)',
    satuanKpi2: 'Ketepatan Tanggal & Hitungan Gaji',
  },
  {
    divisi: 'POND',
    kpi1: 'Akurasi Potongan Pisau Pond',
    bobot1: 0.60,
    kpi2: 'Perawatan Pisau & Mesin',
    bobot2: 0.40,
    satuanKpi1: 'Presisi Garis Lipatan & Potong',
    satuanKpi2: 'Checklist Perawatan Mesin Pond',
  },
  {
    divisi: 'PIC',
    kpi1: 'Kelancaran Jadwal Produksi',
    bobot1: 0.60,
    kpi2: 'Komunikasi Lintas Divisi',
    bobot2: 0.40,
    satuanKpi1: 'On-Time Delivery (OTD %)',
    satuanKpi2: 'Koordinasi SPK Antar Bagian',
  },
];

export const INITIAL_EMPLOYEES: Employee[] = OFFICIAL_EMPLOYEES;

export function buildAssessmentForEmployee(
  emp: Employee,
  period: string,
  masterList: MasterKPIRecord[],
  presetData?: Partial<MonthlyAssessment>
): MonthlyAssessment {
  // Normalize division name for lookup
  const empDiv = emp.division.trim().toLowerCase();
  const master = masterList.find((m) => {
    const mDiv = m.divisi.trim().toLowerCase();
    return (
      mDiv === empDiv ||
      (empDiv.includes('hrd') && mDiv.includes('hrd')) ||
      (empDiv.includes('accounting') && (mDiv.includes('accounting') || mDiv.includes('akunting'))) ||
      (empDiv.includes('die') && (mDiv.includes('die') || mDiv.includes('pond'))) ||
      (empDiv.includes('ppc') && (mDiv.includes('ppc') || mDiv.includes('pic'))) ||
      (empDiv.includes('expedition') && mDiv.includes('expedition')) ||
      (empDiv.includes('pre') && mDiv.includes('pre'))
    );
  }) || {
    divisi: emp.division,
    kpi1: 'Pencapaian Target Kerja Utama',
    bobot1: 0.60,
    kpi2: 'Kualitas & Ketepatan Waktu Kerja',
    bobot2: 0.40,
  };

  // Base deterministic scoring seeded from NIK number for consistency
  const numSeed = parseInt(emp.nik.replace(/\D/g, ''), 10) || 1000;
  const isHead = emp.position.toLowerCase().includes('head') || emp.position.toLowerCase().includes('supervisor');
  
  // Subtle month-over-month progression to reflect organizational improvement across periods
  const monthMatch = period.match(/-(\d{2})$/);
  const monthNum = monthMatch ? parseInt(monthMatch[1], 10) : 9;
  const monthGrowthOffset = presetData ? 0 : Math.max(-0.8, Math.min(0.6, (monthNum - 9) * 0.22));

  // Base scores
  const rawAbsensi = isHead ? 9.5 : 8.5 + (numSeed % 4) * 0.5;
  const defaultAbsensi = presetData?.kerajinanAbsensi ?? Math.max(1, Math.min(10, Number((rawAbsensi + monthGrowthOffset).toFixed(1))));
  const defaultIzin = presetData?.izinKeluar ?? (8.5 + (numSeed % 3) * 0.5);
  const defaultFatal = presetData?.hindariKesalahanFatal ?? (isHead ? 10 : 8.5 + ((numSeed + 1) % 4) * 0.5);
  const defaultIntegritas = presetData?.integritasKriminal ?? 10;
  const defaultSopan = presetData?.sopanSantun ?? (8.5 + (numSeed % 3) * 0.5);
  const defaultRapi = presetData?.kerapihan ?? (8.0 + ((numSeed + 2) % 4) * 0.5);
  const defaultTaat = presetData?.taatAturan ?? (8.5 + (numSeed % 3) * 0.5);
  const defaultFokus = presetData?.fokusKeberadaan ?? (8.5 + ((numSeed + 1) % 3) * 0.5);
  
  // Late status: small percentage flagged as late for audit demonstration
  const isLateDefault = (numSeed % 14 === 0) ? 'Ya' : 'Tidak';
  const seringTelat = presetData?.seringTelat ?? isLateDefault;

  const totalSkorA = calculateScoreA({
    kerajinanAbsensi: defaultAbsensi,
    izinKeluar: defaultIzin,
    hindariKesalahanFatal: defaultFatal,
    integritasKriminal: defaultIntegritas,
    sopanSantun: defaultSopan,
    kerapihan: defaultRapi,
    taatAturan: defaultTaat,
    fokusKeberadaan: defaultFokus,
    seringTelat,
  });

  const rawKpi1 = isHead ? 9.2 : 8.0 + (numSeed % 5) * 0.4;
  const rawKpi2 = isHead ? 9.0 : 8.0 + ((numSeed + 2) % 5) * 0.4;
  const kpi1Score = presetData?.kpi1Score ?? Math.max(1, Math.min(10, Number((rawKpi1 + monthGrowthOffset).toFixed(1))));
  const kpi2Score = presetData?.kpi2Score ?? Math.max(1, Math.min(10, Number((rawKpi2 + monthGrowthOffset).toFixed(1))));

  const totalSkorB = calculateScoreB({
    kpi1Score,
    kpi1Weight: master.bobot1,
    kpi2Score,
    kpi2Weight: master.bobot2,
  });

  const finalScore = calculateFinalScore(totalSkorA, totalSkorB);
  const { grade, statusLabel } = determineGradeAndStatus(finalScore);

  const dateInfo = parseAssessmentDate(presetData?.assessmentDate, period);

  return {
    id: `${period}-${emp.id}`,
    period,
    employeeId: emp.id,
    employeeNik: emp.nik,
    employeeName: emp.name,
    division: emp.division,
    position: emp.position,
    kerajinanAbsensi: defaultAbsensi,
    izinKeluar: defaultIzin,
    hindariKesalahanFatal: defaultFatal,
    integritasKriminal: defaultIntegritas,
    sopanSantun: defaultSopan,
    kerapihan: defaultRapi,
    taatAturan: defaultTaat,
    fokusKeberadaan: defaultFokus,
    seringTelat,
    totalSkorA,
    kpi1Name: master.kpi1,
    kpi1Weight: master.bobot1,
    kpi1Score,
    kpi1Note: presetData?.kpi1Note || 'Pencapaian target bulan berjalan',
    kpi2Name: master.kpi2,
    kpi2Weight: master.bobot2,
    kpi2Score,
    kpi2Note: presetData?.kpi2Note || 'Kualitas output hasil kerja',
    totalSkorB,
    finalScore,
    grade,
    statusLabel,
    notes: presetData?.notes || (seringTelat === 'Ya' ? 'Terkena penalti potongan bobot absensi (10%) karena tercatat sering terlambat.' : 'Kinerja dan kedisiplinan kerja bulan ini terjaga dengan baik.'),
    updatedAt: new Date().toISOString(),
    ...dateInfo,
  };
}

export function generateInitialAssessments(period = '2026-09'): MonthlyAssessment[] {
  return INITIAL_EMPLOYEES.map((emp) =>
    buildAssessmentForEmployee(emp, period, INITIAL_MASTER_KPI)
  );
}
