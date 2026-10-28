/**
 * iRAM Reward System - Pageview Analytics Tracker
 * Compatible with Cloudflare Workers Analytics API (iram-backend)
 * Matches the tracking implementation used by mednu-scopus-dashboard.pages.dev
 */
(function() {
  try {
    // 1. Generate or Retrieve Session ID
    let sessionId = sessionStorage.getItem('iram_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
      sessionStorage.setItem('iram_session_id', sessionId);
    }

    // 2. Gather Environment & Device Data
    const domain = window.location.hostname || 'localhost';
    const path = window.location.pathname || '/';
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

    // 3. Send Analytics Data
    const API_URL = 'https://iram-backend.tinnakornh.workers.dev/api/analytics/view';
    
    fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        domain: domain,
        path: path,
        sessionId: sessionId,
        userAgent: userAgent,
        resolution: resolution,
        language: language,
        referrer: referrer,
        deviceType: deviceType
      })
    }).catch(function(err) {
      console.warn('Analytics tracking request failed:', err);
    });
  } catch (e) {
    console.warn('Analytics tracker initialization failed:', e);
  }
})();
