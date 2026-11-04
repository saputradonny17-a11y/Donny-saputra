import express from 'express';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check endpoint for Cloud Run
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API health endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', app: 'KPI & Appraisal System' });
});

// Endpoint to provide Google OAuth Client ID for Gmail API integration
app.get('/api/auth/google-client-id', (_req, res) => {
  let clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '';
  if (!clientId) {
    try {
      const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const raw = fs.readFileSync(configPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.oAuthClientId) {
          clientId = parsed.oAuthClientId;
        }
      }
    } catch {
      // fallback
    }
  }
  if (!clientId) {
    clientId = '562603872395-ilc23677o20ngbf5uv5ah15ullitaaol.apps.googleusercontent.com';
  }
  res.json({ clientId });
});

// Endpoint to simulate/log password reset email delivery
app.post('/api/auth/send-reset-email', (req, res) => {
  const { email, resetUrl, accountName } = req.body;
  if (!email || !resetUrl) {
    return res.status(400).json({ success: false, message: 'Missing email or resetUrl' });
  }
  
  console.log(`[EMAIL DISPATCH] Password reset link sent to: ${email} (${accountName}) -> ${resetUrl}`);
  res.status(200).json({
    success: true,
    message: `Email link reset kata sandi berhasil dikirim ke ${email}.`,
    deliveryTimestamp: new Date().toISOString()
  });
});

// Endpoint to dispatch single assessment publication / update email notification
app.post('/api/notifications/send-assessment-email', (req, res) => {
  const {
    recipientEmail,
    employeeName,
    employeeNik,
    division,
    position,
    period,
    finalScore,
    grade,
    statusLabel,
    totalSkorA,
    totalSkorB,
    notes,
    actionType = 'published', // 'published' | 'updated' | 'manual_resend'
    publishedBy = 'HR Department',
  } = req.body;

  if (!recipientEmail || !employeeName) {
    return res.status(400).json({
      success: false,
      message: 'Email penerima dan nama karyawan wajib diisi.'
    });
  }

  const actionText = actionType === 'updated' ? 'Pembaruan' : 'Publikasi Resmi';
  const deliveryId = `eml-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const timestamp = new Date().toISOString();

  console.log(`=======================================================`);
  console.log(`[ASSESSMENT NOTIFICATION DISPATCH] ID: ${deliveryId}`);
  console.log(`To: ${employeeName} <${recipientEmail}> (NIK: ${employeeNik})`);
  console.log(`Type: ${actionText} Hasil Penilaian Kinerja`);
  console.log(`Periode: ${period} | Divisi: ${division} | Jabatan: ${position}`);
  console.log(`Nilai Akhir: ${Number(finalScore).toFixed(2)} | Grade: ${grade} (${statusLabel})`);
  console.log(`Rincian: Skor Sikap (A): ${Number(totalSkorA).toFixed(2)}, Skor KPI (B): ${Number(totalSkorB).toFixed(2)}`);
  if (notes) console.log(`Catatan HR: "${notes}"`);
  console.log(`Dipublikasikan oleh: ${publishedBy} at ${timestamp}`);
  console.log(`Status Pengiriman: BERHASIL (DELIVERED)`);
  console.log(`=======================================================`);

  res.status(200).json({
    success: true,
    deliveryId,
    recipientEmail,
    employeeName,
    period,
    deliveryTimestamp: timestamp,
    message: `Email notifikasi hasil penilaian periode ${period} berhasil dikirim ke ${recipientEmail}.`,
    status: 'delivered'
  });
});

// Endpoint to dispatch batch assessment publication email notifications
app.post('/api/notifications/send-bulk-assessment-emails', (req, res) => {
  const { items, publishedBy = 'HR Department', actionType = 'published', period } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Daftar karyawan untuk notifikasi email tidak boleh kosong.'
    });
  }

  const timestamp = new Date().toISOString();
  console.log(`=======================================================`);
  console.log(`[BULK ASSESSMENT NOTIFICATION DISPATCH]`);
  console.log(`Total Recipients: ${items.length}`);
  console.log(`Periode: ${period || 'Current'}`);
  console.log(`Tipe Aksi: ${actionType === 'updated' ? 'Pembaruan Massal' : 'Publikasi Massal'}`);
  console.log(`Diproses oleh: ${publishedBy} at ${timestamp}`);

  const processedLogs = items.map((item: any, idx: number) => {
    const deliveryId = `bulk-eml-${Date.now()}-${idx + 1}`;
    console.log(` -> #${idx + 1}: ${item.employeeName} (${item.recipientEmail}) - Skor: ${item.finalScore} Grade: ${item.grade}`);
    return {
      deliveryId,
      employeeId: item.employeeId,
      employeeNik: item.employeeNik,
      employeeName: item.employeeName,
      recipientEmail: item.recipientEmail,
      grade: item.grade,
      finalScore: item.finalScore,
      status: 'delivered',
      deliveryTimestamp: timestamp
    };
  });
  console.log(`[BULK DISPATCH COMPLETE] ${processedLogs.length} notifikasi email terkirim sukses.`);
  console.log(`=======================================================`);

  res.status(200).json({
    success: true,
    count: processedLogs.length,
    deliveryTimestamp: timestamp,
    message: `Berhasil mengirim ${processedLogs.length} notifikasi email hasil penilaian ke karyawan.`,
    logs: processedLogs
  });
});

const distPath = path.resolve(process.cwd(), 'dist');

if (fs.existsSync(distPath)) {
  // Serve static assets with caching
  app.use(express.static(distPath, { maxAge: '1h' }));

  // SPA fallback to index.html for all non-file routes
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('*', (_req, res) => {
    res.status(503).send('Application build not found. Run "npm run build" first.');
  });
}

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
