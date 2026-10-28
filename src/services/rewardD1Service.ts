/**
 * Cloudflare D1 Database Service for Med NU Research Reward System
 * Communicates with backend at https://iram-backend.tinnakornh.workers.dev/api/rewards
 */

import { PublicRewardSummary, QuartileRank, ResearchApplication } from '../types';
import { auth, getAccessToken } from './googleAuth';

const API_BASE_URL = 'https://iram-backend.tinnakornh.workers.dev/api/rewards';

/**
 * Build Authorization header from Firebase session (ID token) or cached access token.
 *
 * ข้อสังเกต: ผู้ใช้บางรายอาจมีบัญชีในระบบแต่ยังไม่เคย login ผ่าน Firebase SSO
 * (เช่น ผู้ใช้ที่ Admin สร้างให้ หรือ Admin กำลัง Impersonate ผู้ใช้นั้น)
 * ในกรณีดังกล่าว auth.currentUser จะเป็น null และ cachedAccessToken จะไม่มีค่า
 * → คืนค่า {} (ไม่ส่ง header) ซึ่ง backend รองรับกรณีนี้โดยตรวจสอบจาก
 *   applicantEmail ใน request body แทน token ownership
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    // 1. ลองดึง Firebase ID token จาก session ปัจจุบัน (ถ้ายัง login อยู่)
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      const idToken = await firebaseUser.getIdToken();
      if (idToken) {
        return { Authorization: `Bearer ${idToken}` };
      }
    }

    // 2. Fallback: ใช้ cached OAuth/access token จากตอน sign-in (ถ้ามี)
    const cachedToken = await getAccessToken();
    if (cachedToken) {
      return { Authorization: `Bearer ${cachedToken}` };
    }
  } catch (error) {
    // กรณีผู้ใช้ยังไม่ได้ login ผ่าน Firebase หรือ session หมดอายุ → ส่ง request โดยไม่มี token
    console.warn('[rewardD1Service] No Firebase session available for auth header:', error);
  }
  return {};
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  source?: 'reward_application' | 'publication_history';
  match?: any;
  message: string;
}

const PUBLIC_QUARTILES: QuartileRank[] = ['Q1_Tier1', 'Q1', 'Q2', 'Q3', 'Q4', 'TCI_1', 'TCI_2'];

/** Fetch aggregate dashboard values only; this endpoint must not return application records. */
export async function fetchPublicRewardSummary(): Promise<PublicRewardSummary> {
  const response = await fetch(`${API_BASE_URL}/public-summary`);
  if (!response.ok) {
    throw new Error(`Failed to fetch public summary: ${response.status}`);
  }

  const data: unknown = await response.json();
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid public summary response');
  }

  const summary = data as Record<string, unknown>;
  const numericFields = [
    'totalApplications',
    'totalRequestedAmount',
    'paidAmount',
    'paidCount',
    'pendingAmount',
    'pendingCount',
    'rewardAmount',
    'pageChargeAmount',
  ];
  if (numericFields.some((field) => typeof summary[field] !== 'number' || !Number.isFinite(summary[field]) || (summary[field] as number) < 0)) {
    throw new Error('Invalid public summary response');
  }

  const quartileCounts = summary.quartileCounts;
  if (!quartileCounts || typeof quartileCounts !== 'object') {
    throw new Error('Invalid public summary response');
  }
  for (const quartile of PUBLIC_QUARTILES) {
    const count = (quartileCounts as Record<string, unknown>)[quartile];
    if (typeof count !== 'number' || !Number.isFinite(count) || count < 0) {
      throw new Error('Invalid public summary response');
    }
  }

  return data as PublicRewardSummary;
}

/**
 * Check if DOI or article title has been previously claimed or is duplicate
 */
export async function checkArticleDuplicate(doi?: string, title?: string): Promise<DuplicateCheckResult> {
  const cleanDoi = (doi || '').trim();
  const cleanTitle = (title || '').trim();

  if (!cleanDoi && !cleanTitle) {
    return { isDuplicate: false, message: 'ไม่มีข้อมูล DOI หรือชื่อบทความ' };
  }

  try {
    const params = new URLSearchParams();
    if (cleanDoi) params.append('doi', cleanDoi);
    if (cleanTitle) params.append('title', cleanTitle);

    const response = await fetch(`${API_BASE_URL}/check-duplicate?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Duplicate check failed with status: ${response.status}`);
    }
    const data = await response.json();
    return data as DuplicateCheckResult;
  } catch (error) {
    console.error('Error checking duplicate in D1:', error);
    return {
      isDuplicate: false,
      message: 'ไม่สามารถติดต่อเซิร์ฟเวอร์เพื่อตรวจเช็คซ้ำซ้อนได้ชั่วคราว'
    };
  }
}

/**
 * Fetch all reward applications from Cloudflare D1
 * ใช้ auth headers ถ้ามี Firebase session (เพื่อรองรับ role-based filtering ฝั่ง backend)
 */
export async function fetchRewardApplicationsFromD1(fiscalYear?: number): Promise<ResearchApplication[]> {
  try {
    const url = fiscalYear ? `${API_BASE_URL}?fiscalYear=${fiscalYear}` : API_BASE_URL;
    const response = await fetch(url, {
      headers: await getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch applications: ${response.status}`);
    }
    const data = await response.json();
    const mapped = (data as any[]).map((row) => ({
      ...row,
      database: (row.database || row.databaseName || 'Scopus') as any,
      databaseName: (row.databaseName || row.database || 'Scopus') as any,
      pdpaConsentAccepted: Boolean(row.pdpaConsentAccepted),
      isTier1Top10: Boolean(row.isTier1Top10),
      within24Months: row.within24Months !== undefined ? Boolean(row.within24Months) : true,
      notForGraduation: row.notForGraduation !== undefined ? Boolean(row.notForGraduation) : true,
      medNuAffiliationDeclared: row.medNuAffiliationDeclared !== undefined ? Boolean(row.medNuAffiliationDeclared) : true,
    }));
    return mapped as ResearchApplication[];
  } catch (error) {
    console.error('Failed to fetch applications from D1:', error);
    throw error;
  }
}

/**
 * Submit new reward application to Cloudflare D1
 * ส่ง Authorization header ถ้ามี Firebase session (กรณี user login ปกติ หรือ Admin impersonate)
 * กรณีไม่มี session (user ที่ Admin สร้างให้และยังไม่เคย login) → ส่งโดยไม่มี token
 */
export async function createRewardApplicationInD1(application: Partial<ResearchApplication>): Promise<{ status: string; id: string; trackingNo: string }> {
  try {
    const payload = {
      ...application,
      databaseName: application.databaseName || application.database || 'Scopus',
    };
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...await getAuthHeaders(),
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || `HTTP error ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error('Failed to create application in D1:', error);
    throw error;
  }
}

/**
 * Update existing reward application in Cloudflare D1
 * ส่ง Authorization header ถ้ามี Firebase session
 */
export async function updateRewardApplicationInD1(id: string, updates: Partial<ResearchApplication>): Promise<{ status: string; id: string }> {
  try {
    const payload = {
      ...updates,
      ...(updates.database ? { databaseName: updates.databaseName || updates.database } : {}),
    };
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...await getAuthHeaders(),
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || `HTTP error ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error(`Failed to update application ${id} in D1:`, error);
    throw error;
  }
}

/**
 * Delete reward application from Cloudflare D1
 */
export async function deleteRewardApplicationInD1(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    });
    return response.ok;
  } catch (error) {
    console.error(`Failed to delete application ${id} in D1:`, error);
    return false;
  }
}
