/**
 * Cloudflare D1 Service for DRI NU Disbursement Tracking Records (irNuDisbursement)
 * Backend API: https://iram-backend.tinnakornh.workers.dev/api/nu-disbursements
 */

import { NuDisbursementRecord } from '../types';
import { buildRewardApiHeaders } from './apiAuthHeaders';

const NU_DISB_API_BASE = 'https://iram-backend.tinnakornh.workers.dev/api/nu-disbursements';

export async function fetchNuDisbursementsFromD1(): Promise<NuDisbursementRecord[]> {
  const response = await fetch(NU_DISB_API_BASE, {
    headers: await buildRewardApiHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch NU disbursements from D1: ${response.status}`);
  }
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function bulkUpsertNuDisbursementsInD1(
  records: NuDisbursementRecord[]
): Promise<{ status: string; count: number }> {
  if (!records || records.length === 0) {
    return { status: 'skipped', count: 0 };
  }
  const response = await fetch(NU_DISB_API_BASE, {
    method: 'POST',
    headers: await buildRewardApiHeaders(true),
    body: JSON.stringify({ records }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Failed to sync NU disbursements to D1: ${response.status}`);
  }
  return response.json();
}

export async function updateNuDisbursementInD1(
  record: NuDisbursementRecord
): Promise<{ status: string; id: string }> {
  const response = await fetch(`${NU_DISB_API_BASE}/${encodeURIComponent(record.id)}`, {
    method: 'PUT',
    headers: await buildRewardApiHeaders(true),
    body: JSON.stringify(record),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Failed to update NU disbursement in D1: ${response.status}`);
  }
  return response.json();
}
