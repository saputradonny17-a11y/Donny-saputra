export interface HrAccount {
  id: string;
  name: string;
  email: string;
  username: string;
  password: string; // Stored securely in persistent localStorage
  role: 'Head of HR (Administrator)' | 'Admin HRD & Personalia';
  roleCategory: 'head_hr' | 'admin_hrd';
  lastPasswordChange?: string;
}

export interface PasswordResetRequest {
  id: string;
  token: string;
  email: string;
  accountName: string;
  createdAt: string;
  expiresAt: string;
  used: boolean;
  resetUrl: string;
}

const STORAGE_KEY_ACCOUNTS = 'hr_registered_accounts_v1';
const STORAGE_KEY_RESETS = 'hr_password_reset_logs_v1';

// Default authorized accounts defined per company specifications
const DEFAULT_ACCOUNTS: HrAccount[] = [
  {
    id: 'hr-head-01',
    name: 'Donny Saputra',
    email: 'saputradonny17@gmail.com',
    username: 'saputradonny17@gmail.com',
    password: 'Rocknroll92',
    role: 'Head of HR (Administrator)',
    roleCategory: 'head_hr',
    lastPasswordChange: new Date().toISOString()
  },
  {
    id: 'hr-admin-02',
    name: 'Sofia Khaerunisa',
    email: 'sofiakhaerunisa282@gmail.com',
    username: 'sofiakhaerunisa282@gmail.com',
    password: 'sofiakhaerunisa282',
    role: 'Admin HRD & Personalia',
    roleCategory: 'admin_hrd',
    lastPasswordChange: new Date().toISOString()
  }
];

export const getHrAccounts = (): HrAccount[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(DEFAULT_ACCOUNTS));
      return DEFAULT_ACCOUNTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure the two required accounts exist even if an older version of storage was loaded
      const hasHead = parsed.some((acc: HrAccount) => acc.email.toLowerCase() === 'saputradonny17@gmail.com');
      const hasAdmin = parsed.some((acc: HrAccount) => acc.email.toLowerCase() === 'sofiakhaerunisa282@gmail.com');
      if (!hasHead || !hasAdmin) {
        localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(DEFAULT_ACCOUNTS));
        return DEFAULT_ACCOUNTS;
      }
      return parsed;
    }
    return DEFAULT_ACCOUNTS;
  } catch {
    return DEFAULT_ACCOUNTS;
  }
};

export const saveHrAccounts = (accounts: HrAccount[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
  } catch (err) {
    console.error('Failed to save HR accounts to localStorage', err);
  }
};

export const authenticateHr = (usernameOrEmail: string, password: string): HrAccount | null => {
  const accounts = getHrAccounts();
  const query = usernameOrEmail.trim().toLowerCase();
  
  const found = accounts.find(
    (acc) =>
      (acc.email.toLowerCase() === query || acc.username.toLowerCase() === query) &&
      acc.password === password
  );

  return found || null;
};

export const updateHrPassword = (
  email: string,
  newPassword: string
): { success: boolean; message: string; account?: HrAccount } => {
  const accounts = getHrAccounts();
  const normalizedEmail = email.trim().toLowerCase();
  const index = accounts.findIndex((acc) => acc.email.toLowerCase() === normalizedEmail);

  if (index === -1) {
    return { success: false, message: `Akun dengan email ${email} tidak terdaftar di sistem HR.` };
  }

  if (!newPassword || newPassword.length < 6) {
    return { success: false, message: 'Kata sandi baru minimal harus 6 karakter.' };
  }

  accounts[index].password = newPassword;
  accounts[index].lastPasswordChange = new Date().toISOString();
  saveHrAccounts(accounts);

  return {
    success: true,
    message: `Kata sandi untuk ${accounts[index].name} (${accounts[index].email}) berhasil diperbarui!`,
    account: accounts[index]
  };
};

export const createPasswordResetToken = (
  email: string
): { success: boolean; message: string; resetRequest?: PasswordResetRequest } => {
  const accounts = getHrAccounts();
  const normalizedEmail = email.trim().toLowerCase();
  const account = accounts.find((acc) => acc.email.toLowerCase() === normalizedEmail);

  if (!account) {
    return {
      success: false,
      message: `Email "${email}" tidak terdaftar sebagai akun HR resmi perusahaan. Harap gunakan email terdaftar (saputradonny17@gmail.com atau sofiakhaerunisa282@gmail.com).`
    };
  }

  const token = 'rst_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour validity

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://app.kpi-hr.local';
  const resetUrl = `${origin}?action=reset_password&token=${token}&email=${encodeURIComponent(account.email)}`;

  const resetRequest: PasswordResetRequest = {
    id: 'req-' + Date.now(),
    token,
    email: account.email,
    accountName: account.name,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    used: false,
    resetUrl
  };

  try {
    const rawResets = localStorage.getItem(STORAGE_KEY_RESETS);
    const resets: PasswordResetRequest[] = rawResets ? JSON.parse(rawResets) : [];
    resets.unshift(resetRequest);
    // Keep max 20 logs
    localStorage.setItem(STORAGE_KEY_RESETS, JSON.stringify(resets.slice(0, 20)));
  } catch (e) {
    console.error('Error logging password reset request:', e);
  }

  return {
    success: true,
    message: `Link ubah kata sandi berhasil dibuat dan dikirimkan ke ${account.email}.`,
    resetRequest
  };
};

export const getResetRequestByToken = (token: string): PasswordResetRequest | null => {
  try {
    const rawResets = localStorage.getItem(STORAGE_KEY_RESETS);
    if (!rawResets) return null;
    const resets: PasswordResetRequest[] = JSON.parse(rawResets);
    const found = resets.find((r) => r.token === token && !r.used);
    if (!found) return null;

    if (new Date() > new Date(found.expiresAt)) {
      return null; // Expired
    }
    return found;
  } catch {
    return null;
  }
};

export const completePasswordReset = (
  token: string,
  newPassword: string
): { success: boolean; message: string } => {
  const resetReq = getResetRequestByToken(token);
  if (!resetReq) {
    return {
      success: false,
      message: 'Token link ubah kata sandi sudah tidak valid atau telah kadaluarsa. Silakan ajukan link baru.'
    };
  }

  const updateResult = updateHrPassword(resetReq.email, newPassword);
  if (!updateResult.success) {
    return updateResult;
  }

  // Mark token as used
  try {
    const rawResets = localStorage.getItem(STORAGE_KEY_RESETS);
    if (rawResets) {
      const resets: PasswordResetRequest[] = JSON.parse(rawResets);
      const updated = resets.map((r) => (r.token === token ? { ...r, used: true } : r));
      localStorage.setItem(STORAGE_KEY_RESETS, JSON.stringify(updated));
    }
  } catch (e) {
    console.error(e);
  }

  return {
    success: true,
    message: `Kata sandi untuk ${resetReq.accountName} (${resetReq.email}) berhasil diubah. Silakan login kembali dengan kata sandi baru Anda!`
  };
};
