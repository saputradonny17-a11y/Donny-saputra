import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  Upload,
  Calendar,
  BookOpen,
  Users,
  LayoutDashboard,
  CheckSquare,
  Target,
  Database,
  Eye,
  Shield,
  FileSpreadsheet,
  Plus,
  Lock,
  LogOut,
  UserCheck,
  KeyRound,
  Sliders,
  ChevronDown,
  Mail,
  User,
  LogIn,
  Clock,
  CalendarCheck
} from 'lucide-react';
import { getConnectedGmailInfo, requestGoogleAccessToken, clearGoogleSession } from '../utils/googleAuth';
import { ThemeToggle } from './ThemeToggle';
import { getPeriodDateFormatted } from '../utils/assessmentDatabase';
import { HeaderCalendarPicker } from './HeaderCalendarPicker';

interface Props {
  currentPeriod: string;
  onPeriodChange: (period: string) => void;
  currentDate?: string;
  onDateChange?: (dateStr: string) => void;
  availablePeriods: string[];
  activeTab: 'dashboard' | 'sikap' | 'kpi' | 'master' | 'master-sikap' | 'master-kpi' | 'employees';
  onTabChange: (tab: 'dashboard' | 'sikap' | 'kpi' | 'master' | 'master-sikap' | 'master-kpi' | 'employees') => void;
  onExportExcel: () => void;
  onOpenImport: () => void;
  onOpenExplainer: () => void;
  onAddNewPeriod: () => void;
  userRole: 'admin' | 'employee';
  onToggleRole: () => void;
  isHrAuthenticated: boolean;
  hrUser: { name: string; username: string; role: string } | null;
  onOpenHrLogin: () => void;
  onHrLogout: () => void;
  onOpenChangePassword?: () => void;
  onOpenEmailLogs?: () => void;
  onOpenHistoryModal?: () => void;
  selectedEmployeeName?: string;
}

