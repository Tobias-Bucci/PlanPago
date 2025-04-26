// src/pages/AdminPanel.jsx
import { API_BASE } from "../config";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trash2,
  Mail,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";

const API = API_BASE;

export default function AdminPanel() {
  /* ─────────────── state ─────────────────────────────── */
  const [tab, setTab]           = useState("users"); // users | logs | email | broadcast | health
  const [users, setUsers]       = useState([]);
  const [logs, setLogs]         = useState("");
  const [mailRaw, setMailRaw]   = useState("");
  const [health, setHealth]     = useState(null);    // {db, smtp, scheduler_jobs}
  const [busy, setBusy]         = useState(false);
  const [msg,  setMsg]          = useState("");
  const [err,  setErr]          = useState("");

  /* broadcast form */
  const [subj, setSubj] = useState("");
  const [body, setBody] = useState("");

  const navigate = useNavigate();
  const authHeader = useMemo(
    () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` }),
    []
  );

  /* ─────────────── helpers ────────────────────────────── */
  const fetchJSON = async (url) => {
    const r = await fetch(url, { headers: authHeader });
    if (r.status === 401) return navigate("/login");
    if (r.status === 403) return navigate("/");
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  };
  const fetchTXT = async (url) => {
    const r = await fetch(url, { headers: authHeader });
    if (r.status === 401) return navigate("/login");
    if (r.status === 403) return navigate("/");
    if (!r.ok) throw new Error(await r.text());
    return r.text();
  };

  /* ─────────────── load users (once) ──────────────────── */
  useEffect(() => {
    (async () => {
      try {
        setBusy(true);
        setUsers(await fetchJSON(`${API}/users/admin/users`));
      } catch (e) {
        setErr(e.message);
      } finally {
        setBusy(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─────────────── user deletion ─────────────────────── */
  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user permanently?")) return;
    setBusy(true);
    try {
      await fetch(`${API}/users/admin/users/${id}`, {
        method: "DELETE",
        headers: authHeader,
      });
      setUsers((u) => u.filter((x) => x.id !== id));
      setMsg("User deleted.");
      setErr("");
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  /* ─────────────── server & mail logs ─────────────────── */
  const loadLogs = async () => {
    setTab("logs");
    setBusy(true);
    try {
      setLogs(await fetchTXT(`${API}/admin/logs?lines=800`));
      setErr("");
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const loadMailLogs = async () => {
    setTab("email");
    setBusy(true);
    try {
      setMailRaw(await fetchTXT(`${API}/admin/email-logs?lines=800`));
      setErr("");
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  /* ─────────────── health check ───────────────────────── */
  const loadHealth = async () => {
    setTab("health");
    setBusy(true);
    try {
      setHealth(await fetchJSON(`${API}/users/admin/health`));
      setErr("");
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  /* ─────────────── broadcast ──────────────────────────── */
  const sendBroadcast = async (e) => {
    e.preventDefault();
    if (!subj.trim() || !body.trim()) {
      setErr("Subject and body required.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch(`${API}/users/admin/broadcast`, {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subj.trim(), body }),
      });
      if (!r.ok) throw new Error(await r.text());
      setMsg("Broadcast sent.");
      setSubj("");
      setBody("");
      setErr("");
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  /* ─────────────── mail-log parsing --------------------- */
  const groupedMails = React.useMemo(() => {
    if (!mailRaw) return [];
    const map = new Map();          // key = ts|subject
    mailRaw.split("\n").forEach((ln) => {
      if (!ln.trim()) return;
      const [ts, recipient, ...rest] = ln.split("  "); // double space delimiter
      const subject = rest.join("  ").trim();
      const key     = `${ts}|${subject}`;
      if (!map.has(key)) map.set(key, { ts, subject, recipients: [] });
      map.get(key).recipients.push(recipient);
    });
    return Array.from(map.values()).sort((a, b) => (a.ts < b.ts ? 1 : -1));
  }, [mailRaw]);

  const MailRow = ({ mail, idx }) => {
    const [open, setOpen] = useState(false);
    return (
      <div className={`border-b border-white/10 py-2 ${idx % 2 ? "bg-white/5" : ""}`}>
        <button
          className="w-full flex items-center justify-between text-left text-white/90 hover:bg-white/10 px-3 py-1"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="flex items-center gap-3">
            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <span className="font-mono text-xs opacity-70">{mail.ts}</span>
            <span>{mail.subject}</span>
          </span>
          <span className="text-sm opacity-70">{mail.recipients.length}</span>
        </button>
        {open && (
          <ul className="mt-1 ml-8 list-disc list-inside text-amber-200 text-sm">
            {mail.recipients.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  /* ─────────────── tiny components ────────────────────── */
  const TabBtn = ({ id, label, onClick }) => (
    <button
      onClick={onClick}
      className={`px-6 py-2 rounded-t-lg font-medium transition
        ${
          tab === id
            ? "bg-[var(--brand)] text-white"
            : "bg-white/10 text-white/70 hover:bg-white/20"
        }`}
    >
      {label}
    </button>
  );

  const Status = ({ ok }) =>
    ok ? (
      <span className="flex items-center gap-1 text-emerald-400">
        <CheckCircle size={16} /> OK
      </span>
    ) : (
      <span className="flex items-center gap-1 text-red-400">
        <XCircle size={16} /> FAIL
      </span>
    );

  /* ─────────────── JSX ───────────────────────────────── */
  return (
    <main className="container mx-auto pt-24 p-6">
      <div className="glass-card animate-pop">
        {/* Tabs */}
        <div className="flex border-b border-white/20 mb-4">
          <TabBtn id="users"      label="Users"         onClick={() => setTab("users")} />
          <TabBtn id="logs"       label="Server logs"   onClick={loadLogs} />
          <TabBtn id="email"      label="E-mail logs"   onClick={loadMailLogs} />
          <TabBtn id="broadcast"  label="Broadcast"     onClick={() => setTab("broadcast")} />
          <TabBtn id="health"     label="Health"        onClick={loadHealth} />
        </div>

        {/* flash msgs */}
        {msg && (
          <p className="mb-4 p-2 bg-emerald-600/20 text-emerald-300 rounded">
            {msg}
          </p>
        )}
        {err && (
          <p className="mb-4 p-2 bg-red-600/20 text-red-300 rounded">
            {err}
          </p>
        )}

        {/* main area */}
        {busy ? (
          <p className="flex items-center justify-center py-20 text-white/60 gap-2">
            <Loader2 className="animate-spin" size={18} /> Please wait…
          </p>
        ) : (
          <>
            {/* USERS --------------------------------------------------- */}
            {tab === "users" && (
            <div className="overflow-hidden rounded-lg ring-1 ring-white/10">
              <table className="min-w-full text-left">
                {/* Kopf */}
                <thead className="bg-white/10 text-white/80">
                  <tr>
                    <th className="px-6 py-3 rounded-tl-lg">ID</th>
                    <th className="px-6 py-3">E-mail</th>
                    <th className="px-6 py-3 text-center rounded-tr-lg">Action</th>
                  </tr>
                </thead>

                {/* Body */}
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td
                        colSpan="3"
                        className="px-6 py-4 text-center text-white/60 bg-black/20 rounded-b-lg"
                      >
                        No users.
                      </td>
                    </tr>
                  ) : (
                    users.map((u, i) => {
                      const isLast = i === users.length - 1;
                      return (
                        <tr
                          key={u.id}
                          className={`${
                            i % 2 ? "bg-white/5" : "bg-white/10/0"
                          } ${isLast ? "rounded-b-lg" : ""}`}
                        >
                          <td
                            className={`px-6 py-4 ${i === 0 ? "pt-5" : ""} ${
                              isLast ? "pb-5" : ""
                            }`}
                          >
                            {u.id}
                          </td>
                          <td className="px-6 py-4">{u.email}</td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => deleteUser(u.id)}
                              title="Delete user"
                              className="p-2 bg-red-600 rounded-md hover:bg-red-700
                                        focus:outline-none focus:ring-2 focus:ring-red-400
                                        transition-shadow"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

            {/* SERVER LOGS -------------------------------------------- */}
            {tab === "logs" && (
              <pre className="h-[70vh] overflow-auto bg-black/30 text-green-300 p-4 rounded-lg whitespace-pre-wrap">
                {logs || "No server logs."}
              </pre>
            )}

            {/* MAIL LOGS --------------------------------------------- */}
            {tab === "email" && (
              <div className="h-[70vh] overflow-auto bg-black/30 rounded-lg">
                {groupedMails.length === 0 ? (
                  <p className="p-4 text-amber-200">No e-mail logs.</p>
                ) : (
                  groupedMails.map((m, i) => <MailRow key={i} mail={m} idx={i} />)
                )}
              </div>
            )}

            {/* BROADCAST --------------------------------------------- */}
            {tab === "broadcast" && (
              <form onSubmit={sendBroadcast} className="space-y-4 max-w-xl">
                <h2 className="text-white text-xl font-medium flex items-center gap-2">
                  <Mail size={20} /> Broadcast to all users
                </h2>
                <input
                  className="frosted-input"
                  placeholder="Subject"
                  value={subj}
                  onChange={(e) => setSubj(e.target.value)}
                  required
                />
                <textarea
                  className="frosted-input"
                  rows={6}
                  placeholder="Message body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                />
                <button className="btn-accent" disabled={busy}>
                  {busy ? "Sending…" : "Send broadcast"}
                </button>
              </form>
            )}

            {/* HEALTH CHECK ------------------------------------------ */}
            {tab === "health" && (
              health ? (
                <div className="space-y-4 text-white">
                  <h2 className="text-xl font-medium">System health</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-white/10 rounded-lg flex items-center justify-between">
                      <span>Database</span> <Status ok={health.db} />
                    </div>
                    <div className="p-4 bg-white/10 rounded-lg flex items-center justify-between">
                      <span>SMTP login</span> <Status ok={health.smtp} />
                    </div>
                    <div className="p-4 bg-white/10 rounded-lg flex items-center justify-between">
                      <span>Scheduled jobs</span>
                      <span className="flex items-center gap-1 text-emerald-300">
                        {health.scheduler_jobs}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="py-10 text-center text-white/60">
                  No data – click the tab again to refresh.
                </p>
              )
            )}
          </>
        )}
      </div>
    </main>
  );
}
