import { API_BASE } from "../config";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trash2, Mail, ChevronDown, ChevronRight,
  CheckCircle, XCircle, Loader2, Users, Server, Send, HeartPulse
} from "lucide-react";
import ConfirmModal from "../components/ConfirmModal";
import Notification from "../components/Notification";
import { authCookies } from "../utils/cookieUtils";

const API = API_BASE;

export default function AdminPanel() {
  /* ─────────────── state ─────────────────────────────── */
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [mailRaw, setMailRaw] = useState("");
  const [health, setHealth] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" }); // State for Notification

  /* Dialog state for ConfirmModal */
  const [dialog, setDialog] = useState({ open: false });

  /* Database reset confirmation state */
  const [dbResetDialog, setDbResetDialog] = useState({ open: false, step: 1 });
  const [dbResetConfirmText, setDbResetConfirmText] = useState("");

  /* Impersonation waiting modal state */
  const [impersonateWait, setImpersonateWait] = useState({ open: false, user: null, requestId: null });

  /* broadcast form */
  const [subj, setSubj] = useState("");
  const [body, setBody] = useState("");
  // Neu: Dateien für Broadcast
  const [broadcastFiles, setBroadcastFiles] = useState([]);

  const [uptime, setUptime] = useState("");
  const [buildInfo, setBuildInfo] = useState("");

  const navigate = useNavigate();
  const authHeader = useMemo(
    () => ({ Authorization: `Bearer ${authCookies.getToken()}` }),
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
        setNotification({ message: e.message, type: "error" });
      } finally {
        setBusy(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─────────────── user deletion ─────────────────────── */
  const reallyDeleteUser = async (id) => {
    setBusy(true);
    try {
      await fetch(`${API}/users/admin/users/${id}`, {
        method: "DELETE",
        headers: authHeader,
      });
      setUsers((u) => u.filter((x) => x.id !== id));
      setNotification({ message: "User deleted successfully.", type: "success" });
    } catch (e) {
      setNotification({ message: e.message, type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const deleteUser = (id) =>
    setDialog({
      open: true,
      title: "Delete user?",
      message: "This action cannot be undone.",
      onConfirm: () => {
        reallyDeleteUser(id);
        setDialog({ open: false });
      },
    });

  /* ─────────────── server & mail logs ─────────────────── */
  const loadMailLogs = async () => {
    setTab("email"); setBusy(true);
    try {
      setMailRaw(await fetchTXT(`${API}/admin/email-logs?lines=800`));
    }
    catch (e) {
      setNotification({ message: e.message, type: "error" });
    }
    finally { setBusy(false); }
  };

  /* ─────────────── health check ───────────────────────── */
  const loadHealth = async () => {
    setTab("health"); setBusy(true);
    try {
      const data = await fetchJSON(`${API}/users/admin/health`);
      setHealth(data);

      // Uptime aus den Health-Daten extrahieren
      if (data.uptime) {
        setUptime(data.uptime);
      } else {
        console.log("Keine Uptime in den Health-Daten gefunden");
        setUptime("Backend running");  // Fallback-Wert
      }

      // Build-Info aus verschiedenen Quellen versuchen
      const meta = document.querySelector('meta[name="build-info"]');
      if (meta) {
        setBuildInfo(meta.content);
      } else if (window.BUILD_INFO) {
        setBuildInfo(window.BUILD_INFO);
      } else {
        // Ultimativer Fallback: aktuelle Zeit nutzen
        const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
        setBuildInfo(`Frontend active (${timestamp})`);
      }
    }
    catch (e) {
      setNotification({ message: e.message, type: "error" });
      setUptime("Error fetching data");
      setBuildInfo("Error fetching data");
    }
    finally { setBusy(false); }
  };

  /* ─────────────── broadcast ──────────────────────────── */
  const sendBroadcast = async (e) => {
    e.preventDefault();
    if (!subj.trim() || !body.trim()) {
      setNotification({ message: "Subject and body required.", type: "error" });
      return;
    }
    setBusy(true);
    try {
      let response;
      if (broadcastFiles.length > 0) {
        // Mit Dateianhängen: multipart/form-data
        const formData = new FormData();
        formData.append("subject", subj.trim());
        formData.append("body", body);
        broadcastFiles.forEach((file) => formData.append("files", file));
        response = await fetch(`${API}/users/admin/broadcast`, {
          method: "POST",
          headers: { ...authHeader }, // Content-Type NICHT setzen, Browser macht das
          body: formData,
        });
      } else {
        // Ohne Dateianhängen: JSON
        response = await fetch(`${API}/users/admin/broadcast`, {
          method: "POST",
          headers: { ...authHeader, "Content-Type": "application/json" },
          body: JSON.stringify({ subject: subj.trim(), body }),
        });
      }
      if (!response.ok) throw new Error(await response.text());
      setNotification({ message: "Broadcast sent successfully.", type: "success" });
      setSubj(""); setBody(""); setBroadcastFiles([]);
    } catch (e) {
      setNotification({ message: e.message, type: "error" });
    } finally {
      setBusy(false);
    }
  };

  /* ─────────────── mail-log parsing --------------------- */
  const groupedMails = React.useMemo(() => {
    if (!mailRaw) return [];
    const map = new Map();
    mailRaw.split("\n").forEach((ln) => {
      if (!ln.trim()) return;
      // Erkennung: Broadcast-Mails werden mit [Broadcast] im Betreff geloggt
      // (Backend muss das so loggen!)
      const [ts, recipient, ...rest] = ln.split("  ");
      const subject = rest.join("  ").trim();
      // Gruppierung: Broadcasts werden nach Betreff (mit [Broadcast]) gruppiert
      let groupKey;
      if (subject.startsWith("[Broadcast] ")) {
        groupKey = `[Broadcast]|${subject}`;
      } else {
        groupKey = `${ts}|${subject}`;
      }
      if (!map.has(groupKey)) {
        map.set(groupKey, {
          ts,
          subject,
          recipients: [],
          isBroadcast: subject.startsWith("[Broadcast] "),
        });
      }
      map.get(groupKey).recipients.push(recipient);
    });
    // Sortierung: Broadcasts zuerst, dann nach Zeit
    return Array.from(map.values()).sort((a, b) => {
      if (a.isBroadcast && !b.isBroadcast) return -1;
      if (!a.isBroadcast && b.isBroadcast) return 1;
      return a.ts < b.ts ? 1 : -1;
    });
  }, [mailRaw]);

  /* ─────────────── database reset functions ─────────── */
  const openDatabaseResetDialog = () => {
    setDbResetDialog({ open: true, step: 1 });
    setDbResetConfirmText("");
  };

  const resetDatabase = async () => {
    setBusy(true);
    try {
      const response = await fetch(`${API}/users/admin/reset-database`, {
        method: "POST",
        headers: authHeader,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      setNotification({ message: "Database has been reset successfully. All data has been deleted.", type: "success" });
      setDbResetDialog({ open: false, step: 1 });
      setDbResetConfirmText("");

      // Clear local storage and redirect to login
      localStorage.clear();
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);

    } catch (e) {
      setNotification({ message: e.message, type: "error" });
    } finally {
      setBusy(false);
    }
  };

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
            <span>
              {mail.isBroadcast ? (
                <span className="inline-flex items-center gap-2 text-pink-300 font-semibold">
                  [Broadcast]
                  <Mail size={14} className="inline" />
                  {mail.subject.replace(/^\[Broadcast\] /, "")}
                </span>
              ) : (
                mail.subject
              )}
            </span>
          </span>
          <span className="text-sm opacity-70">{mail.recipients.length}</span>
        </button>
        {open && (
          <ul className="mt-1 ml-8 list-disc list-inside text-amber-200 text-sm">
            {mail.recipients.map((r) => <li key={r}>{r}</li>)}
          </ul>
        )}
      </div>
    );
  };

  /* ─────────────── tiny components ────────────────────── */
  const TabBtn = ({ id, label, onClick }) => (
    <button
      onClick={onClick}
      className={`px-6 py-4 font-medium transition-all border-b-2 ${tab === id
        ? "border-blue-500 text-white bg-white/10"
        : "border-transparent text-white/70 hover:text-white hover:bg-white/5"
        }`}
    >
      {label}
    </button>
  );

  const Status = ({ ok }) =>
    ok ? (
      <div className="flex items-center justify-center gap-2 text-emerald-400">
        <CheckCircle size={20} />
        <span className="font-semibold">OK</span>
      </div>
    ) : (
      <div className="flex items-center justify-center gap-2 text-red-400">
        <XCircle size={20} />
        <span className="font-semibold">FAIL</span>
      </div>
    );

  /* ─────────────── JSX ───────────────────────────────── */
  // Keine separate useEffect für Health-Tab mehr nötig, 
  // loadHealth-Funktion handhabt jetzt alles

  return (
    <div className="min-h-screen" style={{
      position: "relative",
      overflow: "hidden",
      background: "linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #2d3748 50%, #1a202c 75%, #0f1419 100%)"
    }}>

      {/* Flash messages - positioned above everything */}
      <div className="fixed top-4 right-4 z-[9999]">
        <Notification message={notification.message} type={notification.type} onDone={() => setNotification({ message: "", type: "" })} />
      </div>

      <main className="container mx-auto pt-24 p-6 animate-fadeIn" style={{ position: "relative", zIndex: 10 }}>
        {/* Header */}
        <div className="mb-8 animate-pop">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Users className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-white mb-2 tracking-wide">Admin Panel</h1>
              <p className="text-white/70 text-lg">Manage users, system health, logs & more</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="glass-card mb-8 animate-pop">
          <div className="flex border-b border-white/20 overflow-x-auto">
            <TabBtn id="users" label={<><Users size={20} className="inline mr-2" />Users</>} onClick={() => setTab("users")} />
            <TabBtn id="email" label={<><Mail size={20} className="inline mr-2" />E-mail logs</>} onClick={loadMailLogs} />
            <TabBtn id="broadcast" label={<><Send size={20} className="inline mr-2" />Broadcast</>} onClick={() => setTab("broadcast")} />
            <TabBtn id="health" label={<><HeartPulse size={20} className="inline mr-2" />Health</>} onClick={loadHealth} />
          </div>

          {/* Main content area */}
          <div className="p-6">
            {busy ? (
              <div className="flex items-center justify-center py-32">
                <div className="text-center">
                  <Loader2 className="animate-spin mx-auto mb-4 text-white/70" size={32} />
                  <p className="text-white/60 text-lg">Please wait…</p>
                </div>
              </div>
            ) : (
              <>
                {/* USERS */}
                {tab === "users" && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-white mb-4">User Management</h2>
                    <div className="glass-card overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-white/90">
                          <thead className="bg-white/10 text-white/80">
                            <tr>
                              <th className="px-6 py-4 text-left font-semibold">User</th>
                              <th className="px-6 py-4 text-left font-semibold">Email</th>
                              <th className="px-6 py-4 text-center font-semibold">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users.length === 0 ? (
                              <tr>
                                <td colSpan="3" className="px-6 py-12 text-center text-white/60">
                                  <div className="text-4xl mb-4 opacity-50">👥</div>
                                  <p>No users found</p>
                                </td>
                              </tr>
                            ) : (
                              users.map((u, i) => (
                                <tr key={u.id} className={`border-b border-white/10 hover:bg-white/5 transition-colors ${i % 2 ? "bg-white/5" : ""}`}>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow">
                                        {u.email?.[0]?.toUpperCase() || "U"}
                                      </div>
                                      <span className="font-mono text-sm text-white/70">#{u.id}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-white/90">{u.email}</td>
                                  <td className="px-6 py-4">
                                    <div className="flex gap-2 justify-center">
                                      <button
                                        onClick={() => deleteUser(u.id)}
                                        title="Delete user"
                                        className="btn-accent bg-red-600 hover:bg-red-700 p-3 rounded-lg transition-all hover:scale-105"
                                      >
                                        <Trash2 size={18} />
                                      </button>
                                      <button
                                        onClick={async () => {
                                          setBusy(true);
                                          setImpersonateWait({ open: true, user: u, requestId: null });
                                          try {
                                            // Step 1: Create impersonation request (triggers email)
                                            const r = await fetch(`${API}/users/admin/impersonate-request/${u.id}`, {
                                              method: "POST",
                                              headers: authHeader,
                                            });
                                            if (!r.ok) throw new Error(await r.text());
                                            const data = await r.json();
                                            setImpersonateWait({ open: true, user: u, requestId: data.request_id });
                                            // Step 2: Poll for confirmation
                                            let confirmed = false;
                                            for (let i = 0; i < 60; ++i) { // up to 60s
                                              await new Promise(res => setTimeout(res, 2000));
                                              const poll = await fetch(`${API}/users/admin/impersonate-status/${data.request_id}`, { headers: authHeader });
                                              if (!poll.ok) throw new Error(await poll.text());
                                              const pollData = await poll.json();
                                              if (pollData.confirmed) { confirmed = true; break; }
                                            }
                                            if (!confirmed) throw new Error("User did not confirm in time.");
                                            // Step 3: Do the actual impersonation
                                            const r2 = await fetch(`${API}/users/admin/impersonate/${u.id}`, {
                                              method: "POST",
                                              headers: authHeader,
                                            });
                                            if (!r2.ok) throw new Error(await r2.text());
                                            const data2 = await r2.json();
                                            localStorage.setItem("token", data2.access_token);
                                            localStorage.setItem("currentEmail", u.email);
                                            setImpersonateWait({ open: false, user: null, requestId: null });
                                            navigate("/dashboard", { replace: true });
                                          } catch (e) {
                                            setNotification({ message: e.message, type: "error" });
                                            setImpersonateWait({ open: false, user: null, requestId: null });
                                          } finally {
                                            setBusy(false);
                                          }
                                        }}
                                        title="Login as user"
                                        className="btn-primary p-3 rounded-lg transition-all hover:scale-105"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H3m0 0l4-4m-4 4l4 4m13-4a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* EMAIL LOGS */}
                {tab === "email" && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Email Logs</h2>
                    <div className="glass-card max-h-96 overflow-y-auto">
                      {groupedMails.length === 0 ? (
                        <div className="p-12 text-center">
                          <div className="text-4xl mb-4 opacity-50">📧</div>
                          <p className="text-white/60">No email logs found</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-white/10">
                          {groupedMails.map((m, i) => <MailRow key={i} mail={m} idx={i} />)}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* BROADCAST */}
                {tab === "broadcast" && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Broadcast Message</h2>
                    <div className="max-w-2xl mx-auto">
                      <form onSubmit={sendBroadcast} className="space-y-6">
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

                        {/* File upload */}
                        <div className="space-y-3">
                          <label className="block text-white/80 font-medium">Attach Files</label>
                          <input
                            type="file"
                            multiple
                            className="frosted-file"
                            onChange={e => setBroadcastFiles(Array.from(e.target.files))}
                          />
                          {broadcastFiles.length > 0 && (
                            <div className="glass-card p-4">
                              <p className="text-white/70 text-sm mb-3">Selected files:</p>
                              <div className="space-y-2">
                                {broadcastFiles.map((file, idx) => (
                                  <div key={idx} className="flex items-center justify-between bg-white/10 rounded-lg p-3">
                                    <span className="text-white/90 text-sm">{file.name}</span>
                                    <button
                                      type="button"
                                      className="text-red-400 hover:text-red-300 transition-colors"
                                      onClick={() => setBroadcastFiles(files => files.filter((_, i) => i !== idx))}
                                    >
                                      <XCircle size={18} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <button
                          className="btn-primary w-full py-4 text-lg font-semibold"
                          disabled={busy}
                        >
                          {busy ? "Sending…" : "Send Broadcast"}
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* HEALTH CHECK */}
                {tab === "health" && (health ? (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-white mb-4">System Health</h2>

                    {/* Health status cards */}
                    <div className="grid grid-cols-3 gap-6 mb-8">
                      <div className="glass-card p-6 text-center">
                        <div className="text-lg font-semibold text-white mb-3">Database</div>
                        <Status ok={health.db} />
                        <p className="text-white/60 text-sm mt-2">Connection status</p>
                      </div>
                      <div className="glass-card p-6 text-center">
                        <div className="text-lg font-semibold text-white mb-3">SMTP</div>
                        <Status ok={health.smtp} />
                        <p className="text-white/60 text-sm mt-2">Mail server</p>
                      </div>
                      <div className="glass-card p-6 text-center">
                        <div className="text-lg font-semibold text-white mb-3">Scheduler</div>
                        <div className="text-emerald-400 text-xl font-bold">{health.scheduler_jobs}</div>
                        <p className="text-white/60 text-sm mt-2">Active jobs</p>
                      </div>
                    </div>

                    {/* System information */}
                    <div className="glass-card p-6">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Server size={20} /> System Information
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-white/70">Uptime:</span>
                            <span className="text-white">{uptime || "-"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/70">Server time:</span>
                            <span className="text-white">{new Date().toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/70">Frontend build:</span>
                            <span className="text-white">{buildInfo || "-"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/70">API base:</span>
                            <span className="text-white font-mono text-xs">{API}</span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-white/70">Browser:</span>
                            <span className="text-white text-xs">{navigator.userAgent.split(' ')[0]}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/70">Platform:</span>
                            <span className="text-white">{navigator.platform}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/70">Language:</span>
                            <span className="text-white">{navigator.language}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/70">Timezone:</span>
                            <span className="text-white">{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
                          </div>
                        </div>
                      </div>

                      {/* Live latency check */}
                      <div className="mt-6 pt-4 border-t border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="text-white/70">API Latency:</span>
                          <LatencyCheck api={API} />
                        </div>
                      </div>
                    </div>

                    {/* Danger Zone - Database Reset */}
                    <div className="glass-card p-6 border-2 border-red-500/30 bg-red-600/10">
                      <h3 className="text-lg font-semibold text-red-300 mb-4 flex items-center gap-2">
                        ⚠️ Danger Zone
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-white font-medium mb-2">Reset Database</h4>
                          <p className="text-white/70 text-sm mb-4">
                            This will permanently delete ALL data including users, contracts, and files.
                            The database will be recreated with only the admin account. This action cannot be undone.
                          </p>
                          <button
                            onClick={openDatabaseResetDialog}
                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                            disabled={busy}
                          >
                            <Trash2 size={18} />
                            Reset Database
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="glass-card p-12 text-center">
                    <div className="text-4xl mb-4 opacity-50">🔍</div>
                    <p className="text-white/60">Click the Health tab again to refresh data</p>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-[1] border-t border-white/10 py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <img src="/PlanPago-trans.png" alt="PlanPago" className="h-6 w-6" />
              <span className="text-lg font-semibold">PlanPago</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-white/70">
              <span>&copy; {new Date().getFullYear()} PlanPago</span>
              <a href="/imprint" className="hover:text-white transition-colors">
                Imprint & Contact
              </a>
              <a href="/privacypolicy" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="/terms" className="hover:text-white transition-colors">
                Terms & Conditions
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ConfirmModal
        open={dialog.open}
        title={dialog.title}
        message={dialog.message}
        onConfirm={dialog.onConfirm}
        onClose={() => setDialog({ open: false })}
      />

      {
        impersonateWait.open && (
          <ConfirmModal
            open={true}
            title="Waiting for user confirmation"
            message={`Waiting for ${impersonateWait.user?.email} to approve admin access.\n\nPlease inform the user that they need to confirm the email. This window will close automatically once the user has confirmed.`}
            onClose={() => setImpersonateWait({ open: false, user: null, requestId: null })}
          />
        )
      }

      {/* Database Reset Confirmation Modal */}
      {dbResetDialog.open && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="glass-card p-8 w-full max-w-md mx-4 animate-pop border-2 border-red-500/50">
            {dbResetDialog.step === 1 && (
              <>
                <h3 className="text-xl font-semibold mb-6 text-red-300 flex items-center gap-3">
                  ⚠️ Database Reset Warning
                </h3>
                <div className="space-y-4 mb-6">
                  <p className="text-white">
                    You are about to reset the entire database. This will:
                  </p>
                  <ul className="text-white/80 text-sm space-y-2 list-disc list-inside ml-4">
                    <li>Delete ALL user accounts (except admin)</li>
                    <li>Delete ALL contracts and data</li>
                    <li>Delete ALL uploaded files</li>
                    <li>Reset the database to factory state</li>
                  </ul>
                  <div className="bg-red-600/20 border border-red-500/50 rounded-lg p-4 mt-4">
                    <p className="text-red-300 font-semibold text-center">
                      THIS ACTION CANNOT BE UNDONE!
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    className="btn-accent px-6 py-2"
                    onClick={() => setDbResetDialog({ open: false, step: 1 })}
                  >
                    Cancel
                  </button>
                  <button
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    onClick={() => setDbResetDialog({ open: true, step: 2 })}
                  >
                    I Understand, Continue
                  </button>
                </div>
              </>
            )}

            {dbResetDialog.step === 2 && (
              <>
                <h3 className="text-xl font-semibold mb-6 text-red-300 flex items-center gap-3">
                  🔐 Final Confirmation
                </h3>
                <div className="space-y-4 mb-6">
                  <p className="text-white">
                    To confirm the database reset, please type the following text exactly:
                  </p>
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <code className="text-red-300 font-mono font-bold">RESET DATABASE NOW</code>
                  </div>
                  <input
                    type="text"
                    className="frosted-input"
                    placeholder="Type the confirmation text..."
                    value={dbResetConfirmText}
                    onChange={(e) => setDbResetConfirmText(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    className="btn-accent px-6 py-2"
                    onClick={() => setDbResetDialog({ open: false, step: 1 })}
                  >
                    Cancel
                  </button>
                  <button
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={resetDatabase}
                    disabled={dbResetConfirmText !== "RESET DATABASE NOW" || busy}
                  >
                    {busy ? "Resetting..." : "Reset Database"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div >
  );
}

// Zusatz-Komponente für Latenz
function LatencyCheck({ api }) {
  const [latency, setLatency] = React.useState(null);
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const t0 = performance.now();
      try {
        await fetch(`${api}/users/admin/health`, { cache: "no-store" });
        const t1 = performance.now();
        if (mounted) setLatency(Math.round(t1 - t0));
      } catch {
        if (mounted) setLatency(null);
      }
    })();
    return () => { mounted = false; };
  }, [api]);
  return (
    <span className="inline-block px-3 py-1 rounded bg-white/10">
      {latency === null ? "-" : `${latency} ms`}
    </span>
  );
}
