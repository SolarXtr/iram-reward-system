/**
 * Unified Authenticated Headers Builder for Med NU Research Reward System APIs
 * Ensures Firebase Auth readiness on page reload, attaches RS256 ID Token,
 * active role context, and admin/secretary impersonation context for server-side RBAC.
 */

import { auth, getAccessToken } from './googleAuth';

export const ACTIVE_ROLE_STORAGE_KEY = 'med_nu_active_role_v1';
export const IMPERSONATOR_STORAGE_KEY = 'med_nu_impersonator_admin_v1';
export const AUTH_SESSION_STORAGE_KEY = 'med_nu_current_auth_session_v1';

export class UnauthorizedApiError extends Error {
  status: number;
  constructor(message = 'เซสชันการเข้าสู่ระบบหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง') {
    super(message);
    this.name = 'UnauthorizedApiError';
    this.status = 401;
  }
}

async function waitForAuthReadyWithTimeout(timeoutMs = 1500): Promise<void> {
  try {
    if (typeof (auth as any).authStateReady === 'function') {
      await Promise.race([
        (auth as any).authStateReady(),
        new Promise((resolve) => setTimeout(resolve, timeoutMs)),
      ]);
    }
  } catch {
    // ignore
  }
}

export async function buildRewardApiHeaders(includeJsonContentType = false): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  if (includeJsonContentType) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    if (!auth.currentUser) {
      await waitForAuthReadyWithTimeout(1500);
    }

    if (auth.currentUser) {
      const idToken = await auth.currentUser.getIdToken();
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }
    } else {
      const fallbackToken = await getAccessToken();
      if (fallbackToken) {
        headers['Authorization'] = `Bearer ${fallbackToken}`;
      }
    }
  } catch (err) {
    console.warn('[apiAuthHeaders] Could not obtain Firebase token:', err);
  }

  try {
    const activeRole = sessionStorage.getItem(ACTIVE_ROLE_STORAGE_KEY);
    if (activeRole) {
      headers['X-Active-Role'] = activeRole;
    }

    const impersonatorRaw = sessionStorage.getItem(IMPERSONATOR_STORAGE_KEY);
    const activeSessionRaw = localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (impersonatorRaw && activeSessionRaw) {
      const activeUser = JSON.parse(activeSessionRaw);
      if (activeUser?.email) {
        headers['X-Impersonated-Email'] = String(activeUser.email).trim().toLowerCase();
      }
    }
  } catch {
    // ignore storage read errors
  }

  return headers;
}