export const Header: React.FC<Props> = ({
  currentPeriod,
  onPeriodChange,
  currentDate,
  onDateChange,
  availablePeriods,
  activeTab,
  onTabChange,
  onExportExcel,
  onOpenImport,
  onOpenExplainer,
  onAddNewPeriod,
  userRole,
  onToggleRole,
  isHrAuthenticated,
  hrUser,
  onOpenHrLogin,
  onHrLogout,
  onOpenChangePassword,
  onOpenEmailLogs,
  onOpenHistoryModal,
}) => {
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [gmailStatus, setGmailStatus] = useState<{ isConnected: boolean; email?: string }>(getConnectedGmailInfo());
  const accountMenuRef = useRef<HTMLDivElement>(null);

  // Sync Gmail status when dropdown opens
  useEffect(() => {
    if (isAccountDropdownOpen) {
      setGmailStatus(getConnectedGmailInfo());
    }
  }, [isAccountDropdownOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format period for display with complete date (e.g. "2026-09" -> "Kamis, 24 September 2026")
  const formatPeriodFullDate = (periodStr: string) => {
    return getPeriodDateFormatted(periodStr, true);
  };

  const isHrMode = isHrAuthenticated && userRole === 'admin';
  const currentDateFormatted = getPeriodDateFormatted(currentPeriod, true);

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-lg border-b border-slate-800">
      {/* Top Banner & Main Action Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Left: Logo, Title, System Mode */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/30 shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                  Sistem Penilaian KPI & Absensi
                </h1>
                {isHrMode ? (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-indigo-400" />
                    <span>Mode HR</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                    <Eye className="w-3 h-3 text-emerald-400" />
                    <span>Portal Karyawan</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                {isHrMode
                  ? 'Panel Kelola Penilaian Karyawan, Sikap, KPI, & Database Resmi'
                  : 'Lihat Transparansi Skor Pribadi, Evaluasi Kinerja & Unduh Slip Rapor'}
              </p>
            </div>
          </div>

          {/* Right: Operational Controls & Consolidated Account Column */}
          <div className="flex flex-wrap items-center gap-2 justify-start lg:justify-end">
            {/* Interactive Calendar Picker (Pilih Tanggal, Bulan & Tahun) */}
            <div className="flex items-center gap-1">
              <HeaderCalendarPicker
                selectedDate={currentDate || (currentPeriod ? `${currentPeriod}-24` : '2026-09-24')}
                onSelectDate={(newDate) => {
                  if (onDateChange) {
                    onDateChange(newDate);
                  } else {
                    onPeriodChange(newDate.substring(0, 7));
                  }
                }}
                availablePeriods={availablePeriods}
                isHrMode={isHrMode}
              />

              {isHrMode && (
                <button
                  onClick={onAddNewPeriod}
                  title="Buka Periode Penilaian Baru"
                  className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick 'Cek Riwayat' Button in Header for fast history search */}
            {onOpenHistoryModal && (
              <button
                type="button"
                onClick={onOpenHistoryModal}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                title="Cek Riwayat Penilaian Lintas Hari, Tanggal, Bulan & Tahun"
              >
                <CalendarCheck className="w-3.5 h-3.5 text-blue-200" />
                <span>Cek Riwayat</span>
              </button>
            )}

            {/* Quick Guide Button */}
            <button
              onClick={onOpenExplainer}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-200 border border-slate-700 transition"
              title="Lihat Metodologi & Rumus Perhitungan Transparan"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Panduan Rumus</span>
            </button>

            {/* Global Theme Toggle */}
            <ThemeToggle />

            {/* HR-Only Primary Actions */}
            {isHrMode && (
              <>
                <button
                  onClick={onOpenImport}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-200 border border-slate-700 transition"
                  title="Impor Nilai dari File Excel"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden md:inline">Import</span>
                </button>

                <button
                  onClick={onExportExcel}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-900/30 transition"
                  title="Download file Excel 4-sheet lengkap"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Ekspor Excel</span>
                </button>

                {onOpenEmailLogs && (
                  <button
                    onClick={onOpenEmailLogs}
                    className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-200 border border-slate-700 transition"
                    title="Buka Log Pengiriman Email Notifikasi"
                  >
                    <Mail className="w-3.5 h-3.5 text-blue-400" />
                    <span className="hidden lg:inline">Log Email</span>
                  </button>
                )}

                {/* CONSOLIDATED HR ACCOUNT & PASSWORD MANAGEMENT MENU */}
                <div className="relative" ref={accountMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                    className="flex items-center space-x-2 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700/90 text-white rounded-lg border border-slate-700 text-xs font-medium transition cursor-pointer shadow-xs"
                    title="Menu Akun HR & Pengaturan Kata Sandi"
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-600/40 border border-blue-400/50 flex items-center justify-center text-[10px] font-bold text-blue-300">
                      {hrUser ? hrUser.name.charAt(0).toUpperCase() : 'H'}
                    </div>
                    <div className="text-left hidden sm:block max-w-[120px] truncate">
                      <div className="font-semibold text-white leading-tight truncate">
                        {hrUser ? hrUser.name : 'HR Admin'}
                      </div>
                      <div className="text-[10px] text-slate-400 leading-tight">
                        {hrUser ? hrUser.role : 'Super Admin'}
                      </div>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${isAccountDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Popover */}
                  {isAccountDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                      {/* User Identity Header */}
                      <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/60 mb-1.5">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                            {hrUser ? hrUser.name.charAt(0).toUpperCase() : 'H'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-white truncate">{hrUser?.name || 'Administrator'}</div>
                            <div className="text-[10px] text-blue-300 font-mono truncate">{hrUser?.username || 'admin'}</div>
                            <div className="text-[10px] text-slate-400">{hrUser?.role || 'HR Super Admin'}</div>
                          </div>
                        </div>
                      </div>

                      {/* Kelola Kata Sandi */}
                      {onOpenChangePassword && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsAccountDropdownOpen(false);
                            onOpenChangePassword();
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 transition flex items-center space-x-2.5 font-medium cursor-pointer"
                        >
                          <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
                          <div>
                            <span className="block font-semibold">Kelola Kata Sandi</span>
                            <span className="block text-[10px] text-slate-400">Ubah sandi atau kirim link Gmail</span>
                          </div>
                        </button>
                      )}

                      {/* Pratinjau Karyawan */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsAccountDropdownOpen(false);
                          onToggleRole();
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 transition flex items-center space-x-2.5 font-medium cursor-pointer"
                      >
                        <Eye className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <span className="block font-semibold">Pratinjau Karyawan</span>
                          <span className="block text-[10px] text-slate-400">Lihat tampilan yang dilihat staf</span>
                        </div>
                      </button>

                      {/* Log Notifikasi Email */}
                      {onOpenEmailLogs && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsAccountDropdownOpen(false);
                            onOpenEmailLogs();
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 transition flex items-center space-x-2.5 font-medium cursor-pointer"
                        >
                          <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                          <div>
                            <span className="block font-semibold">Riwayat Email Notifikasi</span>
                            <span className="block text-[10px] text-slate-400">Cek status pengiriman hasil</span>
                          </div>
                        </button>
                      )}

                      {/* Status Integrasi Gmail Pengirim */}
                      <div className="mt-1 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs">
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Status Gmail HR:</span>
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              gmailStatus.isConnected
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                gmailStatus.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                              }`}
                            />
                            {gmailStatus.isConnected ? 'Aktif' : 'Belum Terhubung'}
                          </span>
                        </div>
                        {gmailStatus.isConnected ? (
                          <div className="space-y-1">
                            <div className="text-[11px] text-slate-300 truncate font-mono">
                              {gmailStatus.email}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                clearGoogleSession();
                                setGmailStatus({ isConnected: false });
                              }}
                              className="text-[10px] text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
                            >
                              Putus Hubungan Gmail
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await requestGoogleAccessToken(true);
                                setGmailStatus(getConnectedGmailInfo());
                              } catch (e: any) {
                                alert(`Gagal menghubungkan Gmail: ${e?.message || 'Dibatalkan'}`);
                              }
                            }}
                            className="w-full mt-1 py-1 px-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-[11px] transition text-center cursor-pointer"
                          >
                            Hubungkan Akun Gmail HR
                          </button>
                        )}
                      </div>

                      <div className="my-1 border-t border-slate-800"></div>

                      {/* Logout */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsAccountDropdownOpen(false);
                          onHrLogout();
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-rose-300 hover:text-rose-200 hover:bg-rose-950/40 transition flex items-center space-x-2.5 font-semibold cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>Keluar Sesi HR</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* When in Employee Mode: Show Login HR Button */}
            {!isHrMode && (
              <div className="flex items-center space-x-2">
                {isHrAuthenticated ? (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={onToggleRole}
                      className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-900/30 transition cursor-pointer"
                      title="Kembali ke Mode HR"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Kembali ke Mode HR</span>
                    </button>
                    <button
                      onClick={onHrLogout}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded-lg transition"
                      title="Keluar Sesi HR"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={onOpenHrLogin}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-900/40 border border-blue-400/30 transition cursor-pointer"
                    title="Masuk sebagai HRD / Manajemen untuk mengelola penilaian"
                  >
                    <Lock className="w-3.5 h-3.5 text-blue-200" />
                    <span>Masuk Mode HR</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Bar (100% WIDE, CLEAN, FREE FROM ANY OBSTRUCTION) */}
      {isHrMode ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800">
          <nav className="w-full flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none text-xs font-medium">
            <button
              onClick={() => onTabChange('dashboard')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition whitespace-nowrap cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>1. Dashboard Nilai Akhir</span>
            </button>

            <button
              onClick={() => onTabChange('sikap')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition whitespace-nowrap cursor-pointer ${
                activeTab === 'sikap'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>2. Penilaian Sikap (A)</span>
            </button>

            <button
              onClick={() => onTabChange('kpi')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition whitespace-nowrap cursor-pointer ${
                activeTab === 'kpi'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>3. Penilaian KPI (B)</span>
            </button>

            <button
              onClick={() => onTabChange('employees')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition whitespace-nowrap cursor-pointer ${
                activeTab === 'employees'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Database Karyawan</span>
            </button>

            <button
              onClick={() => onTabChange('master-sikap')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition whitespace-nowrap cursor-pointer ${
                activeTab === 'master-sikap' || activeTab === 'master'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>4. Master Sikap & Absensi</span>
            </button>

            <button
              onClick={() => onTabChange('master-kpi')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition whitespace-nowrap cursor-pointer ${
                activeTab === 'master-kpi'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>5. Master KPI Divisi</span>
            </button>
          </nav>
        </div>
      ) : (
        /* Employee Mode Notice Bar */
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800 py-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2 text-emerald-300">
              <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Mode Karyawan:</strong> Akses transparan penilaian kinerja pribadi.
                Rekapitulasi perusahaan dan lembar penilaian HR diproteksi dan memerlukan login resmi.
              </span>
            </div>
            <div className="flex items-center space-x-3 text-slate-400 shrink-0">
              <span className="flex items-center space-x-1">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Mode HR Terkunci</span>
              </span>
              <button
                onClick={onOpenHrLogin}
                className="text-blue-400 hover:text-blue-300 font-semibold underline cursor-pointer"
              >
                Login HR disini
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
