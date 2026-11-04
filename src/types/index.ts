export type Division =
  | 'Accounting'
  | 'Purchasing'
  | 'Marketing'
  | 'QC'
  | 'HRD & Umum'
  | 'Pre Press'
  | 'Offset'
  | 'Corrugated'
  | 'PPC'
  | 'Die Cutting'
  | 'Finishing'
  | 'Finished Good & Expedition'
  | 'Maintenance'
  | 'Warehouse'
  | 'IT'
  | string;

export interface MasterKPIRecord {
  divisi: string;
  kpi1: string;
  bobot1: number; // e.g. 0.60
  kpi2: string;
  bobot2: number; // e.g. 0.40
  satuanKpi1?: string;
  satuanKpi2?: string;
}

export interface MasterAttitudeRecord {
  id: string;               // Unique criterion key e.g. 'kerajinanAbsensi', 'izinKeluar', 'attitude_custom_...'
  code: string;             // Short identifier e.g. 'A1', 'A2', 'A3'
  name: string;             // Customizable column / category name
  category: string;         // Grouping e.g. 'Kedisiplinan & Presensi', 'Integritas & Etika', 'Kualitas Kerja'
  description: string;      // Guidance / rubric description
  weight: number;           // Decimal weight, e.g. 0.15 (15%)
  isAttendancePenalty?: boolean; // Whether 'Sering Telat' penalty applies to this column
  penaltyWeight?: number;   // Reduced weight if penalized, e.g. 0.10
  defaultValue?: number;    // Default score scale 1-10 (e.g. 8.5)
  order: number;            // Display order
  enabled?: boolean;        // Active status
}

export type EmploymentStatus = 'Tetap' | 'Kontrak' | 'Probation' | 'Honorer' | 'Borongan' | string;

export interface Employee {
  id: string;
  no?: number;
  nik: string;
  name: string;
  nickname?: string;
  nrpKodeKontrak?: string;
  status: EmploymentStatus;
  division: string;
  position: string;
  joinDate: string;
  masaKerja?: string;
  noKtp?: string;
  noBpjsTk?: string;
  noBpjsKs?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  alamat?: string;
  phone?: string;
  namaIbuKandung?: string;
  emailKerja?: string;
  email?: string;
  noRekeningBca?: string;
  noNpwp?: string;
  statusPph?: string;
  noBpjsKesehatan?: string;
  masaKontrak?: string;
  gender?: string;
  pendidikan?: string;
  agama?: string;
  golonganDarah?: string;
  statusMarital?: string;
  tanggalMenikah?: string;
  namaPasangan?: string;
  anak?: string[];
  namaAyahKandung?: string;
  avatarColor?: string;
}

export type FrequentLateStatus = 'Ya' | 'Tidak';

export interface MonthlyAssessment {
  id: string;
  period: string; // e.g. "2026-09"
  employeeId: string;
  employeeNik: string;
  employeeName: string;
  division: string;
  position: string;

  // Sikap (A) parameters (Scale 1 - 10)
  kerajinanAbsensi: number;       // Bobot Max 15% (10% jika seringTelat === 'Ya')
  izinKeluar: number;             // Bobot 10%
  hindariKesalahanFatal: number;  // Bobot 20%
  integritasKriminal: number;     // Bobot 25%
  sopanSantun: number;            // Bobot 5%
  kerapihan: number;              // Bobot 10%
  taatAturan: number;             // Bobot 10%
  fokusKeberadaan: number;        // Bobot 5%
  seringTelat: FrequentLateStatus;// 'Ya' or 'Tidak'
  totalSkorA: number;             // Max 10.00
  customAttitudeScores?: Record<string, number>; // Dynamic attitude criterion scores by ID

  // KPI Teknis (B) parameters (Scale 1 - 10)
  kpi1Name: string;
  kpi1Weight: number;             // Decimal, e.g. 0.60
  kpi1Score: number;              // Scale 1 - 10
  kpi1Note?: string;

