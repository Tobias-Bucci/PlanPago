// fetchWithAuth.js
import { authCookies } from './cookieUtils';

/**
 * Fetch wrapper that automatically adds authentication headers from cookies
 * @param {string} url - The URL to fetch
 * @param {RequestInit} options - Fetch options
 * @param {Function} navigate - Navigation function for redirects
 * @returns {Promise<Response>} - The fetch response
 */
export async function fetchWithAuth(url, options = {}, navigate = null) {
  const token = authCookies.getToken();

  if (!token) {
    if (navigate) {
      navigate('/login', { replace: true });
    }
    throw new Error('No authentication token available');
  }

  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    ...options.headers
  };

  const response = await fetch(url, {
    ...options,
    headers: authHeaders
  });

  // Handle 401 unauthorized responses
  if (response.status === 401) {
    // Clear invalid token
    authCookies.removeToken();
    authCookies.removeUserEmail();

    if (navigate) {
      navigate('/login', { replace: true });
    }
    throw new Error('Authentication failed');
  }

  return response;
}

export default fetchWithAuth;
