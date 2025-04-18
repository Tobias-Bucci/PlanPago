// src/pages/AdminPanel.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();
  const authHeader = useMemo(() => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await fetch("http://192.168.1.150:8001/users/admin/users", {
        headers: authHeader,
      });
      if (res.status === 401) return navigate("/login");
      if (res.status === 403) return navigate("/");
      if (!res.ok) {
        setError("Fehler beim Laden der Benutzer");
        return;
      }
      setUsers(await res.json());
    };
    fetchUsers();
  }, [authHeader, navigate]);

  const handleDelete = async (id) => {
    if (!window.confirm("Benutzer wirklich löschen?")) return;
    const res = await fetch(
      `http://192.168.1.150:8001/users/admin/users/${id}`,
      { method: "DELETE", headers: authHeader }
    );
    if (!res.ok) {
      setError("Fehler beim Löschen");
    } else {
      setMsg("Benutzer gelöscht");
      setUsers((u) => u.filter((x) => x.id !== id));
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Admin Panel</h1>
      {msg  && <p className="text-green-600 mb-4">{msg}</p>}
      {error && <p className="text-red-600 mb-4">{error}</p>}

      <table className="min-w-full bg-white border">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-4 border">ID</th>
            <th className="py-2 px-4 border">E‑Mail</th>
            <th className="py-2 px-4 border">Aktion</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td className="py-2 px-4 border">{u.id}</td>
              <td className="py-2 px-4 border">{u.email}</td>
              <td className="py-2 px-4 border">
                <button
                  onClick={() => handleDelete(u.id)}
                  className="text-red-600"
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
