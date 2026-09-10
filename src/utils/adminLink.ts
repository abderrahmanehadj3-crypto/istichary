/**
 * Utility for managing the external Vercel Admin Dashboard URL
 * and opening it securely with reverse tabnabbing prevention.
 */

export const DEFAULT_VERCEL_ADMIN_URL = 'https://istichary-admin.vercel.app';
export const STORAGE_KEY_ADMIN_URL = 'istichary_admin_vercel_url';

/**
 * Sanitizes and formats an external URL, ensuring it starts with https:// or http://
 */
export function sanitizeExternalUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return DEFAULT_VERCEL_ADMIN_URL;
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Retrieves the configured Vercel Admin Dashboard URL.
 * Priority:
 * 1. import.meta.env.VITE_ADMIN_DASHBOARD_URL
 * 2. Saved custom URL in localStorage
 * 3. Default fallback Vercel URL
 */
export function getAdminDashboardUrl(): string {
  try {
    const envUrl = (import.meta as any).env?.VITE_ADMIN_DASHBOARD_URL;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
      return sanitizeExternalUrl(envUrl);
    }
  } catch {
    // ignore
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY_ADMIN_URL);
    if (saved && saved.trim() !== '') {
      return sanitizeExternalUrl(saved);
    }
  } catch {
    // ignore
  }

  return DEFAULT_VERCEL_ADMIN_URL;
}

/**
 * Saves a custom Vercel Admin Dashboard URL to localStorage.
 */
export function saveAdminDashboardUrl(url: string): string {
  const sanitized = sanitizeExternalUrl(url);
  try {
    localStorage.setItem(STORAGE_KEY_ADMIN_URL, sanitized);
  } catch {
    // ignore
  }
  return sanitized;
}

/**
 * Resets the stored Vercel Admin URL back to default.
 */
export function resetAdminDashboardUrl(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_ADMIN_URL);
  } catch {
    // ignore
  }
}

/**
 * Opens the external Vercel admin dashboard in a new tab securely.
 */
export function openAdminDashboardUrl(customUrl?: string): void {
  const targetUrl = customUrl ? sanitizeExternalUrl(customUrl) : getAdminDashboardUrl();
  window.open(targetUrl, '_blank', 'noopener,noreferrer');
}
