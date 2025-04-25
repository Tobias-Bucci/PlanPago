// src/pages/AdminPanel.jsx
import { API_BASE } from "../config";
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";

const API = API_BASE;

export default function AdminPanel() {
  /* ───── state ───────────────────────────────────────────── */
  const [view,  setView]   = useState("users");     // "users" | "logs"
  const [users, setUsers]  = useState([]);
  const [logs,  setLogs]   = useState("");
  const [msg,   setMsg]    = useState("");
  const [err,   setErr]    = useState("");
  const [busy,  setBusy]   = useState(false);
  const navigate = useNavigate();

  const authHeader = useMemo(() => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  }), []);

  /* ───── fetch users on mount ────────────────────────────── */
  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line
  }, []);

  async function loadUsers() {
    setBusy(true); setErr("");
    try {
      const r = await fetch(`${API}/users/admin/users`, { headers: authHeader });
      if (r.status === 401) return navigate("/login");
      if (r.status === 403) return navigate("/");
      if (!r.ok)  throw new Error("Could not fetch users");
      setUsers(await r.json());
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  /* ───── fetch logs (lazy) ───────────────────────────────── */
  async function loadLogs() {
    setView("logs"); setBusy(true); setErr(""); setLogs("");
    try {
      const r = await fetch(`${API}/admin/logs?lines=500`, { headers: authHeader });
      if (r.status === 401) return navigate("/login");
      if (r.status === 403) return navigate("/");
      if (!r.ok) throw new Error("Could not fetch logs");
      setLogs(await r.text());
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  /* ───── delete user ─────────────────────────────────────── */
  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user permanently?")) return;
    setErr(""); setMsg(""); setBusy(true);
    try {
      const r = await fetch(`${API}/users/admin/users/${id}`, {
        method: "DELETE",
        headers: authHeader,
      });
      if (!r.ok) throw new Error("Deletion failed");
      setUsers((u) => u.filter((x) => x.id !== id));
      setMsg("User deleted.");
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  /* ───── reusable UI bits ────────────────────────────────── */
  const TabBtn = ({ id, children, onClick }) => (
    <button
      onClick={onClick}
      className={`px-6 py-2 rounded-t-lg font-medium transition
        ${view === id ? "bg-[var(--brand)] text-white"
                      : "bg-white/10 text-white/70 hover:bg-white/20"}`}
    >
      {children}
    </button>
  );

  /* ───── render users table ──────────────────────────────── */
  const UsersTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left">
        <thead className="bg-white/10 text-white/80">
          <tr>
            <th className="px-6 py-3">ID</th>
            <th className="px-6 py-3">E-mail</th>
            <th className="px-6 py-3 text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan="3" className="px-6 py-4 text-center text-white/60">
                No users found.
              </td>
            </tr>
          ) : (
            users.map((u, i) => (
              <tr
                key={u.id}
                className={`${i % 2 ? "bg-white/5" : ""} hover:bg-white/10`}
              >
                <td className="px-6 py-4">{u.id}</td>
                <td className="px-6 py-4">{u.email}</td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => deleteUser(u.id)}
                    className="p-2 bg-red-600 rounded-lg hover:bg-red-700 transition"
                    disabled={busy}
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  /* ───── JSX ─────────────────────────────────────────────── */
  return (
    <main className="container mx-auto pt-24 p-6">
      <div className="glass-card animate-pop">
        {/* tabs */}
        <div className="flex border-b border-white/20 mb-4">
          <TabBtn id="users" onClick={() => setView("users")}>
            Users
          </TabBtn>
          <TabBtn id="logs"  onClick={loadLogs}>
            Logs
          </TabBtn>
        </div>

        {/* flash messages */}
        {msg && (
          <p className="mb-4 px-4 py-2 rounded-lg bg-emerald-600/20 text-emerald-300">
            {msg}
          </p>
        )}
        {err && (
          <p className="mb-4 px-4 py-2 rounded-lg bg-red-600/20 text-red-300">
            {err}
          </p>
        )}

        {/* dynamic content */}
        {busy ? (
          <p className="text-center py-20 text-white/60">Loading…</p>
        ) : view === "users" ? (
          <UsersTable />
        ) : (
          <pre className="h-[70vh] overflow-auto bg-black/30 text-green-300 p-4 rounded-lg whitespace-pre-wrap">
            {logs || "No logs loaded."}
          </pre>
        )}
      </div>
    </main>
  );
}
