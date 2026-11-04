/**
 * Google Identity Services & Gmail API Integration Utility
 * Handles OAuth2 authorization, token lifecycle, scope validation,
 * and direct RFC 2822 message dispatching via Gmail API.
 */

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              expires_in?: number | string;
              error?: string;
              error_description?: string;
              scope?: string;
            }) => void;
            error_callback?: (err: any) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string; hint?: string }) => void;
          };
          hasGrantedAllScopes?: (tokenResponse: any, ...scopes: string[]) => boolean;
          revoke: (token: string, done?: () => void) => void;
        };
      };
    };
  }
}

const STORAGE_KEY_TOKEN = 'hr_gmail_access_token';
const STORAGE_KEY_EXPIRES = 'hr_gmail_token_expires';
const STORAGE_KEY_EMAIL = 'hr_gmail_connected_email';

const DEFAULT_CLIENT_ID = '562603872395-ilc23677o20ngbf5uv5ah15ullitaaol.apps.googleusercontent.com';
export const GMAIL_SEND_SCOPE = 'https://www.googleapis.com/auth/gmail.send';

let cachedClientId: string | null = null;

/**
 * Fetches or detects the Google OAuth Client ID for this project.
 */
export async function getGoogleClientId(): Promise<string> {
  if (cachedClientId) return cachedClientId;

  // 1. Check client env
  const envId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
  if (envId) {
    cachedClientId = envId;
    return envId;
  }

  // 2. Fetch from backend API
  try {
    const res = await fetch('/api/auth/google-client-id');
    if (res.ok) {
      const data = await res.json();
      if (data.clientId) {
        cachedClientId = data.clientId;
        return data.clientId;
      }
    }
  } catch (e) {
    console.warn('[GoogleAuth] Could not fetch client ID from server:', e);
  }

  // 3. Fallback
  cachedClientId = DEFAULT_CLIENT_ID;
  return DEFAULT_CLIENT_ID;
}

/**
 * Ensures the Google Identity Services client script is loaded on the page.
 */
export async function ensureGisScriptLoaded(): Promise<void> {
  if (window.google?.accounts?.oauth2) return;

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existing) {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (window.google?.accounts?.oauth2) {
          clearInterval(interval);
          resolve();
        } else if (attempts > 50) {
          clearInterval(interval);
          reject(new Error('Google Identity Services script timeout'));
        }
      }, 100);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const check = setInterval(() => {
        if (window.google?.accounts?.oauth2) {
          clearInterval(check);
          resolve();
        }
      }, 50);
    };
    script.onerror = () =>
      reject(new Error('Gagal memuat Google Identity Services script. Periksa koneksi internet.'));
    document.head.appendChild(script);
  });
}

/**
 * Validates whether an access token actually has gmail.send scope by querying user profile
 */
export async function validateGmailToken(token: string): Promise<{ valid: boolean; email?: string }> {
  try {
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      return { valid: true, email: data.emailAddress };
    }
    return { valid: false };
  } catch {
    return { valid: false };
  }
}

/**
 * Requests an OAuth access token from Google using GIS popup.
 */
