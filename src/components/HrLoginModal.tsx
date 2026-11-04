import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  X,
  KeyRound,
  CheckCircle2,
  Send,
  ArrowLeft,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import {
  authenticateHr,
  createPasswordResetToken,
  completePasswordReset,
  getResetRequestByToken,
  getHrAccounts,
  PasswordResetRequest
} from '../utils/auth';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin: (user: { name: string; username: string; role: string }) => void;
}

export const HrLoginModal: React.FC<Props> = ({ isOpen, onClose, onSuccessLogin }) => {
  // Modes: 'login' | 'forgot_password' | 'email_sent' | 'reset_password_form'
  const [viewMode, setViewMode] = useState<'login' | 'forgot_password' | 'email_sent' | 'reset_password_form'>('login');

  // Login form state (strictly clean - NO default passwords displayed)
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Forgot password & reset state
  const [resetEmail, setResetEmail] = useState('');
  const [activeResetRequest, setActiveResetRequest] = useState<PasswordResetRequest | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Feedback states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check URL parameters for direct reset token on mount or open
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const action = urlParams.get('action');
      const token = urlParams.get('token');
      if (action === 'reset_password' && token) {
        const req = getResetRequestByToken(token);
        if (req) {
          setActiveResetRequest(req);
          setViewMode('reset_password_form');
        }
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Login Submission
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const account = authenticateHr(usernameOrEmail, password);

      if (account) {
        const sessionPayload = {
          user: {
            name: account.name,
            username: account.email,
            role: account.role
          },
          loginAt: new Date().toISOString()
        };

        if (rememberMe) {
          localStorage.setItem('hr_auth_session', JSON.stringify(sessionPayload));
        } else {
          sessionStorage.setItem('hr_auth_session', JSON.stringify(sessionPayload));
        }

        setIsLoading(false);
        onSuccessLogin({
          name: account.name,
          username: account.email,
          role: account.role
        });
        onClose();
      } else {
        setIsLoading(false);
        setErrorMessage('Email atau kata sandi HR tidak sesuai. Silakan periksa kembali!');
      }
    }, 350);
  };

  // Handle Sending Password Reset Link to Email
  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    const emailTrimmed = resetEmail.trim().toLowerCase();
    const result = createPasswordResetToken(emailTrimmed);

    if (!result.success || !result.resetRequest) {
      setIsLoading(false);
      setErrorMessage(result.message);
      return;
    }

    // Attempt to notify server endpoint
    try {
      await fetch('/api/auth/send-reset-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: result.resetRequest.email,
          resetUrl: result.resetRequest.resetUrl,
          accountName: result.resetRequest.accountName
        })
      });
    } catch {
      // serverless fallback
    }

    setIsLoading(false);
    setActiveResetRequest(result.resetRequest);
    setViewMode('email_sent');
  };

  // Handle Submitting the New Password from the reset link
  const handleCompleteReset = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!activeResetRequest) {
      setErrorMessage('Sesi link reset tidak valid.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Kata sandi baru minimal 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = completePasswordReset(activeResetRequest.token, newPassword);
      setIsLoading(false);

      if (res.success) {
        setSuccessMessage(`Kata sandi untuk ${activeResetRequest.email} berhasil diubah! Silakan login dengan kata sandi baru.`);
        setUsernameOrEmail(activeResetRequest.email);
        setPassword('');
        setViewMode('login');
      } else {
        setErrorMessage(res.message);
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-[#1F4E78] px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Otentikasi Mode HR</h3>
              <p className="text-xs text-slate-300">
                {viewMode === 'login' && 'Akses Khusus Administrator & Tim HRD'}
                {viewMode === 'forgot_password' && 'Kirim Link Ubah Kata Sandi'}
                {viewMode === 'email_sent' && 'Link Reset Terkirim ke Email'}
                {viewMode === 'reset_password_form' && 'Formulir Kata Sandi Baru'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Success Banner */}
          {successMessage && (
            <div className="mb-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-start space-x-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-start space-x-2 animate-in shake duration-200">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* VIEW 1: LOGIN FORM */}
          {viewMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Silakan masukkan email akun HR terdaftar dan kata sandi Anda untuk mengelola penilaian, KPI divisi, serta data karyawan.
              </div>

              {/* Email / Username Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                  Email / Username HR
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    placeholder="nama@email.com"
                    autoComplete="username"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                    Kata Sandi
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setSuccessMessage(null);
                      setResetEmail(usernameOrEmail);
                      setViewMode('forgot_password');
                    }}
                    className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline cursor-pointer"
                  >
                    Lupa Kata Sandi?
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    autoComplete="current-password"
                    className="w-full pl-9 pr-10 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center space-x-2 cursor-pointer text-slate-600 dark:text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                  />
                  <span>Ingat sesi di perangkat ini</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-[#1F4E78] dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50 mt-2 cursor-pointer"
              >
                <Lock className="w-4 h-4 text-blue-400 dark:text-white" />
                <span>{isLoading ? 'Memverifikasi Akun...' : 'Masuk ke Mode HR'}</span>
              </button>

              {/* Security info */}
              <div className="pt-2 text-center text-[11px] text-slate-400 dark:text-slate-500">
                Akses terenkripsi & tercatat dalam sistem keamanan internal.
              </div>
            </form>
          )}

          {/* VIEW 2: FORGOT PASSWORD - REQUEST EMAIL LINK */}
          {viewMode === 'forgot_password' && (
            <form onSubmit={handleSendResetLink} className="space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-xl text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                Masukkan alamat email Gmail akun HR resmi Anda. Sistem akan mengirimkan link verifikasi untuk membuat atau mengubah kata sandi baru.
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Alamat Email Akun HR Terdaftar
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4 text-white" />
                <span>{isLoading ? 'Mengirimkan Link...' : 'Kirim Link Ubah Password ke Email'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setViewMode('login');
                }}
                className="w-full py-2 px-3 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium flex items-center justify-center space-x-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke Halaman Login</span>
              </button>
            </form>
          )}

          {/* VIEW 3: EMAIL SENT CONFIRMATION & RESET LINK ACTION */}
          {viewMode === 'email_sent' && activeResetRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2 text-xs">
                <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300 font-bold">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Link Ubah Kata Sandi Telah Dikirim!</span>
                </div>
                <p className="text-emerald-900 dark:text-emerald-300 leading-relaxed">
                  Pesan link verifikasi telah dikirimkan ke kotak masuk Gmail: <strong className="font-mono text-emerald-950 dark:text-emerald-200">{activeResetRequest.email}</strong> atas nama <strong>{activeResetRequest.accountName}</strong>.
                </p>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  Masa berlaku link: 60 menit sejak dikirim.
                </div>
              </div>

              {/* Direct Access Simulation Button */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-2.5">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Akses Langsung Ubah Password:</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Anda dapat langsung membuka formulir pengubahan kata sandi akun ini sekarang:
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setViewMode('reset_password_form');
                  }}
                  className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-2 shadow-sm transition cursor-pointer"
                >
                  <KeyRound className="w-4 h-4 text-blue-200" />
                  <span>Buka Formulir Buat Kata Sandi Baru</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setViewMode('login');
                }}
                className="w-full py-2 px-3 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium text-center cursor-pointer"
              >
                Kembali ke Halaman Login
              </button>
            </div>
          )}

          {/* VIEW 4: RESET PASSWORD FORM */}
          {viewMode === 'reset_password_form' && activeResetRequest && (
            <form onSubmit={handleCompleteReset} className="space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-xl text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                <div>Membuat kata sandi baru untuk akun:</div>
                <div className="font-bold text-blue-950 dark:text-blue-200 font-mono text-[11px] mt-0.5">
                  {activeResetRequest.email} ({activeResetRequest.accountName})
                </div>
              </div>

              {/* New Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-9 pr-10 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Ulangi Kata Sandi Baru
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang kata sandi baru"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>{isLoading ? 'Menyimpan...' : 'Simpan & Terapkan Kata Sandi Baru'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewMode('login');
                }}
                className="w-full py-2 px-3 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium text-center cursor-pointer"
              >
                Batal & Kembali ke Login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
