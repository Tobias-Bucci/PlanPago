// fetchWithAuth.js

export async function fetchWithAuth(url, options = {}, navigate) {
  const r = await fetch(url, options);
  if (r.status === 401) {
    localStorage.clear();
    navigate("/login");
    throw new Error("Session expired. Please log in again.");
  }
  // Try to catch JSON error message
  if (!r.ok) {
    try {
      const data = await r.json();
      if (data?.detail === "Could not validate credentials") {
        localStorage.clear();
        navigate("/login");
        throw new Error("Session expired. Please log in again.");
      }
      // Throw the actual error message from the backend
      if (data?.detail) {
        throw new Error(data.detail);
      }
    } catch (jsonError) {
      // If JSON parsing fails, try to get text response
      try {
        const text = await r.text();
        if (text) {
          throw new Error(text);
        }
      } catch { }
    }
    // Fallback error message
    throw new Error(`Request failed with status ${r.status}`);
  }
  return r;
}