export async function requestGoogleAccessToken(promptUser: boolean = true): Promise<string> {
  await ensureGisScriptLoaded();
  const clientId = await getGoogleClientId();

  return new Promise((resolve, reject) => {
    try {
      if (!window.google?.accounts?.oauth2) {
        throw new Error('Google Identity Services library belum siap.');
      }

      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: GMAIL_SEND_SCOPE,
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            reject(new Error(tokenResponse.error_description || tokenResponse.error));
            return;
          }

          const accessToken = tokenResponse.access_token;
          if (!accessToken) {
            reject(new Error('Gagal menerima access token dari Google.'));
            return;
          }

          // Check if gmail.send scope was granted by the user
          if (tokenResponse.scope && !tokenResponse.scope.includes('gmail.send')) {
            clearGoogleSession();
            reject(
              new Error(
                'Izin pengiriman email tidak dicentang. Pastikan Anda mencentang opsi "Kirim email atas nama Anda" / "Send email on your behalf" pada jendela persetujuan Google.'
              )
            );
            return;
          }

          const expiresIn = Number(tokenResponse.expires_in) || 3600;
          const expiresAt = Date.now() + (expiresIn - 60) * 1000; // buffer 60 seconds

          localStorage.setItem(STORAGE_KEY_TOKEN, accessToken);
          localStorage.setItem(STORAGE_KEY_EXPIRES, expiresAt.toString());

          // Verify token against Gmail profile
          const validation = await validateGmailToken(accessToken);
          if (validation.valid && validation.email) {
            localStorage.setItem(STORAGE_KEY_EMAIL, validation.email);
          } else {
            // Fallback to placeholder if profile fetch fails
            if (!localStorage.getItem(STORAGE_KEY_EMAIL)) {
              localStorage.setItem(STORAGE_KEY_EMAIL, 'Akun Gmail Terhubung');
            }
          }

          resolve(accessToken);
        },
        error_callback: (err) => {
          reject(new Error(err?.message || 'Otorisasi Google dibatalkan atau terjadi kesalahan.'));
        },
      });

      // Always use prompt: 'consent' to force Google to show the scope permissions check
      client.requestAccessToken({ prompt: promptUser ? 'consent' : '' });
    } catch (err: any) {
      reject(err);
    }
  });
}

/**
 * Returns a valid cached token or null if expired/absent.
 */
export function getValidGoogleToken(): string | null {
  const token = localStorage.getItem(STORAGE_KEY_TOKEN);
  const expires = localStorage.getItem(STORAGE_KEY_EXPIRES);

  if (!token || !expires) return null;

  const expTime = parseInt(expires, 10);
  if (isNaN(expTime) || Date.now() >= expTime) {
    clearGoogleSession();
    return null;
  }

  return token;
}

/**
 * Returns connected account information.
 */
export function getConnectedGmailInfo(): { isConnected: boolean; email?: string } {
  const token = getValidGoogleToken();
  if (!token) return { isConnected: false };

  const email = localStorage.getItem(STORAGE_KEY_EMAIL) || 'Akun Gmail Terhubung';
  return { isConnected: true, email };
}

/**
 * Disconnects and clears local session.
 */
export function clearGoogleSession(): void {
  const token = localStorage.getItem(STORAGE_KEY_TOKEN);
  if (token && window.google?.accounts?.oauth2?.revoke) {
    try {
      window.google.accounts.oauth2.revoke(token, () => {});
    } catch {
      // ignore
    }
  }
  localStorage.removeItem(STORAGE_KEY_TOKEN);
  localStorage.removeItem(STORAGE_KEY_EXPIRES);
  localStorage.removeItem(STORAGE_KEY_EMAIL);
}

/**
 * Sends a real email via Gmail API using RFC 2822 formatting.
 */
export async function sendGmailMessage(options: {
  to: string;
  cc?: string[];
  subject: string;
  bodyHtml: string;
  accessToken: string;
}): Promise<{ id: string; threadId: string }> {
  const { to, cc, subject, bodyHtml, accessToken } = options;

  // Format UTF-8 Subject
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;

  const headers = [
    `To: ${to}`,
    cc && cc.length > 0 ? `Cc: ${cc.join(', ')}` : '',
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
  ].filter(Boolean);

  const rawMessage = `${headers.join('\r\n')}\r\n\r\n${bodyHtml}`;

  // Base64url encode the message
  const encodedMessage = btoa(unescape(encodeURIComponent(rawMessage)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encodedMessage }),
  });

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errorData = await response.json();
      errorDetail = errorData?.error?.message || '';
      if (
        response.status === 401 ||
        response.status === 403 ||
        errorDetail.includes('insufficient authentication scopes')
      ) {
        clearGoogleSession();
        errorDetail =
          'Izin pengiriman Gmail belum dicentang atau kedaluwarsa. Silakan klik "Hubungkan Akun Gmail HR" kembali dan pastikan mencentang kotak izin persetujuan Google.';
      }
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(`Gagal mengirim via Gmail API (${response.status}): ${errorDetail}`);
  }

  return response.json();
}
