/**
 * Cloudflare D1 Database Service for Med NU Research Reward System
 * Communicates with backend at https://iram-backend.tinnakornh.workers.dev/api/rewards
 */

import { ResearchApplication } from '../types';

const API_BASE_URL = 'https://iram-backend.tinnakornh.workers.dev/api/rewards';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  source?: 'reward_application' | 'publication_history';
  match?: any;
  message: string;
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
 */
export async function fetchRewardApplicationsFromD1(fiscalYear?: number): Promise<ResearchApplication[]> {
  try {
    const url = fiscalYear ? `${API_BASE_URL}?fiscalYear=${fiscalYear}` : API_BASE_URL;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch applications: ${response.status}`);
    }
    const data = await response.json();
    return data as ResearchApplication[];
  } catch (error) {
    console.error('Failed to fetch applications from D1:', error);
    throw error;
  }
}

/**
 * Submit new reward application to Cloudflare D1
 */
export async function createRewardApplicationInD1(application: Partial<ResearchApplication>): Promise<{ status: string; id: string; trackingNo: string }> {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(application)
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
 */
export async function updateRewardApplicationInD1(id: string, updates: Partial<ResearchApplication>): Promise<{ status: string; id: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
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
      method: 'DELETE'
    });
    return response.ok;
  } catch (error) {
    console.error(`Failed to delete application ${id} in D1:`, error);
    return false;
  }
}
