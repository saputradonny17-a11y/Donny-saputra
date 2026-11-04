import React, { useState, useEffect, useMemo } from 'react';
import {
  Mail,
  Send,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Shield,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  Search,
  CheckSquare,
  Square,
  Edit2,
  Users,
  Key,
  LogIn,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { Employee, MonthlyAssessment, EmailNotificationLog } from '../types';
import {
  resolveEmployeeEmail,
  formatPeriodIndonesian,
  generateEmailContent,
  dispatchSingleAssessmentEmail,
  dispatchBulkAssessmentEmails,
} from '../utils/emailNotificationService';
import {
  getConnectedGmailInfo,
  requestGoogleAccessToken,
  clearGoogleSession,
  getValidGoogleToken,
} from '../utils/googleAuth';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: 'single' | 'bulk';
  // For single mode:
  assessment?: MonthlyAssessment | null;
  employee?: Employee | null;
  // For bulk/selective mode:
  assessments?: MonthlyAssessment[];
  employees?: Employee[];
  initialSelectedIds?: string[];
  // Callback when notification is completed
  onNotificationSent: (updatedAssessments: MonthlyAssessment[], message: string) => void;
  currentPeriod: string;
  senderName: string;
}

export const SendAssessmentEmailModal: React.FC<Props> = ({
  isOpen,
  onClose,
  mode,
  assessment,
  employee,
  assessments = [],
  employees = [],
  initialSelectedIds = [],
  onNotificationSent,
  currentPeriod,
  senderName,
}) => {
  const [actionType, setActionType] = useState<'published' | 'updated'>('published');
  const [customEmail, setCustomEmail] = useState<string>('');
  const [customNotes, setCustomNotes] = useState<string>('');
  const [showFullPreview, setShowFullPreview] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [sendingProgress, setSendingProgress] = useState<{
    current: number;
    total: number;
    name: string;
  } | null>(null);

  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);

  // Gmail OAuth status state
  const [gmailInfo, setGmailInfo] = useState<{ isConnected: boolean; email?: string }>(
    getConnectedGmailInfo()
  );
  const [isConnectingGmail, setIsConnectingGmail] = useState<boolean>(false);

  // Bulk / Selective mode states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [customCcEmails, setCustomCcEmails] = useState<string>('');
  const [emailOverrides, setEmailOverrides] = useState<Record<string, string>>({});
  const [editingEmailId, setEditingEmailId] = useState<string | null>(null);

  // Multi-Scope Reporting Choice: Harian, Mingguan, Akumulasi Bulanan, Tahunan
  const [reportScope, setReportScope] = useState<'harian' | 'mingguan' | 'bulanan' | 'tahunan'>('harian');
  const [selectedWeek, setSelectedWeek] = useState<number>(4);
  const [selectedAnnualYear, setSelectedAnnualYear] = useState<number>(2026);

  // Refresh Gmail info when modal opens
  useEffect(() => {
    if (isOpen) {
      setGmailInfo(getConnectedGmailInfo());
      setSubmitResult(null);
      setSendingProgress(null);
      if (mode === 'bulk') {
        if (initialSelectedIds && initialSelectedIds.length > 0) {
          setSelectedIds(new Set(initialSelectedIds));
        } else {
          // Default to all assessments in current period
          setSelectedIds(new Set(assessments.map((a) => a.id)));
        }
      }
    }
  }, [isOpen, mode, initialSelectedIds, assessments]);

  // Map of employees for fast lookup
  const employeeMap = useMemo(() => {
    const map = new Map<string, Employee>();
    employees.forEach((emp) => map.set(emp.id, emp));
    return map;
  }, [employees]);

  const handleConnectGmail = async () => {
    setIsConnectingGmail(true);
    try {
      await requestGoogleAccessToken(true);
      setGmailInfo(getConnectedGmailInfo());
    } catch (err: any) {
      alert(`Gagal menghubungkan akun Gmail: ${err?.message || 'Izin dibatalkan.'}`);
    } finally {
      setIsConnectingGmail(false);
    }
  };

  const handleDisconnectGmail = () => {
    if (confirm('Apakah Anda yakin ingin memutus koneksi akun Gmail?')) {
      clearGoogleSession();
      setGmailInfo({ isConnected: false });
    }
  };

  if (!isOpen) return null;

  // ----------------------------------------------------
  // SINGLE EMPLOYEE NOTIFICATION LOGIC
  // ----------------------------------------------------
  if (mode === 'single' && assessment) {
    const defaultEmail = resolveEmployeeEmail(employee || undefined, assessment);
    const targetEmail = customEmail.trim() || defaultEmail;

    const reportScopeLabel =
      reportScope === 'harian'
        ? `${assessment.dayName || 'Kamis'}, ${assessment.assessmentDate || `${assessment.period}-24`}`
        : reportScope === 'mingguan'
        ? `Minggu ke-${selectedWeek} (${formatPeriodIndonesian(assessment.period)})`
        : reportScope === 'tahunan'
        ? `Akumulasi Tahunan (Tahun ${selectedAnnualYear})`
        : `Akumulasi Bulanan (${formatPeriodIndonesian(assessment.period)})`;

    const dailyAttendanceSummary =
      reportScope === 'harian'
        ? `${assessment.dailyAttendanceStatus || 'Hadir Tepat Waktu'}${
            assessment.dailyAttendanceLateMinutes ? ` (${assessment.dailyAttendanceLateMinutes} menit telat)` : ''
          }`
        : reportScope === 'mingguan'
        ? `Rekapitulasi Kehadiran Minggu ke-${selectedWeek}`
        : reportScope === 'tahunan'
        ? `Rekapitulasi Kehadiran Tahunan ${selectedAnnualYear}`
        : `Rekapitulasi Akumulasi Bulanan`;

    const emailContent = generateEmailContent({
      recipientEmail: targetEmail,
      employeeName: assessment.employeeName,
      employeeNik: assessment.employeeNik,
      division: assessment.division,
      position: assessment.position || employee?.position || '-',
      period: assessment.period,
      finalScore: assessment.finalScore,
      grade: assessment.grade,
      statusLabel: assessment.statusLabel,
      totalSkorA: assessment.totalSkorA,
      totalSkorB: assessment.totalSkorB,
      notes: customNotes.trim() || assessment.notes,
      actionType,
      publishedBy: senderName || 'Divisi HRD & People Development',
      assessmentId: assessment.id,
      employeeId: assessment.employeeId,
      reportScope,
      reportScopeLabel,
      dailyAttendanceSummary,
    });

    const mailtoUrl = `mailto:${encodeURIComponent(targetEmail)}?subject=${encodeURIComponent(
      emailContent.subject
    )}&body=${encodeURIComponent(emailContent.textBody)}`;

    const handleSendSingle = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      setSubmitResult(null);

      try {
        await dispatchSingleAssessmentEmail({
          recipientEmail: targetEmail,
          employeeName: assessment.employeeName,
          employeeNik: assessment.employeeNik,
          division: assessment.division,
          position: assessment.position || employee?.position || '-',
          period: assessment.period,
          finalScore: assessment.finalScore,
          grade: assessment.grade,
          statusLabel: assessment.statusLabel,
          totalSkorA: assessment.totalSkorA,
          totalSkorB: assessment.totalSkorB,
          notes: customNotes.trim() || assessment.notes,
          actionType,
          publishedBy: senderName || 'Divisi HRD & People Development',
          assessmentId: assessment.id,
          employeeId: assessment.employeeId,
          reportScope,
          reportScopeLabel,
          dailyAttendanceSummary,
        });

        // Re-read gmail info in case it was authorized just in time
        setGmailInfo(getConnectedGmailInfo());

        const now = new Date().toISOString();
        const updatedAssessment: MonthlyAssessment = {
          ...assessment,
          publishedStatus: 'published',
          publishedAt: assessment.publishedAt || now,
          lastNotifiedAt: now,
          notificationRecipientEmail: targetEmail,
          notificationCount: (assessment.notificationCount || 0) + 1,
        };

        setIsSubmitting(false);
        onNotificationSent(
          [updatedAssessment],
          `Email hasil penilaian ${assessment.employeeName} berhasil dikirim ke ${targetEmail}!`
        );
        setSubmitResult({
          success: true,
          message: `Email nyata berhasil dikirim langsung ke ${targetEmail}!`,
          details: `Pengiriman resmi via Gmail API selesai. Status penilaian ${assessment.employeeName} resmi diperbarui menjadi Dipublikasikan.`,
        });
      } catch (err: any) {
        setIsSubmitting(false);
        setSubmitResult({
          success: false,
          message: err?.message || 'Gagal mengirim email notifikasi.',
        });
      }
    };

    const handleOpenMailto = () => {
      window.open(mailtoUrl, '_blank');
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col text-slate-800 dark:text-slate-100">
          {/* Header */}
          <div className="bg-slate-900 dark:bg-slate-950 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <span>Kirim Notifikasi Hasil Penilaian Nyata</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    {assessment.employeeName}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-300">
                  Kirim ringkasan transparansi nilai kinerja resmi langsung ke email kotak masuk karyawan
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 overflow-y-auto space-y-4 text-xs">
            {/* Gmail Connection Status Banner */}
            <div
              className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                gmailInfo.isConnected
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200'
              }`}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    gmailInfo.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                <div className="truncate">
                  <div className="font-bold text-xs">
                    {gmailInfo.isConnected
                      ? `Akun Gmail Terhubung: ${gmailInfo.email}`
                      : 'Akun Gmail Belum Terhubung (Wajib untuk Kirim Nyata)'}
                  </div>
                  <div className="text-[10px] opacity-85">
                    {gmailInfo.isConnected
                      ? 'Email akan dikirim secara langsung dan nyata dari akun Gmail resmi Anda.'
                      : 'Klik tombol Hubungkan Gmail agar email benar-benar masuk ke inbox penerima.'}
                  </div>
                </div>
              </div>

              {gmailInfo.isConnected ? (
                <button
                  type="button"
                  onClick={handleDisconnectGmail}
                  className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-slate-700 rounded-lg text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 transition shrink-0 cursor-pointer"
                >
                  Ganti Akun
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectGmail}
                  disabled={isConnectingGmail}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition shrink-0 flex items-center space-x-1 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{isConnectingGmail ? 'Menghubungkan...' : 'Hubungkan Gmail HR'}</span>
                </button>
              )}
            </div>

            {submitResult && (
              <div
                className={`p-3.5 rounded-xl border flex items-start space-x-2.5 ${
                  submitResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200'
                }`}
              >
                {submitResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold">{submitResult.message}</div>
                  {submitResult.details && (
                    <div className="text-[11px] opacity-85 mt-0.5">{submitResult.details}</div>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSendSingle} className="space-y-4">
              {/* Employee Summary Card */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">Karyawan</span>
                  <span className="font-bold text-slate-900 dark:text-white">{assessment.employeeName}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-mono">NIK: {assessment.employeeNik}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">Divisi / Posisi</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{assessment.division}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{assessment.position || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">Periode</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{formatPeriodIndonesian(assessment.period)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">Skor Akhir & Grade</span>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <span className="font-mono font-bold text-slate-900 dark:text-emerald-300 text-sm bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700">
                      {assessment.finalScore.toFixed(2)}
                    </span>
                    <span className="font-bold text-blue-700 dark:text-blue-400">Grade {assessment.grade}</span>
                  </div>
                </div>
              </div>

              {/* Pilihan Format & Cakupan Laporan (Harian, Mingguan, Akumulasi Bulanan, Tahunan) */}
              <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Pilihan Cakupan Laporan yang Dikirim:</span>
                  </label>
                  <span className="text-[11px] text-blue-700 dark:text-blue-300 font-semibold bg-blue-50 dark:bg-blue-950/70 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                    {reportScopeLabel}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setReportScope('harian')}
                    className={`px-2.5 py-1.5 rounded-lg font-semibold text-center transition cursor-pointer text-xs border ${
                      reportScope === 'harian'
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    📅 Laporan Harian
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportScope('mingguan')}
                    className={`px-2.5 py-1.5 rounded-lg font-semibold text-center transition cursor-pointer text-xs border ${
                      reportScope === 'mingguan'
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    📊 Mingguan
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportScope('bulanan')}
                    className={`px-2.5 py-1.5 rounded-lg font-semibold text-center transition cursor-pointer text-xs border ${
                      reportScope === 'bulanan'
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    📈 Akumulasi Bulanan
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportScope('tahunan')}
                    className={`px-2.5 py-1.5 rounded-lg font-semibold text-center transition cursor-pointer text-xs border ${
                      reportScope === 'tahunan'
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    🏆 Tahunan
                  </button>
                </div>

                {reportScope === 'mingguan' && (
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Pilih Minggu Evaluasi:</span>
                    <select
                      value={selectedWeek}
                      onChange={(e) => setSelectedWeek(Number(e.target.value))}
                      className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold cursor-pointer text-xs text-slate-800 dark:text-slate-200"
                    >
                      <option value={1}>Minggu 1 (Tgl 01 - 07)</option>
                      <option value={2}>Minggu 2 (Tgl 08 - 14)</option>
                      <option value={3}>Minggu 3 (Tgl 15 - 21)</option>
                      <option value={4}>Minggu 4 (Tgl 22 - 28)</option>
                      <option value={5}>Minggu 5 (Tgl 29 - 31)</option>
                    </select>
                  </div>
                )}

                {reportScope === 'tahunan' && (
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Pilih Tahun Evaluasi:</span>
                    <select
                      value={selectedAnnualYear}
                      onChange={(e) => setSelectedAnnualYear(Number(e.target.value))}
                      className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold cursor-pointer text-xs text-slate-800 dark:text-slate-200"
                    >
                      <option value={2026}>Tahun 2026</option>
                      <option value={2025}>Tahun 2025</option>
                    </select>
                  </div>
                )}

                <div className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                  💡 Hanya ringkasan performa yang dipilih yang dicantumkan dalam email, sehingga email rapi dan tidak memuat seluruh riwayat mentah.
                </div>
              </div>

              {/* Action Type */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Tipe Aksi Notifikasi:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActionType('published')}
                    className={`py-2 px-3 rounded-lg border text-left font-semibold transition cursor-pointer ${
                      actionType === 'published'
                        ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    📢 Publikasi Nilai Resmi
                    <span className="block text-[10px] font-normal opacity-85 mt-0.5">
                      Pemberitahuan resmi pertama kali untuk periode ini
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionType('updated')}
                    className={`py-2 px-3 rounded-lg border text-left font-semibold transition cursor-pointer ${
                      actionType === 'updated'
                        ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    ✏️ Pembaruan Nilai
                    <span className="block text-[10px] font-normal opacity-85 mt-0.5">
                      Pemberitahuan ada perbaikan / rekalkulasi evaluasi
                    </span>
                  </button>
                </div>
              </div>

              {/* Recipient Email Input */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Alamat Email Karyawan Penerima:
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={customEmail || defaultEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="nama.karyawan@perusahaan.com"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Alamat email tujuan pengiriman nyata</span>
                  {customEmail && customEmail !== defaultEmail && (
                    <button
                      type="button"
                      onClick={() => setCustomEmail('')}
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Kembalikan ke Default</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Notes from HR */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Catatan Tambahan dari HRD (Opsional):
                </label>
                <textarea
                  rows={2}
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Contoh: Harap hadir pada sesi konseling evaluasi bulanan hari Jumat pukul 14:00 WIB..."
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              {/* Preview Toggle */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowFullPreview(!showFullPreview)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 flex items-center justify-between font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer"
                >
                  <span className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Pratinjau Isi Email yang Masuk ke Inbox Karyawan</span>
                  </span>
                  {showFullPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showFullPreview && (
                  <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 space-y-3 font-sans">
                    <div className="text-xs bg-slate-50 dark:bg-slate-800 p-2.5 rounded border border-slate-200 dark:border-slate-700">
                      <div className="font-bold text-slate-700 dark:text-slate-300">Subjek:</div>
                      <div className="text-blue-900 dark:text-blue-300 font-semibold">{emailContent.subject}</div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white text-slate-900 max-h-60 overflow-y-auto">
                      <div
                        dangerouslySetInnerHTML={{ __html: emailContent.htmlBody }}
                        className="email-preview-container"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleOpenMailto}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-1.5 cursor-pointer"
                  title="Buka template ini di aplikasi email lokal"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka di Mailto / Webmail</span>
                </button>

                <div className="flex items-center space-x-2 justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {isSubmitting ? 'Mengirim ke Inbox via Gmail...' : 'Kirim Email Notifikasi (Nyata)'}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // BULK & CUSTOM SELECTIVE NOTIFICATION WITH CHECKLIST COLUMN
  // ----------------------------------------------------
  const countTotal = assessments.length;
  const countDraft = assessments.filter((a) => a.publishedStatus !== 'published').length;
  const countPublished = countTotal - countDraft;
  const countGradeA = assessments.filter((a) => a.grade === 'A').length;

  // Filtered recipient list based on search term
  const filteredAssessments = assessments.filter((a) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    const emp = employeeMap.get(a.employeeId);
    const email = (emailOverrides[a.id] || resolveEmployeeEmail(emp, a)).toLowerCase();
    return (
      a.employeeName.toLowerCase().includes(q) ||
      a.employeeNik.toLowerCase().includes(q) ||
      a.division.toLowerCase().includes(q) ||
      email.includes(q)
    );
  });

  const selectedCount = selectedIds.size;
  const isAllFilteredSelected =
    filteredAssessments.length > 0 &&
    filteredAssessments.every((a) => selectedIds.has(a.id));

  const handleToggleSelectAllFiltered = () => {
    const next = new Set(selectedIds);
    if (isAllFilteredSelected) {
      filteredAssessments.forEach((a) => next.delete(a.id));
    } else {
      filteredAssessments.forEach((a) => next.add(a.id));
    }
    setSelectedIds(next);
  };

  const handleToggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(assessments.map((a) => a.id)));
  };

  const handleSelectDraftOnly = () => {
    const drafts = assessments.filter((a) => a.publishedStatus !== 'published').map((a) => a.id);
    setSelectedIds(new Set(drafts));
  };

  const handleSelectGradeAOnly = () => {
    const gradeA = assessments.filter((a) => a.grade === 'A').map((a) => a.id);
    setSelectedIds(new Set(gradeA));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleSendSelected = async () => {
    if (selectedCount === 0) {
      alert('Pilih minimal satu karyawan untuk dikirimkan email notifikasi!');
      return;
    }

    setIsSubmitting(true);
    setSubmitResult(null);
    setSendingProgress(null);

    // Filter only checked assessments
    const targetAssessments = assessments.filter((a) => selectedIds.has(a.id));

    // Parse additional CC emails
    const extraCcs = customCcEmails
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.includes('@'));

    const items = targetAssessments.map((a) => {
      const emp = employeeMap.get(a.employeeId);
      const recipientEmail = emailOverrides[a.id] || resolveEmployeeEmail(emp, a);

      const itemScopeLabel =
        reportScope === 'harian'
          ? `${a.dayName || 'Kamis'}, ${a.assessmentDate || `${a.period}-24`}`
          : reportScope === 'mingguan'
          ? `Minggu ke-${selectedWeek} (${formatPeriodIndonesian(a.period)})`
          : reportScope === 'tahunan'
          ? `Akumulasi Tahunan (Tahun ${selectedAnnualYear})`
          : `Akumulasi Bulanan (${formatPeriodIndonesian(a.period)})`;

      const itemAttendanceSummary =
        reportScope === 'harian'
          ? `${a.dailyAttendanceStatus || 'Hadir Tepat Waktu'}${
              a.dailyAttendanceLateMinutes ? ` (${a.dailyAttendanceLateMinutes} menit telat)` : ''
            }`
          : reportScope === 'mingguan'
          ? `Rekapitulasi Kehadiran Minggu ke-${selectedWeek}`
          : reportScope === 'tahunan'
          ? `Rekapitulasi Kehadiran Tahunan ${selectedAnnualYear}`
          : `Rekapitulasi Akumulasi Bulanan`;

      return {
        recipientEmail,
        employeeName: a.employeeName,
        employeeNik: a.employeeNik,
        division: a.division,
        position: a.position || '-',
        period: a.period,
        finalScore: a.finalScore,
        grade: a.grade,
        statusLabel: a.statusLabel,
        totalSkorA: a.totalSkorA,
        totalSkorB: a.totalSkorB,
        notes: a.notes,
        actionType,
        publishedBy: senderName || 'Divisi HRD & People Development',
        assessmentId: a.id,
        employeeId: a.employeeId,
        reportScope,
        reportScopeLabel: itemScopeLabel,
        dailyAttendanceSummary: itemAttendanceSummary,
        ccEmails: extraCcs.length > 0 ? extraCcs : undefined,
      };
    });

    try {
      const result = await dispatchBulkAssessmentEmails(
        items,
        senderName || 'Divisi HRD & People Development',
        currentPeriod,
        actionType,
        extraCcs,
        undefined,
        (current, total, currentName) => {
          setSendingProgress({ current, total, name: currentName });
        }
      );

      // Re-read gmail info in case it was authorized just in time
      setGmailInfo(getConnectedGmailInfo());

      const now = new Date().toISOString();
      const selectedIdSet = new Set(targetAssessments.map((a) => a.id));

      const updatedList = assessments.map((a) => {
        if (selectedIdSet.has(a.id)) {
          return {
            ...a,
            publishedStatus: 'published' as const,
            publishedAt: a.publishedAt || now,
            lastNotifiedAt: now,
            notificationRecipientEmail:
              emailOverrides[a.id] || resolveEmployeeEmail(employeeMap.get(a.employeeId), a),
            notificationCount: (a.notificationCount || 0) + 1,
          };
        }
        return a;
      });

      setIsSubmitting(false);
      setSendingProgress(null);

      onNotificationSent(
        updatedList,
        `Berhasil mempublikasikan & mengirimkan ${result.count} email notifikasi hasil penilaian via Gmail!`
      );

      setSubmitResult({
        success: result.success,
        message: `Berhasil mengirim ${result.count} email notifikasi secara nyata ke inbox karyawan!`,
        details: `Email laporan evaluasi periode ${formatPeriodIndonesian(
          currentPeriod
        )} telah terkirim via Gmail API${
          extraCcs.length > 0 ? ` (Tembusan ke: ${extraCcs.join(', ')})` : ''
        }.${result.failedCount > 0 ? ` (${result.failedCount} gagal).` : ''}`,
      });
    } catch (err: any) {
      setIsSubmitting(false);
      setSendingProgress(null);
      setSubmitResult({
        success: false,
        message: err?.message || 'Gagal mengirim notifikasi email via Gmail.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[94vh] flex flex-col text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="bg-slate-900 dark:bg-slate-950 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <span>Kirim Email Notifikasi Karyawan (Ceklis Custom)</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                  {selectedCount} dari {countTotal} Dipilih
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Pilih karyawan dengan kolom ceklis untuk mengirimkan hasil evaluasi kinerja periode {formatPeriodIndonesian(currentPeriod)} langsung ke inbox email
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Gmail Connection Status Banner */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
              gmailInfo.isConnected
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200'
            }`}
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  gmailInfo.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <div className="truncate">
                <div className="font-bold text-xs">
                  {gmailInfo.isConnected
                    ? `Akun Gmail Terhubung: ${gmailInfo.email}`
                    : 'Akun Gmail Belum Terhubung (Diperlukan untuk Mengirim Nyata ke Inbox)'}
                </div>
                <div className="text-[10px] opacity-85">
                  {gmailInfo.isConnected
                    ? 'Sistem siap mengirimkan email langsung ke inbox masing-masing karyawan melalui Gmail API.'
                    : 'Klik tombol di kanan untuk mengizinkan aplikasi mengirim email resmi melalui akun Gmail HR Anda.'}
                </div>
              </div>
            </div>

            {gmailInfo.isConnected ? (
              <button
                type="button"
                onClick={handleDisconnectGmail}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-slate-700 rounded-lg text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 transition shrink-0 cursor-pointer"
              >
                Ganti Akun
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnectGmail}
                disabled={isConnectingGmail}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition shrink-0 flex items-center space-x-1 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{isConnectingGmail ? 'Menghubungkan...' : 'Hubungkan Akun Gmail HR'}</span>
              </button>
            )}
          </div>

          {/* Progress Indicator */}
          {sendingProgress && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl space-y-1.5">
              <div className="flex justify-between font-bold text-blue-900 dark:text-blue-200 text-xs">
                <span className="flex items-center space-x-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600 dark:text-blue-400" />
                  <span>Mengirim ke: {sendingProgress.name}...</span>
                </span>
                <span>
                  {sendingProgress.current} / {sendingProgress.total} Karyawan
                </span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-900/60 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-200"
                  style={{
                    width: `${(sendingProgress.current / sendingProgress.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {submitResult && (
            <div
              className={`p-4 rounded-xl border flex items-start space-x-2.5 ${
                submitResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200'
              }`}
            >
              {submitResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-bold">{submitResult.message}</div>
                {submitResult.details && (
                  <div className="text-[11px] opacity-85 mt-0.5">{submitResult.details}</div>
                )}
              </div>
            </div>
          )}

          {/* Top Quick Filters and Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-center">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">Total Karyawan</span>
              <span className="text-lg font-black text-slate-900 dark:text-white font-mono">{countTotal}</span>
            </div>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl text-center">
              <span className="text-[10px] text-blue-700 dark:text-blue-300 block uppercase font-bold">Terpilih (Centang)</span>
              <span className="text-lg font-black text-blue-800 dark:text-blue-300 font-mono">{selectedCount}</span>
            </div>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-center">
              <span className="text-[10px] text-amber-700 dark:text-amber-300 block uppercase font-bold">Belum Kirim (Draft)</span>
              <span className="text-lg font-black text-amber-800 dark:text-amber-300 font-mono">{countDraft}</span>
            </div>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-center">
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block uppercase font-bold">Sudah Terkirim</span>
              <span className="text-lg font-black text-emerald-800 dark:text-emerald-300 font-mono">{countPublished}</span>
            </div>
          </div>

          {/* Action Type Selection */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300 block">Tipe Pengiriman Notifikasi:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActionType('published')}
                className={`p-2.5 rounded-xl border text-left font-semibold transition cursor-pointer ${
                  actionType === 'published'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                📢 Publikasi Resmi Nilai
                <span className="block text-[10px] font-normal opacity-85 mt-0.5">
                  Rilis resmi pertama kali evaluasi kinerja bulanan ke inbox karyawan
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActionType('updated')}
                className={`p-2.5 rounded-xl border text-left font-semibold transition cursor-pointer ${
                  actionType === 'updated'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                ✏️ Pembaruan / Koreksi Nilai
                <span className="block text-[10px] font-normal opacity-85 mt-0.5">
                  Pemberitahuan perubahan skor setelah rekalkulasi atau penyesuaian HR
                </span>
              </button>
            </div>
          </div>

          {/* Checkbox Management & Search Toolbar */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 space-y-2.5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari nama karyawan, NIK, divisi, atau email..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Quick Select Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-2.5 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg text-slate-700 dark:text-slate-200 font-semibold transition cursor-pointer"
                >
                  Pilih Semua ({countTotal})
                </button>
                <button
                  type="button"
                  onClick={handleSelectDraftOnly}
                  className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-lg text-amber-800 dark:text-amber-300 font-semibold transition cursor-pointer"
                >
                  Hanya Draft ({countDraft})
                </button>
                <button
                  type="button"
                  onClick={handleSelectGradeAOnly}
                  className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg text-emerald-800 dark:text-emerald-300 font-semibold transition cursor-pointer"
                >
                  Grade A ({countGradeA})
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="px-2 py-1 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg text-rose-700 dark:text-rose-300 font-medium transition cursor-pointer"
                >
                  Batal Centang
                </button>
              </div>
            </div>

            {/* Additional CC / Extra email inputs */}
            <div className="border-t border-slate-200/80 dark:border-slate-700/80 pt-2 flex flex-col sm:flex-row sm:items-center gap-2 text-[11px]">
              <span className="font-bold text-slate-700 dark:text-slate-300 shrink-0">
                Tembusan CC / Email Tambahan (Opsional):
              </span>
              <input
                type="text"
                value={customCcEmails}
                onChange={(e) => setCustomCcEmails(e.target.value)}
                placeholder="saputradonny17@gmail.com, direksi@perusahaan.com (pisahkan dengan koma)"
                className="flex-1 px-2.5 py-1 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Recipient Checklist Table (KOLOM CEKLIS UTAMA) */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between font-bold text-slate-700 dark:text-slate-200 text-xs">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="select-all-filtered"
                  checked={isAllFilteredSelected}
                  onChange={handleToggleSelectAllFiltered}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="select-all-filtered" className="cursor-pointer">
                  Kolom Ceklis &bull; Centang Penerima ({selectedCount} Dipilih)
                </label>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                Menampilkan {filteredAssessments.length} Karyawan
              </span>
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredAssessments.length === 0 ? (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500">
                  Tidak ada karyawan yang cocok dengan kata kunci pencarian.
                </div>
              ) : (
                filteredAssessments.map((a) => {
                  const emp = employeeMap.get(a.employeeId);
                  const isChecked = selectedIds.has(a.id);
                  const currentEmail = emailOverrides[a.id] || resolveEmployeeEmail(emp, a);
                  const isEditingEmail = editingEmailId === a.id;

                  return (
                    <div
                      key={a.id}
                      className={`p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition ${
                        isChecked ? 'bg-blue-50/40 dark:bg-blue-950/30 hover:bg-blue-50/70 dark:hover:bg-blue-950/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 opacity-75 dark:opacity-85'
                      }`}
                    >
                      {/* Left: Checkbox + Employee identity */}
                      <div className="flex items-start sm:items-center space-x-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleOne(a.id)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer mt-0.5 sm:mt-0 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <span className="font-bold text-slate-900 dark:text-white">{a.employeeName}</span>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">({a.employeeNik})</span>
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold border border-slate-200 dark:border-slate-700">
                              {a.division}
                            </span>
                          </div>

                          {/* Email target with inline edit */}
                          <div className="flex items-center space-x-1.5 mt-0.5">
                            {isEditingEmail ? (
                              <div className="flex items-center space-x-1">
                                <input
                                  type="email"
                                  defaultValue={currentEmail}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const val = (e.target as HTMLInputElement).value.trim();
                                      if (val) {
                                        setEmailOverrides((prev) => ({ ...prev, [a.id]: val }));
                                      }
                                      setEditingEmailId(null);
                                    } else if (e.key === 'Escape') {
                                      setEditingEmailId(null);
                                    }
                                  }}
                                  onBlur={(e) => {
                                    const val = e.target.value.trim();
                                    if (val) {
                                      setEmailOverrides((prev) => ({ ...prev, [a.id]: val }));
                                    }
                                    setEditingEmailId(null);
                                  }}
                                  autoFocus
                                  className="px-1.5 py-0.5 border border-blue-500 rounded text-[11px] font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                                />
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">(Enter untuk simpan)</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1">
                                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-mono">{currentEmail}</span>
                                <button
                                  type="button"
                                  onClick={() => setEditingEmailId(a.id)}
                                  title="Ubah email penerima untuk karyawan ini"
                                  className="p-0.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Score, Grade, Status */}
                      <div className="flex items-center space-x-3 self-end sm:self-auto shrink-0">
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                            {a.finalScore.toFixed(2)}
                          </span>
                          <span className="ml-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                            Grade {a.grade}
                          </span>
                        </div>

                        <div>
                          {a.publishedStatus === 'published' ? (
                            <span
                              title={`Sudah pernah dikirim pada ${
                                a.lastNotifiedAt
                                  ? new Date(a.lastNotifiedAt).toLocaleDateString('id-ID')
                                  : ''
                              }`}
                              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 inline-flex items-center space-x-0.5"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span>Terkirim</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                              Draft
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Info notice */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl text-blue-900 dark:text-blue-200 text-[11px] leading-relaxed flex items-start space-x-2">
            <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Pengiriman Nyata via Gmail API: </span>
              Setiap karyawan yang dicentang akan menerima email laporan kinerja resmi ke kotak masuk mereka langsung dari akun Gmail Anda.
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-t border-slate-200 dark:border-slate-800">
            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Total Siap Dikirim: <strong className="text-blue-700 dark:text-blue-400">{selectedCount}</strong> Karyawan
            </div>

            <div className="flex items-center space-x-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition font-semibold cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={isSubmitting || selectedCount === 0}
                onClick={handleSendSelected}
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {isSubmitting
                    ? 'Sedang Mengirim ke Inbox...'
                    : `Kirim Notifikasi Nyata ke (${selectedCount}) Karyawan Terpilih`}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
