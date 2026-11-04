import { Employee, MonthlyAssessment, EmailNotificationLog } from '../types';
import {
  getValidGoogleToken,
  requestGoogleAccessToken,
  sendGmailMessage,
  getConnectedGmailInfo,
  validateGmailToken,
  clearGoogleSession,
} from './googleAuth';

/**
 * Resolves the primary email address for an employee.
 * Checks emailKerja, personal email, previously saved notification email, or generates an official corporate alias.
 */
export const resolveEmployeeEmail = (
  employee?: Employee,
  assessment?: MonthlyAssessment
): string => {
  if (employee?.emailKerja && employee.emailKerja.trim()) {
    return employee.emailKerja.trim();
  }
  if (employee?.email && employee.email.trim()) {
    return employee.email.trim();
  }
  if (assessment?.notificationRecipientEmail && assessment.notificationRecipientEmail.trim()) {
    return assessment.notificationRecipientEmail.trim();
  }

  // Sensible default corporate email fallback based on nickname/name and NIK
  const baseName =
    employee?.nickname?.toLowerCase() ||
    assessment?.employeeName?.split(' ')[0]?.toLowerCase() ||
    'karyawan';
  const cleanName = baseName.replace(/[^a-z0-9]/g, '');
  const nik = assessment?.employeeNik || employee?.nik || '0000';
  return `${cleanName}.${nik}@pt-perusahaan.co.id`;
};

/**
 * Format Period string "2026-09" to readable Indonesian month "September 2026"
 */
export const formatPeriodIndonesian = (periodStr: string): string => {
  const [year, month] = periodStr.split('-');
  const monthNames: Record<string, string> = {
    '01': 'Januari',
    '02': 'Februari',
    '03': 'Maret',
    '04': 'April',
    '05': 'Mei',
    '06': 'Juni',
    '07': 'Juli',
    '08': 'Agustus',
    '09': 'September',
    '10': 'Oktober',
    '11': 'November',
    '12': 'Desember',
  };
  return `${monthNames[month] || month} ${year}`;
};

export interface EmailNotificationPayload {
  recipientEmail: string;
  employeeName: string;
  employeeNik: string;
  division: string;
  position: string;
  period: string;
  finalScore: number;
  grade: string;
  statusLabel: string;
  totalSkorA: number;
  totalSkorB: number;
  notes?: string;
  actionType: 'published' | 'updated' | 'manual_resend';
  publishedBy?: string;
  assessmentId?: string;
  employeeId?: string;
  ccEmails?: string[];
  reportScope?: 'harian' | 'mingguan' | 'bulanan' | 'tahunan';
  reportScopeLabel?: string;
  dailyAttendanceSummary?: string;
}

/**
 * Generates subject, plain text body, and responsive HTML body for notification emails
 */
