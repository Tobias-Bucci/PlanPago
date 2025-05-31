// fetchWithAuth.js

export async function fetchWithAuth(url, options = {}, navigate) {
  const token = localStorage.getItem('token');

  const authOptions = {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, authOptions);

  if (!response.ok) {
    try {
      const data = await response.json();
      if (data?.detail === "Could not validate credentials") {
        localStorage.removeItem('token');
        localStorage.removeItem('currentEmail');
        if (navigate) {
          navigate('/login', { replace: true });
        }
        throw new Error('Session expired. Please log in again.');
      }
      throw new Error(data.detail || `HTTP ${response.status}`);
    } catch (jsonError) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('currentEmail');
        if (navigate) {
          navigate('/login', { replace: true });
        }
        throw new Error('Session expired. Please log in again.');
      }
      throw new Error(`Network error: ${response.status}`);
    }
  }

  return response;
}