  kpi2Name: string;
  kpi2Weight: number;             // Decimal, e.g. 0.40
  kpi2Score: number;              // Scale 1 - 10
  kpi2Note?: string;

  totalSkorB: number;             // Max 10.00

  // Overall Evaluation
  finalScore: number;             // (totalSkorA * 0.5) + (totalSkorB * 0.5)
  grade: 'A' | 'B' | 'C' | 'D' | 'E';
  statusLabel: string;            // 'Sangat Baik', 'Baik', 'Cukup', 'Kurang', 'Sangat Kurang/PHK'
  notes?: string;
  updatedAt?: string;

  // Tanggal, Hari, Bulan, Tahun Penilaian
  assessmentDate?: string;        // Format: "YYYY-MM-DD" e.g. "2026-09-24"
  dayName?: string;               // e.g. "Kamis"
  day?: number;                   // e.g. 24
  month?: number;                 // 1 - 12 e.g. 9
  monthName?: string;             // e.g. "September"
  year?: number;                  // e.g. 2026
  assessmentDateFormatted?: string; // e.g. "Kamis, 24 September 2026"

  // Evaluasi & Presensi Harian (History Per Hari)
  dailyAttendanceStatus?: 'Hadir Tepat Waktu' | 'Terlambat' | 'Izin' | 'Sakit' | 'Alpha';
  dailyAttendanceLateMinutes?: number;
  dailyNote?: string;

  // Email Notification & Publication Status
  publishedStatus?: 'draft' | 'published';
  publishedAt?: string;
  lastNotifiedAt?: string;
  notificationRecipientEmail?: string;
  notificationCount?: number;
}

export interface EmailNotificationLog {
  id: string;
  assessmentId: string;
  employeeId: string;
  employeeNik: string;
  employeeName: string;
  recipientEmail: string;
  period: string;
  grade: string;
  finalScore: number;
  sentAt: string;
  status: 'delivered' | 'pending' | 'failed';
  actionType: 'published' | 'updated' | 'manual_resend';
  sender: string;
  deliveryMethod: 'gmail_api' | 'server_dispatch' | 'mailto_client';
  notes?: string;
}

export interface AssessmentSummary {
  totalEmployees: number;
  averageScore: number;
  gradeCounts: {
    A: number;
    B: number;
    C: number;
    D: number;
    E: number;
  };
  latePenaltyCount: number;
  divisionScores: {
    [division: string]: {
      count: number;
      averageFinalScore: number;
    };
  };
}

export type OnboardingTrainingStatus = 'Not Started' | 'In Progress' | 'Completed';

export interface OnboardingTrainingMilestone {
  id: string;
  title: string;
  category: 'K3' | 'Orientasi' | 'SOP & Teknis' | 'Kualitas' | 'Manajerial';
  description: string;
  isMandatory: boolean;
  status: OnboardingTrainingStatus;
  completedDate?: string;
  trainerName?: string;
  scoreOrCert?: string;
  notes?: string;
}

export interface OnboardingDocumentItem {
  id: string;
  title: string;
  description: string;
  isRequired: boolean;
  isSubmitted: boolean;
  submissionDate?: string;
  documentRef?: string;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedDate?: string;
}

export type OnboardingOverallStatus = 'In Progress' | 'Completed' | 'Pending Documents' | 'Needs Review';

export interface EmployeeOnboardingRecord {
  id: string;
  employeeId: string;
  employeeNik: string;
  employeeName: string;
  division: string;
  position: string;
  statusKepegawaian: string;
  joinDate: string;
  mentorName: string;
  targetCompletionDate: string;
  overallStatus: OnboardingOverallStatus;
  trainingMilestones: OnboardingTrainingMilestone[];
  documentSubmissions: OnboardingDocumentItem[];
  progressPercentage: number;
  notes?: string;
  lastUpdated: string;
}
