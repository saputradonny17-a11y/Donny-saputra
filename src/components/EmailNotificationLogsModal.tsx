import React, { useState, useEffect } from 'react';
import {
  Mail,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Trash2,
  RotateCw,
  Send,
  ExternalLink
} from 'lucide-react';
import { EmailNotificationLog } from '../types';
import { getStoredEmailLogs, formatPeriodIndonesian } from '../utils/emailNotificationService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onResend?: (log: EmailNotificationLog) => void;
}

export const EmailNotificationLogsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onResend
}) => {
  const [logs, setLogs] = useState<EmailNotificationLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const reloadLogs = () => {
    setLogs(getStoredEmailLogs());
  };

  useEffect(() => {
    if (isOpen) {
      reloadLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter(
    (l) =>
      l.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.employeeNik.includes(searchTerm) ||
      l.recipientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.period.includes(searchTerm)
  );

  const handleClearLogs = () => {
    if (confirm('Hapus seluruh riwayat log pengiriman email?')) {
      localStorage.removeItem('kpi_email_notification_logs_v1');
      setLogs([]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="bg-slate-900 dark:bg-slate-950 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span>Riwayat & Log Pengiriman Email Notifikasi Karyawan</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/30 text-blue-300">
                  {logs.length} Tercatat
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">
                Catatan bukti pengiriman email hasil evaluasi kinerja bulanan oleh HRD
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

        {/* Filter bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama karyawan, NIK, atau email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={reloadLogs}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-lg text-slate-700 dark:text-slate-200 font-medium transition flex items-center space-x-1 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Segarkan</span>
            </button>
            {logs.length > 0 && (
              <button
                onClick={handleClearLogs}
                className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg text-rose-700 dark:text-rose-300 font-medium transition flex items-center space-x-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Hapus Log</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Table */}
        <div className="p-4 overflow-y-auto flex-1">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-2">
              <Mail className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-xs">Belum ada catatan log email notifikasi yang dikirimkan.</p>
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Waktu Kirim</th>
                    <th className="py-2.5 px-3">Karyawan & Penerima</th>
                    <th className="py-2.5 px-3 text-center">Periode</th>
                    <th className="py-2.5 px-3 text-center">Skor / Grade</th>
                    <th className="py-2.5 px-3 text-center">Tipe Aksi</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition">
                      <td className="py-2.5 px-3 text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(log.sentAt).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <div className="font-bold text-slate-900 dark:text-white">{log.employeeName}</div>
                        <div className="text-[11px] text-blue-600 dark:text-blue-400 font-mono">{log.recipientEmail}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">NIK: {log.employeeNik}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap font-sans text-[11px] text-slate-700 dark:text-slate-300">
                        {formatPeriodIndonesian(log.period)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="font-bold text-slate-900 dark:text-white">{log.finalScore.toFixed(2)}</span>
                        <span className="ml-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                          Grade {log.grade}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-sans">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.actionType === 'published'
                              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                              : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900'
                          }`}
                        >
                          {log.actionType === 'published' ? 'Publikasi' : 'Pembaruan'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-sans">
                        <span className="inline-flex items-center space-x-1 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Terkirim</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
