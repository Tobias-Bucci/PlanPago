// src/pages/AdminPanel.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://192.168.1.150:8001";

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const authHeader = useMemo(() => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  }, []);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      try {
        const res = await fetch(`${API}/users/admin/users`, {
          headers: authHeader,
        });
        if (res.status === 401) return navigate("/login");
        if (res.status === 403) return navigate("/");
        if (!res.ok) throw new Error("Fehler beim Laden der Benutzer");
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        setError(err.message || "Unbekannter Fehler");
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, [authHeader, navigate]);

  const handleDelete = async (id) => {
    if (!window.confirm("Benutzer wirklich löschen?")) return;
    try {
      const res = await fetch(`${API}/users/admin/users/${id}`, {
        method: "DELETE",
        headers: authHeader,
      });
      if (!res.ok) throw new Error("Löschen fehlgeschlagen");
      setMessage("Benutzer gelöscht");
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      setError(err.message || "Unbekannter Fehler");
    }
  };

  return (
    <main className="container mx-auto p-6 animate-fadeIn">
      <h1 className="text-3xl font-semibold mb-6">Admin Panel</h1>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Lade Benutzer…</div>
      ) : (
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
                  <th className="px-6 py-3 text-left text-sm font-medium">E‑Mail</th>
                  <th className="px-6 py-3 text-center text-sm font-medium">Aktion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                      Keine Benutzer gefunden.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">{u.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{u.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
                        >
                          Löschen
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
