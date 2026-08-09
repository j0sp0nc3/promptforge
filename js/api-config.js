/* ============================================================
   Promptometer — API URL Configuration
   ------------------------------------------------------------
   Resolves the base URL for API calls based on the deployment
   environment. This centralizes the API endpoint so it can be
   pointed to a separate subdomain (api.promptometer.tech) in
   production while using same-origin /api/ in development.

   Detection logic:
   - If the page is served from promptometer.tech (production),
     API calls go to https://api.promptometer.tech/api/*
   - Otherwise (localhost, *.vercel.app dev previews, etc.),
     API calls are same-origin (/api/*)

   Usage in other modules:
     const { API_BASE } = window.ApiConfig;
     fetch(`${API_BASE}/api/leaderboard`)
   ============================================================ */

(function () {
  // Production: route API calls through the dedicated subdomain
  // (DNS-only / gray cloud in Cloudflare → direct to Vercel, real IPs).
  const PROD_HOST = 'promptometer.tech';
  const PROD_API_BASE = 'https://api.' + PROD_HOST;

  const host = (typeof window !== 'undefined' && window.location)
    ? window.location.hostname
    : '';

  // Same-origin for dev (localhost, *.vercel.app previews, etc.)
  const API_BASE = (host === PROD_HOST || host === 'www.' + PROD_HOST)
    ? PROD_API_BASE
    : '';

  window.ApiConfig = { API_BASE, PROD_API_BASE, PROD_HOST };
})();