export const generateEmailContent = (payload: EmailNotificationPayload) => {
  const isUpdate = payload.actionType === 'updated';
  const periodText = formatPeriodIndonesian(payload.period);
  const scopeType = payload.reportScope || 'bulanan';
  const scopeLabel = payload.reportScopeLabel || (
    scopeType === 'harian'
      ? `Laporan Harian (${periodText})`
      : scopeType === 'mingguan'
      ? `Laporan Mingguan (${periodText})`
      : scopeType === 'tahunan'
      ? `Laporan Tahunan (${payload.period.split('-')[0]})`
      : `Akumulasi Bulanan (${periodText})`
  );

  const scopeHeadlineTag =
    scopeType === 'harian'
      ? 'Laporan Kinerja Harian'
      : scopeType === 'mingguan'
      ? 'Laporan Kinerja Mingguan'
      : scopeType === 'tahunan'
      ? 'Laporan Kinerja Tahunan'
      : 'Laporan Akumulasi Bulanan';

  const actionHeadline = isUpdate
    ? `[Revisi HRD - ${scopeHeadlineTag}] ${scopeLabel}`
    : `[Laporan Resmi HRD - ${scopeHeadlineTag}] ${scopeLabel}`;

  const subject = `${actionHeadline} - ${payload.employeeName} (${payload.employeeNik})`;

  // Plain text fallback
  const textBody = `Kepada Yth. Sdr/i ${payload.employeeName},
NIK: ${payload.employeeNik}
Divisi / Jabatan: ${payload.division} - ${payload.position}

Dengan hormat,

Kami menginformasikan bahwa ${
    isUpdate
      ? 'pihak Manajemen & HRD telah melakukan pembaruan pada data penilaian'
      : 'pihak Manajemen & HRD telah mempublikasikan'
  } ${scopeLabel} untuk Anda.

==================================================
RINGKASAN ${scopeHeadlineTag.toUpperCase()}:
==================================================
• Tipe Laporan                 : ${scopeHeadlineTag}
• Cakupan / Periode Evaluasi   : ${scopeLabel}
${payload.dailyAttendanceSummary ? `• Rincian Presensi / Catatan : ${payload.dailyAttendanceSummary}\n` : ''}• Skor Sikap & Kedisiplinan (A): ${payload.totalSkorA.toFixed(2)} / 10.00 (Bobot 50%)
• Skor Capaian KPI Teknis (B)  : ${payload.totalSkorB.toFixed(2)} / 10.00 (Bobot 50%)
--------------------------------------------------
★ NILAI AKHIR (50% A + 50% B)  : ${payload.finalScore.toFixed(2)} / 10.00
★ GRADE PRESTASI               : GRADE ${payload.grade} (${payload.statusLabel})
==================================================

${
  payload.notes
    ? `Catatan & Arahan HRD:\n"${payload.notes}"\n\n`
    : ''
}KETERANGAN & EVALUASI:
${
  payload.grade === 'A'
    ? '• Selamat atas pencapaian kinerja istimewa! Anda memenuhi syarat untuk insentif prestasi dan apresiasi karyawan teladan.'
    : payload.grade === 'B'
    ? '• Performa kerja Anda telah memenuhi standar operasional dengan sangat baik. Pertahankan kedisiplinan dan capaian target Anda.'
    : payload.grade === 'C'
    ? '• Performa kerja berada pada kategori Cukup. Mohon berkoordinasi dengan atasan divisi untuk sesi bimbingan & akselerasi target KPI.'
    : '• Nilai berada di bawah standar operasional minimum. Anda dijadwalkan untuk sesi evaluasi bersama HRD terkait program pembinaan kinerja (PIP).'
}

Rincian lengkap transparansi rapor kinerja (${scopeLabel}) dapat diakses melalui Portal Karyawan pada aplikasi perusahaan.

Salam hangat,
Divisi HRD & People Development
Pengirim: ${payload.publishedBy || 'HR Administrator'}
Tanggal: ${new Date().toLocaleString('id-ID')}`;

  // Rich HTML template
  const gradeColor =
    payload.grade === 'A'
      ? '#059669'
      : payload.grade === 'B'
      ? '#2563eb'
      : payload.grade === 'C'
      ? '#d97706'
      : '#dc2626';

  const htmlBody = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 20px; background-color: #f8fafc; color: #1e293b; }
  .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
  .header { background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); color: #ffffff; padding: 24px; text-align: left; }
  .header h1 { margin: 0 0 4px 0; font-size: 18px; font-weight: 700; letter-spacing: -0.01em; }
  .header p { margin: 0; font-size: 12px; opacity: 0.85; }
  .badge-tag { display: inline-block; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; background: rgba(255,255,255,0.15); margin-top: 8px; }
  .content { padding: 24px; }
  .intro { font-size: 13px; line-height: 1.6; color: #334155; margin-bottom: 20px; }
  .card-emp { background: #f1f5f9; border-radius: 8px; padding: 14px; margin-bottom: 20px; font-size: 12px; }
  .card-emp table { width: 100%; border-collapse: collapse; }
  .card-emp td { padding: 3px 0; }
  .score-box { background: #ffffff; border: 2px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 20px; text-align: center; }
  .score-grid { display: table; width: 100%; margin-bottom: 12px; }
  .score-col { display: table-cell; width: 50%; padding: 8px; text-align: center; vertical-align: middle; }
  .score-col:first-child { border-right: 1px solid #e2e8f0; }
  .sub-label { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-bottom: 4px; }
  .sub-value { font-size: 16px; font-weight: 800; color: #0f172a; font-family: monospace; }
  .final-banner { background: #f8fafc; border-top: 1px dashed #cbd5e1; padding-top: 12px; margin-top: 8px; }
  .final-score { font-size: 32px; font-weight: 900; color: ${gradeColor}; font-family: monospace; line-height: 1; }
  .grade-pill { display: inline-block; padding: 4px 14px; border-radius: 999px; background: ${gradeColor}; color: #ffffff; font-weight: 800; font-size: 13px; margin-top: 6px; }
  .notes-box { background: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; border-radius: 6px; font-size: 12px; color: #92400e; margin-bottom: 20px; }
  .guideline { background: #eff6ff; border-radius: 8px; padding: 14px; font-size: 12px; color: #1e40af; line-height: 1.5; margin-bottom: 20px; }
  .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 24px; font-size: 11px; color: #64748b; text-align: center; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Laporan Evaluasi Kinerja Karyawan</h1>
      <p>Divisi HRD & People Development &bull; Periode: ${periodText}</p>
      <div class="badge-tag">${isUpdate ? 'REVISI / PEMBARUAN NILAI RESMI' : 'HASIL PENILAIAN RESMI'}</div>
    </div>
    
    <div class="content">
      <div class="intro">
        Kepada Yth. <strong>${payload.employeeName}</strong>,<br>
        Berikut adalah ringkasan hasil evaluasi ${scopeHeadlineTag.toLowerCase()} Anda untuk <strong>${scopeLabel}</strong> yang dihitung secara transparan dan objektif.
      </div>

      <div class="card-emp">
        <table>
          <tr>
            <td style="width: 35%; color: #64748b;">Nama Karyawan</td>
            <td style="font-weight: 700; color: #0f172a;">: ${payload.employeeName}</td>
          </tr>
          <tr>
            <td style="color: #64748b;">Nomor Induk (NIK)</td>
            <td style="font-weight: 600; font-family: monospace;">: ${payload.employeeNik}</td>
          </tr>
          <tr>
            <td style="color: #64748b;">Divisi & Jabatan</td>
            <td style="font-weight: 600;">: ${payload.division} - ${payload.position}</td>
          </tr>
          <tr>
            <td style="color: #64748b;">Tipe Laporan</td>
            <td style="font-weight: 700; color: #1d4ed8;">: ${scopeHeadlineTag}</td>
          </tr>
          <tr>
            <td style="color: #64748b;">Cakupan Periode</td>
            <td style="font-weight: 700; color: #0f172a;">: ${scopeLabel}</td>
          </tr>
          ${
            payload.dailyAttendanceSummary
              ? `<tr>
            <td style="color: #64748b;">Presensi / Catatan</td>
            <td style="font-weight: 600; color: #047857;">: ${payload.dailyAttendanceSummary}</td>
          </tr>`
              : ''
          }
        </table>
      </div>

      <div class="score-box">
        <div class="score-grid">
          <div class="score-col">
            <div class="sub-label">Skor Sikap & Etika (A) (50%)</div>
            <div class="sub-value">${payload.totalSkorA.toFixed(2)} <span style="font-size: 11px; font-weight: normal; color: #64748b;">/ 10</span></div>
          </div>
          <div class="score-col">
            <div class="sub-label">Skor Capaian KPI (B) (50%)</div>
            <div class="sub-value">${payload.totalSkorB.toFixed(2)} <span style="font-size: 11px; font-weight: normal; color: #64748b;">/ 10</span></div>
          </div>
        </div>

        <div class="final-banner">
          <div class="sub-label" style="font-size: 12px; margin-bottom: 2px;">NILAI AKHIR EVALUASI</div>
          <div class="final-score">${payload.finalScore.toFixed(2)}</div>
          <div><span class="grade-pill">GRADE ${payload.grade} &bull; ${payload.statusLabel}</span></div>
        </div>
      </div>

      ${
        payload.notes
          ? `<div class="notes-box"><strong>Catatan & Evaluasi HRD:</strong><br>"${payload.notes}"</div>`
          : ''
      }

      <div class="guideline">
        <strong>Status & Rekomendasi HRD:</strong><br>
        ${
          payload.grade === 'A'
            ? 'Capaian kinerja Sangat Memuaskan (Istimewa). Memenuhi syarat untuk apresiasi kinerja dan nominasi karyawan teladan.'
            : payload.grade === 'B'
            ? 'Capaian kinerja Baik dan telah memenuhi seluruh standar operasional. Pertahankan konsistensi performa kerja.'
            : payload.grade === 'C'
            ? 'Capaian kinerja Cukup. Dianjurkan melakukan koordinasi dengan atasan langsung untuk bimbingan peningkatan target KPI.'
            : 'Capaian kinerja di bawah standar minimum. Dijadwalkan untuk konseling pembinaan bersama HRD.'
        }
      </div>
    </div>

    <div class="footer">
      Email ini dikirimkan secara otomatis dari Sistem Penilaian Kinerja Karyawan atas nama <strong>${payload.publishedBy || 'Divisi HRD'}</strong>.<br>
      Jika ada pertanyaan terkait hasil evaluasi, silakan hubungi People Development / HR Department.
    </div>
  </div>
</body>
</html>`;

  return { subject, textBody, htmlBody };
};

/**
 * Dispatches a single assessment notification email.
 * Tries real delivery via Gmail API (Google Identity Services).
 * If Gmail token is missing, requests authorization from the user.
 */
export const dispatchSingleAssessmentEmail = async (
  payload: EmailNotificationPayload,
  explicitToken?: string
): Promise<{ success: boolean; message: string; log: EmailNotificationLog }> => {
  const timestamp = new Date().toISOString();
  const emailContent = generateEmailContent(payload);

  let token = explicitToken || getValidGoogleToken();

  // Validate existing token
  if (token) {
    const validCheck = await validateGmailToken(token);
    if (!validCheck.valid) {
      clearGoogleSession();
      token = null;
    }
  }

  // If no token or invalid, prompt user to authorize Google Workspace OAuth
  if (!token) {
    try {
      token = await requestGoogleAccessToken(true);
    } catch (err: any) {
      throw new Error(
        `Otorisasi Gmail diperlukan untuk pengiriman email nyata ke ${payload.recipientEmail}: ${
          err?.message || 'Akses belum diizinkan.'
        }`
      );
    }
  }

  let deliveryStatus: 'delivered' | 'failed' = 'failed';
  let deliveryId = `gmail-${Date.now()}`;

  try {
    const res = await sendGmailMessage({
      to: payload.recipientEmail,
      cc: payload.ccEmails,
      subject: emailContent.subject,
      bodyHtml: emailContent.htmlBody,
      accessToken: token,
    });

    deliveryStatus = 'delivered';
    deliveryId = res.id || deliveryId;
  } catch (err: any) {
    // If scope error or 403, clear session and re-prompt user once
    if (err?.message?.includes('403') || err?.message?.includes('insufficient')) {
      clearGoogleSession();
      try {
        const freshToken = await requestGoogleAccessToken(true);
        const retryRes = await sendGmailMessage({
          to: payload.recipientEmail,
          cc: payload.ccEmails,
          subject: emailContent.subject,
          bodyHtml: emailContent.htmlBody,
          accessToken: freshToken,
        });
        deliveryStatus = 'delivered';
        deliveryId = retryRes.id || deliveryId;
        token = freshToken;
      } catch (retryErr: any) {
        throw new Error(retryErr?.message || 'Gagal mengirim email setelah re-otorisasi Gmail.');
      }
    } else {
      throw err;
    }
  }

  // Also notify server backend proxy for internal audit trail
  try {
    await fetch('/api/notifications/send-assessment-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...payload,
        deliveryId,
        deliveryStatus,
      }),
    });
  } catch {
    // Non-blocking
  }

  const log: EmailNotificationLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    assessmentId: payload.assessmentId || '',
    employeeId: payload.employeeId || '',
    employeeNik: payload.employeeNik,
    employeeName: payload.employeeName,
    recipientEmail: payload.recipientEmail,
    period: payload.period,
    grade: payload.grade,
    finalScore: payload.finalScore,
    sentAt: timestamp,
    status: deliveryStatus,
    actionType: payload.actionType,
    sender: payload.publishedBy || 'HR Administrator',
    deliveryMethod: 'gmail_api',
    notes: payload.notes,
  };

  saveEmailLog(log);

  return {
    success: true,
    message: `Email hasil penilaian kinerja berhasil dikirim nyata ke ${payload.recipientEmail}!`,
    log,
  };
};

/**
 * Dispatches bulk notifications for all selected employees via Gmail API.
 */
export const dispatchBulkAssessmentEmails = async (
  items: EmailNotificationPayload[],
  publishedBy: string,
  period: string,
  actionType: 'published' | 'updated',
  ccEmails?: string[],
  explicitToken?: string,
  onProgress?: (current: number, total: number, currentName: string) => void
): Promise<{ success: boolean; count: number; failedCount: number; logs: EmailNotificationLog[] }> => {
  const timestamp = new Date().toISOString();
  const createdLogs: EmailNotificationLog[] = [];

  let token = explicitToken || getValidGoogleToken();

  // Validate existing token before batch begins
  if (token) {
    const validCheck = await validateGmailToken(token);
    if (!validCheck.valid) {
      clearGoogleSession();
      token = null;
    }
  }

  if (!token) {
    try {
      token = await requestGoogleAccessToken(true);
    } catch (err: any) {
      throw new Error(
        `Otorisasi Gmail diperlukan untuk mengirimkan notifikasi email ke ${items.length} karyawan: ${
          err?.message || 'Akses belum diizinkan.'
        }`
      );
    }
  }

  let failedCount = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (onProgress) {
      onProgress(i + 1, items.length, item.employeeName);
    }

    const emailContent = generateEmailContent(item);
    let status: 'delivered' | 'failed' = 'failed';

    try {
      await sendGmailMessage({
        to: item.recipientEmail,
        cc: ccEmails || item.ccEmails,
        subject: emailContent.subject,
        bodyHtml: emailContent.htmlBody,
        accessToken: token,
      });
      status = 'delivered';
    } catch (err: any) {
      // If first send fails due to 403 or insufficient scope, attempt single re-auth
      if (i === 0 && (err?.message?.includes('403') || err?.message?.includes('insufficient'))) {
        clearGoogleSession();
        try {
          token = await requestGoogleAccessToken(true);
          await sendGmailMessage({
            to: item.recipientEmail,
            cc: ccEmails || item.ccEmails,
            subject: emailContent.subject,
            bodyHtml: emailContent.htmlBody,
            accessToken: token,
          });
          status = 'delivered';
        } catch (retryErr) {
          console.error(`[Gmail Dispatch Error] Failed sending to ${item.recipientEmail} on retry:`, retryErr);
          status = 'failed';
          failedCount++;
        }
      } else {
        console.error(`[Gmail Dispatch Error] Failed sending to ${item.recipientEmail}:`, err);
        status = 'failed';
        failedCount++;
      }
    }

    const log: EmailNotificationLog = {
      id: `bulk-log-${Date.now()}-${i + 1}`,
      assessmentId: item.assessmentId || '',
      employeeId: item.employeeId || '',
      employeeNik: item.employeeNik,
      employeeName: item.employeeName,
      recipientEmail: item.recipientEmail,
      period: item.period,
      grade: item.grade,
      finalScore: item.finalScore,
      sentAt: timestamp,
      status,
      actionType,
      sender: publishedBy || 'HR Administrator',
      deliveryMethod: 'gmail_api',
      notes: item.notes,
    };

    createdLogs.push(log);
    saveEmailLog(log);

    // Polite delay between API requests to satisfy Gmail rate limit
    if (i < items.length - 1) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  // Also sync to server audit endpoint
  try {
    await fetch('/api/notifications/send-bulk-assessment-emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        items,
        publishedBy,
        period,
        actionType,
        ccEmails,
      }),
    });
  } catch {
    // Non-blocking
  }

  return {
    success: failedCount === 0,
    count: items.length - failedCount,
    failedCount,
    logs: createdLogs,
  };
};

const LOG_STORAGE_KEY = 'kpi_email_notification_logs_v1';

export const getStoredEmailLogs = (): EmailNotificationLog[] => {
  try {
    const raw = localStorage.getItem(LOG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    // ignore
  }
  return [];
};

export const saveEmailLog = (log: EmailNotificationLog) => {
  try {
    const current = getStoredEmailLogs();
    const updated = [log, ...current].slice(0, 500); // keep last 500 logs
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    // ignore
  }
};
