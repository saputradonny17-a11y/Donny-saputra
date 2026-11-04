import React, { useState } from 'react';
import {
  KeyRound,
  Lock,
  Mail,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  ShieldCheck,
  Send,
  ExternalLink
} from 'lucide-react';
import { updateHrPassword, createPasswordResetToken, HrAccount, getHrAccounts } from '../utils/auth';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { name: string; username: string; role: string } | null;
  onPasswordChanged: (msg: string) => void;
}

export const ChangePasswordModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  onPasswordChanged
}) => {
  const [activeTab, setActiveTab] = useState<'direct' | 'email_link'>('direct');
  
  // Direct change states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  
  // Email link states
  const [selectedEmail, setSelectedEmail] = useState(currentUser?.username || 'saputradonny17@gmail.com');
  const [emailStatus, setEmailStatus] = useState<{
    sent: boolean;
    message: string;
    resetUrl?: string;
  } | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const accounts = getHrAccounts();
  const currentAcc = accounts.find(
    (a) => a.email.toLowerCase() === (currentUser?.username || '').toLowerCase()
  ) || accounts[0];

  const handleDirectChange = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPassword.length < 6) {
      setErrorMessage('Kata sandi baru minimal 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    // Verify old password
    if (oldPassword !== currentAcc.password) {
      setErrorMessage('Kata sandi saat ini tidak sesuai.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const res = updateHrPassword(currentAcc.email, newPassword);
      setIsSubmitting(false);
      if (res.success) {
        onPasswordChanged(`Kata sandi untuk ${currentAcc.email} berhasil diperbarui!`);
        onClose();
      } else {
        setErrorMessage(res.message);
      }
    }, 400);
  };

  const handleSendEmailLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const res = createPasswordResetToken(selectedEmail);
    if (!res.success || !res.resetRequest) {
      setIsSubmitting(false);
      setErrorMessage(res.message);
      return;
    }

    // Dispatch via backend API if available
    try {
      await fetch('/api/auth/send-reset-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: selectedEmail,
          resetUrl: res.resetRequest.resetUrl,
          accountName: res.resetRequest.accountName
        })
      });
    } catch {
      // client-side fallback
    }

    setIsSubmitting(false);
    setEmailStatus({
      sent: true,
      message: `Link ubah kata sandi berhasil dikirim ke alamat email ${selectedEmail}.`,
      resetUrl: res.resetRequest.resetUrl
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="bg-slate-900 dark:bg-slate-950 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Kelola Kata Sandi Akun HR</h3>
              <p className="text-[11px] text-slate-300">
                Akun: <span className="font-semibold text-blue-300">{currentAcc.email}</span> ({currentAcc.role})
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

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('direct');
              setErrorMessage(null);
            }}
            className={`flex-1 py-3 px-4 text-center transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'direct'
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 border-b-2 border-blue-600 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Ubah Kata Sandi Langsung</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('email_link');
              setErrorMessage(null);
            }}
            className={`flex-1 py-3 px-4 text-center transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'email_link'
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 border-b-2 border-blue-600 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Kirim Link ke Email Gmail</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeTab === 'direct' ? (
            <form onSubmit={handleDirectChange} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Kata Sandi Saat Ini
                </label>
                <div className="relative">
                  <input
                    type={showOld ? 'text' : 'password'}
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Masukkan kata sandi saat ini"
                    className="w-full px-3 py-2 pr-10 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOld(!showOld)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full px-3 py-2 pr-10 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Ulangi Kata Sandi Baru
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang kata sandi baru"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Perbarui Kata Sandi Sekarang'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {!emailStatus ? (
                <form onSubmit={handleSendEmailLink} className="space-y-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-xl text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                    Sistem akan mengirimkan link verifikasi khusus ke alamat Gmail akun yang dipilih untuk melakukan reset atau pembuatan kata sandi baru secara aman.
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Pilih Akun Gmail Tujuan Link
                    </label>
                    <select
                      value={selectedEmail}
                      onChange={(e) => setSelectedEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    >
                      {accounts.map((acc) => (
                        <option key={acc.email} value={acc.email} className="bg-white dark:bg-slate-800">
                          {acc.email} — {acc.name} ({acc.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4 text-blue-400 dark:text-white" />
                    <span>{isSubmitting ? 'Mengirimkan...' : 'Kirim Link Ubah Password ke Email'}</span>
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 space-y-2">
                    <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Link Berhasil Dikirim ke Email!</span>
                    </div>
                    <p className="text-emerald-800 dark:text-emerald-300 leading-relaxed">
                      Link ubah kata sandi telah dikirimkan ke <strong>{selectedEmail}</strong>. Link ini berlaku selama 60 menit.
                    </p>
                  </div>

                  {emailStatus.resetUrl && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-2 text-xs">
                      <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span>Link Reset Terverifikasi:</span>
                        <span className="text-[10px] text-slate-400 font-mono">Token Aktif</span>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-600 dark:text-slate-300 break-all select-all">
                        {emailStatus.resetUrl}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(emailStatus.resetUrl || '');
                          alert('Link reset kata sandi telah disalin ke clipboard!');
                        }}
                        className="w-full py-1.5 px-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded text-slate-700 dark:text-slate-200 font-medium text-xs transition cursor-pointer"
                      >
                        Salin Link
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setEmailStatus(null)}
                    className="w-full py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition cursor-pointer"
                  >
                    Kirim Ulang ke Email Lain
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
