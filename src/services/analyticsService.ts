/**
 * Pageview Analytics Service
 * Connects to Cloudflare Workers Analytics API: https://iram-backend.tinnakornh.workers.dev
 * Used for in-app client route/tab tracking and fetching summary statistics.
 */

export interface AnalyticsSummaryRow {
  domain: string;
  path: string;
  totalViews: number;
  viewsToday: number;
  viewsThisMonth: number;
}

const ANALYTICS_API_BASE = 'https://iram-backend.tinnakornh.workers.dev/api/analytics';

/**
 * Tracks a pageview with the given virtual path (or current window.location.pathname)
 */
export async function trackPageView(customPath?: string): Promise<boolean> {
  try {
    // 1. Session ID management
    let sessionId = sessionStorage.getItem('iram_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
      sessionStorage.setItem('iram_session_id', sessionId);
    }

    // 2. Gather device & browser metrics
    const domain = window.location.hostname || 'localhost';
    const path = customPath || window.location.pathname || '/';
    const userAgent = navigator.userAgent;
    const resolution = `${window.screen.width}x${window.screen.height}`;
    const language = navigator.language || '';
    const referrer = document.referrer || '';

    let deviceType = 'Desktop';
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent.toLowerCase())) {
      deviceType = 'Tablet';
    } else if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
      deviceType = 'Mobile';
    }

    // 3. Post to Cloudflare Workers backend
    const resp = await fetch(`${ANALYTICS_API_BASE}/view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        domain,
        path,
        sessionId,
        userAgent,
        resolution,
        language,
        referrer,
        deviceType,
      }),
    });

    return resp.ok;
  } catch (err) {
    console.warn('Analytics tracking request failed:', err);
    return false;
  }
}

/**
 * Fetches analytics summary table data from backend
 */
export async function fetchAnalyticsSummary(): Promise<AnalyticsSummaryRow[]> {
  try {
    const resp = await fetch(`${ANALYTICS_API_BASE}/summary`);
    if (!resp.ok) {
      throw new Error(`Failed to fetch analytics summary (${resp.status})`);
    }
    const data = await resp.json();
    return Array.isArray(data) ? data : (data.value || []);
  } catch (err) {
    console.error('Failed to load analytics summary:', err);
    return [];
  }
}
