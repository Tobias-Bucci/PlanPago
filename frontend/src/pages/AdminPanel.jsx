// src/pages/AdminPanel.jsx
import { API_BASE } from "../config";
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

const API = API_BASE;

export default function AdminPanel() {
  /* ────────────── State ─────────────────────────── */
  const [view, setView]     = useState("users");  // "users" | "logs"
  const [users, setUsers]   = useState([]);
  const [logs, setLogs]     = useState("");
  const [error, setError]   = useState("");
  const [message, setMsg]   = useState("");
  const [loading, setLoad]  = useState(true);

  const navigate = useNavigate();
  const authHeader = useMemo(() => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  }, []);

  /* ────────────── User-Liste laden ──────────────── */
  useEffect(() => {
    async function fetchUsers() {
      setLoad(true);
      try {
        const res = await fetch(`${API}/users/admin/users`, {
          headers: authHeader,
        });
        if (res.status === 401) return navigate("/login");
        if (res.status === 403) return navigate("/");
        if (!res.ok) throw new Error("Error while fetching users");
        setUsers(await res.json());
      } catch (err) {
        setError(err.message || "Unspecified error");
      } finally {
        setLoad(false);
      }
    }
    fetchUsers();
  }, [authHeader, navigate]);

  /* ────────────── Logs laden ────────────────────── */
  const loadLogs = async () => {
    setView("logs");
    setError("");
    setLoad(true);
    try {
      const res = await fetch(`${API}/admin/logs?lines=500`, {
        headers: authHeader,
      });
      if (res.status === 401) return navigate("/login");
      if (res.status === 403) return navigate("/");
      if (!res.ok) throw new Error("Could not fetch logs");
      setLogs(await res.text());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoad(false);
    }
  };

  /* ────────────── User löschen ──────────────────── */
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this user?"))
      return;
    try {
      const res = await fetch(`${API}/users/admin/users/${id}`, {
        method: "DELETE",
        headers: authHeader,
      });
      if (!res.ok) throw new Error("Deletion failed");
      setMsg("User deleted successfully");
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      setError(err.message || "Unspecified error");
    }
  };

  /* ────────────── Renderer ──────────────────────── */
  const renderLogViewer = () => (
    <div className="bg-black text-green-300 p-4 rounded-lg shadow-inner overflow-auto h-[70vh] font-mono text-xs whitespace-pre-wrap">
      {logs || "No logs loaded…"}
    </div>
  );

  const renderUserTable = () => (
    <>
      {message && (
        <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-lg shadow">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg shadow">
          {error}
        </div>
      )}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-primary text-white">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium">ID</th>
              <th className="px-6 py-3 text-left text-sm font-medium">E-Mail</th>
              <th className="px-6 py-3 text-center text-sm font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">{u.id}</td>
                  <td className="px-6 py-4">{u.email}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );

  /* ────────────── JSX ───────────────────────────── */
  return (
    <main className="container mx-auto p-6 animate-fadeIn">
      <h1 className="text-3xl font-semibold mb-6">Admin Panel</h1>

      {/* Tabs */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={() => setView("users")}
          className={`px-4 py-2 rounded-t-lg ${
            view === "users" ? "bg-primary text-white" : "bg-gray-200"
          }`}
        >
          Users
        </button>
        <button
          onClick={loadLogs}
          className={`px-4 py-2 rounded-t-lg ${
            view === "logs" ? "bg-primary text-white" : "bg-gray-200"
          }`}
        >
          Logs
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading…</div>
      ) : view === "users" ? (
        renderUserTable()
      ) : (
        renderLogViewer()
      )}
    </main>
  );
}
