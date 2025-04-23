// Automatische Basis-URL für API-Calls
export const API_BASE =
  process.env.REACT_APP_API_URL        // Production (z. B. "https://planpago.buccilab.com/api")
  || `${window.location.protocol}//${window.location.hostname}:8001`; // Fallback Dev/LAN
