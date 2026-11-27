/**
 * Cloudflare D1 Database Service for Med NU Research Reward System
 * Communicates with backend at https://iram-backend.tinnakornh.workers.dev/api/rewards
 */

import { PublicRewardSummary, QuartileRank, ResearchApplication } from '../types';
import { buildRewardApiHeaders, UnauthorizedApiError } from './apiAuthHeaders';

const API_BASE_URL = 'https://iram-backend.tinnakornh.workers.dev/api/rewards';

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

    const response = await fetch(`${API_BASE_URL}/check-duplicate?${params.toString()}`, {
      headers: await buildRewardApiHeaders(),
    });
    if (response.status === 401) {
      throw new UnauthorizedApiError();
    }
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
      headers: await buildRewardApiHeaders(),
    });
    if (response.status === 401) {
      throw new UnauthorizedApiError();
    }
    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.error || `Failed to fetch applications: ${response.status}`);
    }
    const data = await response.json();
    const mapped = (data as any[]).map((row) => {
      let db = row.database || row.databaseName || 'Scopus';
      const q = row.quartile;
      if (q === 'TCI_2' && db !== 'TCI Tier 2') {
        db = 'TCI Tier 2';
      } else if (q === 'TCI_1' && db !== 'TCI Tier 1') {
        db = 'TCI Tier 1';
      }
      return {
        ...row,
        database: db as any,
        databaseName: db as any,
        pdpaConsentAccepted: Boolean(row.pdpaConsentAccepted),
        isTier1Top10: Boolean(row.isTier1Top10),
        within24Months: row.within24Months !== undefined ? Boolean(row.within24Months) : true,
        notForGraduation: row.notForGraduation !== undefined ? Boolean(row.notForGraduation) : true,
        medNuAffiliationDeclared: row.medNuAffiliationDeclared !== undefined ? Boolean(row.medNuAffiliationDeclared) : true,
      };
    });
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
    let db = application.database || application.databaseName || 'Scopus';
    if (application.quartile === 'TCI_2' && db !== 'TCI Tier 2') {
      db = 'TCI Tier 2';
    } else if (application.quartile === 'TCI_1' && db !== 'TCI Tier 1') {
      db = 'TCI Tier 1';
    }
    const payload = {
      ...application,
      database: db,
      databaseName: db,
    };
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: await buildRewardApiHeaders(true),
      body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => ({}));
    if (response.status === 401) {
      throw new UnauthorizedApiError(result.error);
    }
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
    let db = updates.database || updates.databaseName;
    if (updates.quartile === 'TCI_2' && db !== 'TCI Tier 2') {
      db = 'TCI Tier 2';
    } else if (updates.quartile === 'TCI_1' && db !== 'TCI Tier 1') {
      db = 'TCI Tier 1';
    }
    const payload = {
      ...updates,
      ...(db ? { database: db, databaseName: db } : {}),
    };
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: await buildRewardApiHeaders(true),
      body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => ({}));
    if (response.status === 401) {
      throw new UnauthorizedApiError(result.error);
    }
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
      headers: await buildRewardApiHeaders(),
    });
    return response.ok;
  } catch (error) {
    console.error(`Failed to delete application ${id} in D1:`, error);
    return false;
  }
}

/**
 * Admin: Reconcile and backfill applicantUserId / researcherUserId Foreign Keys across D1
 */
export async function reconcileRewardUserIdsInD1(): Promise<{
  status: string;
  linkedApplications: number;
  linkedNuDisbursements: number;
}> {
  const response = await fetch(`${API_BASE_URL}/reconcile-user-ids`, {
    method: 'POST',
    headers: await buildRewardApiHeaders(true),
    body: JSON.stringify({}),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || `HTTP error ${response.status}`);
  }
  return result;
}

/**
 * Upload an attachment or payment transfer slip (PDF / PNG / JPG <= 2MB) to Cloudflare D1 Blob Table
 */
export async function uploadRewardAttachmentToD1(
  applicationId: string,
  file: File,
  category: 'transfer_slip' | 'reprint' | 'invoice' | 'payment_receipt' | 'quartile_proof' = 'transfer_slip',
  title?: string
): Promise<{ status: string; fileId: string; fileUrl: string; attachment: any }> {
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('ขนาดไฟล์ต้องไม่เกิน 2 MB กรุณาย่อขนาดภาพหรือไฟล์ PDF');
  }

  const dataBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์ที่เลือกได้'));
    reader.readAsDataURL(file);
  });

  const response = await fetch(`${API_BASE_URL}/${encodeURIComponent(applicationId)}/attachments`, {
    method: 'POST',
    headers: await buildRewardApiHeaders(true),
    body: JSON.stringify({
      category,
      title: title || file.name,
      fileName: file.name,
      mimeType: file.type || 'application/pdf',
      dataBase64,
    }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || `อัปโหลดไฟล์ไม่สำเร็จ (HTTP ${response.status})`);
  }
  return result;
}

/**
 * Fetch protected attachment or transfer slip Data URL with RBAC headers
 */
export async function fetchRewardAttachmentFromD1(fileUrlOrId: string): Promise<{
  fileName: string;
  mimeType: string;
  dataUrl: string;
}> {
  const fileId = fileUrlOrId.includes('/files/')
    ? fileUrlOrId.split('/files/').pop() || fileUrlOrId
    : fileUrlOrId;

  const response = await fetch(`${API_BASE_URL}/files/${encodeURIComponent(fileId)}`, {
    headers: await buildRewardApiHeaders(),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || `ไม่สามารถเปิดดูไฟล์แนบได้ (HTTP ${response.status})`);
  }
  return result;
}
