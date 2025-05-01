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
    } catch {}
  }
  return r;
}
