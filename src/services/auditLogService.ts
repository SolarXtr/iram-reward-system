/**
 * Audit Log Service for Med NU Research Reward System
 * Handles activity logging, retention tracking, CSV backup, and safe purging
 * Backend API: https://iram-backend.tinnakornh.workers.dev/api/audit-logs
 */

import { AuditLogEntry, AuditRetentionSummary } from '../types';
import { buildRewardApiHeaders } from './apiAuthHeaders';

const AUDIT_API_BASE = 'https://iram-backend.tinnakornh.workers.dev/api/audit-logs';

export interface AuditQueryParams {
  q?: string;
  action?: string;
  targetType?: string;
  limit?: number;
  offset?: number;
}

export interface AuditLogsResponse {
  logs: AuditLogEntry[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Fetch paginated audit logs with search query and filters
 */
export async function fetchAuditLogs(params: AuditQueryParams = {}): Promise<AuditLogsResponse> {
  const url = new URL(AUDIT_API_BASE);
  if (params.q) url.searchParams.set('q', params.q);
  if (params.action && params.action !== 'all') url.searchParams.set('action', params.action);
  if (params.targetType && params.targetType !== 'all') url.searchParams.set('targetType', params.targetType);
  if (params.limit) url.searchParams.set('limit', String(params.limit));
  if (params.offset !== undefined) url.searchParams.set('offset', String(params.offset));

  const res = await fetch(url.toString(), {
    headers: await buildRewardApiHeaders(),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `Failed to fetch audit logs: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Record a new user or system audit log
 */
export async function recordAuditLog(entry: {
  userId: string;
  userName?: string;
  userRole?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: any;
}): Promise<{ status: string; id: string }> {
  try {
    const res = await fetch(AUDIT_API_BASE, {
      method: 'POST',
      headers: await buildRewardApiHeaders(true),
      body: JSON.stringify(entry)
    });
    if (!res.ok) {
      console.warn('[auditLogService] Failed to record audit log:', res.statusText);
      return { status: 'failed', id: '' };
    }
    return res.json();
  } catch (err) {
    console.warn('[auditLogService] Error posting audit log:', err);
    return { status: 'error', id: '' };
  }
}

/**
 * Check 24-month retention status (logs older than 730 days)
 */
export async function checkAuditRetention(): Promise<AuditRetentionSummary> {
  const res = await fetch(`${AUDIT_API_BASE}/check-retention`, {
    headers: await buildRewardApiHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to check retention: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Download CSV backup of logs older than 24 months
 */
export async function downloadAuditBackup24m(): Promise<string> {
  const res = await fetch(`${AUDIT_API_BASE}/backup-24m`, {
    headers: await buildRewardApiHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to download backup: ${res.statusText}`);
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `iram_audit_log_archive_prior_24months_${dateStr}.csv`;
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  return filename;
}

/**
 * Download CSV export of all audit logs
 */
export async function exportAllAuditLogs(): Promise<string> {
  const res = await fetch(`${AUDIT_API_BASE}/export-all`, {
    headers: await buildRewardApiHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to export all logs: ${res.statusText}`);
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `iram_all_audit_logs_${dateStr}.csv`;
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  return filename;
}

/**
 * Safe Purge of logs older than 24 months
 */
export async function purgeAuditLogs24m(
  confirmedBy: string,
  confirmedRole: string = 'admin'
): Promise<{ status: string; purgedCount: number; cutoffDate: string }> {
  const res = await fetch(`${AUDIT_API_BASE}/purge-24m`, {
    method: 'POST',
    headers: await buildRewardApiHeaders(true),
    body: JSON.stringify({
      confirmed: true,
      confirmedBy,
      confirmedRole
    })
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Purge failed: ${res.statusText}`);
  }
  return res.json();
}
