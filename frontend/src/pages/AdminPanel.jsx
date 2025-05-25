import { API_BASE } from "../config";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trash2, Mail, ChevronDown, ChevronRight,
  CheckCircle, XCircle, Loader2, Users, Server, Send, HeartPulse
} from "lucide-react";
import ConfirmModal from "../components/ConfirmModal";
import Notification from "../components/Notification"; // Import Notification

const API = API_BASE;

export default function AdminPanel() {
  /* ─────────────── state ─────────────────────────────── */
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [mailRaw, setMailRaw] = useState("");
  const [health, setHealth] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [notification, setNotification] = useState({ message: "", type: "" }); // State for Notification

  /* Dialog state for ConfirmModal */
  const [dialog, setDialog] = useState({ open: false });

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
  const reallyDeleteUser = async (id) => {
    setBusy(true);
    try {
      await fetch(`${API}/users/admin/users/${id}`, {
        method: "DELETE",
        headers: authHeader,
      });
      setUsers((u) => u.filter((x) => x.id !== id));
      setNotification({ message: "User deleted successfully.", type: "success" }); // Use Notification
      setErr("");
    } catch (e) {
      setNotification({ message: e.message, type: "error" }); // Use Notification for error
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
    try { setMailRaw(await fetchTXT(`${API}/admin/email-logs?lines=800`)); setErr(""); }
    catch (e) { setErr(e.message); }
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

      setErr("");
    }
    catch (e) {
      setErr(e.message);
      setUptime("Error fetching data");
      setBuildInfo("Error fetching data");
    }
    finally { setBusy(false); }
  };

  /* ─────────────── broadcast ──────────────────────────── */
  const sendBroadcast = async (e) => {
    e.preventDefault();
    if (!subj.trim() || !body.trim()) {
      setNotification({ message: "Subject and body required.", type: "error" }); // Use Notification
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
      setNotification({ message: "Broadcast sent successfully.", type: "success" }); // Use Notification
      setSubj(""); setBody(""); setBroadcastFiles([]); setErr("");
    } catch (e) {
      setNotification({ message: e.message, type: "error" }); // Use Notification for error
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
      className={`px-6 py-2 rounded-t-lg font-medium transition
        ${tab === id
          ? "bg-[var(--brand)] text-white"
          : "bg-white/10 text-white/70 hover:bg-white/20"}`}
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
  // Keine separate useEffect für Health-Tab mehr nötig, 
  // loadHealth-Funktion handhabt jetzt alles

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] p-0">
      <div className="w-full max-w-5xl mx-auto rounded-3xl bg-white/10 shadow-2xl border border-white/10 backdrop-blur-2xl px-2 sm:px-6 md:px-8 py-6 md:py-10 relative overflow-hidden animate-pop flex flex-col min-h-[80vh]">
        {/* Header */}
        <div className="flex items-center gap-4 sm:gap-6 mb-8 sm:mb-10 border-b border-white/10 pb-4 sm:pb-6 pl-1 sm:pl-2">
          <div className="bg-[var(--brand)] rounded-full p-3 sm:p-4 shadow-lg flex items-center justify-center">
            <Users className="text-white" size={32} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">Admin Panel</h1>
            <p className="text-white/60 text-base mt-1">Manage users, system health, logs & more</p>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex border-b border-white/20 mb-6 sm:mb-10 gap-1 sm:gap-2 px-1 sm:px-2 overflow-x-auto">
          <TabBtn id="users" label={<><Users size={20} className="inline mr-2" />Users</>} onClick={() => setTab("users")} />
          <TabBtn id="email" label={<><Mail size={20} className="inline mr-2" />E-mail logs</>} onClick={loadMailLogs} />
          <TabBtn id="broadcast" label={<><Send size={20} className="inline mr-2" />Broadcast</>} onClick={() => setTab("broadcast")} />
          <TabBtn id="health" label={<><HeartPulse size={20} className="inline mr-2" />Health</>} onClick={loadHealth} />
        </div>
        {/* flash msgs */}
        <Notification message={notification.message} type={notification.type} onDone={() => setNotification({ message: "", type: "" })} />
        {/* main area */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-[400px]">
          {busy ? (
            <p className="flex items-center justify-center py-32 text-white/60 gap-3 text-xl">
              <Loader2 className="animate-spin" size={28} /> Please wait…
            </p>
          ) : (
            <>
              {/* USERS --------------------------------------------------- */}
              {tab === "users" && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="overflow-auto rounded-2xl ring-1 ring-white/10 bg-gradient-to-br from-black/40 to-white/5 p-0 mt-2 h-full flex-1">
                    <table className="min-w-full text-left h-full">
                      <thead className="bg-white/10 text-white/80 sticky top-0 z-10">
                        <tr>
                          <th className="px-8 py-4 rounded-tl-2xl text-lg font-semibold">ID</th>
                          <th className="px-8 py-4 text-lg font-semibold">E-mail</th>
                          <th className="px-8 py-4 text-center rounded-tr-2xl text-lg font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody className="align-top">
                        {users.length === 0 ? (
                          <tr>
                            <td colSpan="3" className="px-8 py-6 text-center text-white/60 bg-black/20 rounded-b-2xl text-lg">
                              No users.
                            </td>
                          </tr>
                        ) : (
                          users.map((u, i) => {
                            const isLast = i === users.length - 1;
                            return (
                              <tr
                                key={u.id}
                                className={`transition hover:bg-[var(--brand)]/10 ${i % 2 ? "bg-white/5" : ""} ${isLast ? "rounded-b-2xl" : ""}`}
                              >
                                <td className={`px-8 py-4 font-mono text-base text-white/80 flex items-center gap-4 ${i === 0 ? "pt-6" : ""} ${isLast ? "pb-6" : ""}`}>
                                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--brand)]/80 text-white font-bold text-lg shadow">
                                    {u.email?.[0]?.toUpperCase() || "U"}
                                  </span>
                                  {u.id}
                                </td>
                                <td className="px-8 py-4 text-white/90 text-base align-middle">{u.email}</td>
                                <td className="px-8 py-4 text-center flex gap-4 justify-center align-middle">
                                  <button
                                    onClick={() => deleteUser(u.id)}
                                    title="Delete user"
                                    className="p-3 bg-red-600 rounded-xl hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 transition-shadow shadow text-white flex items-center justify-center"
                                  >
                                    <Trash2 size={20} />
                                  </button>
                                  <button
                                    onClick={async () => {
                                      setBusy(true);
                                      setMsg("");
                                      setErr("");
                                      // Show waiting modal immediately
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
                                        setErr(e.message);
                                        setImpersonateWait({ open: false, user: null, requestId: null });
                                      } finally {
                                        setBusy(false);
                                      }
                                    }}
                                    title="Login as user"
                                    className="p-3 bg-blue-600 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow text-white shadow flex items-center justify-center"
                                  >
                                    <span className="sr-only">Login as user</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="inline w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H3m0 0l4-4m-4 4l4 4m13-4a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {/* MAIL LOGS --------------------------------------------- */}
              {tab === "email" && (
                <div className="flex-1 flex flex-col w-full max-w-3xl mx-auto bg-black/60 rounded-2xl shadow-xl border border-white/10 mt-2 p-4 overflow-auto custom-scrollbar">
                  {groupedMails.length === 0 ? (
                    <p className="p-2 text-amber-200 text-xs">No e-mail logs.</p>
                  ) : (
                    groupedMails.map((m, i) => <MailRow key={i} mail={m} idx={i} />)
                  )}
                </div>
              )}
              {/* BROADCAST --------------------------------------------- */}
              {tab === "broadcast" && (
                <div className="flex-1 flex flex-col justify-center items-center">
                  <form onSubmit={sendBroadcast} className="space-y-6 w-full max-w-lg bg-white/10 p-10 rounded-2xl shadow-xl border border-white/10 mt-2 flex flex-col justify-center">
                    <h2 className="text-white text-2xl font-bold flex items-center gap-3 mb-4">
                      <Mail size={24} /> Broadcast to all users
                    </h2>
                    <input
                      className="frosted-input w-full px-5 py-3 rounded-lg text-base bg-white/20 border border-white/20 focus:ring-2 focus:ring-[var(--brand)] focus:outline-none text-white placeholder-white/60"
                      placeholder="Subject"
                      value={subj}
                      onChange={(e) => setSubj(e.target.value)}
                      required
                    />
                    <textarea
                      className="frosted-input w-full px-5 py-3 rounded-lg text-base bg-white/20 border border-white/20 focus:ring-2 focus:ring-[var(--brand)] focus:outline-none text-white placeholder-white/60"
                      rows={6}
                      placeholder="Message body"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      required
                    />
                    {/* Datei-Upload */}
                    <div className="flex flex-col gap-2">
                      <label className="text-white/80 font-medium">Dateien anhängen</label>
                      <input
                        type="file"
                        multiple
                        className="block w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[var(--brand)]/80 file:text-white hover:file:bg-[var(--brand)]/100 bg-white/10 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                        onChange={e => setBroadcastFiles(Array.from(e.target.files))}
                      />
                      {broadcastFiles.length > 0 && (
                        <ul className="mt-2 space-y-1 bg-black/20 rounded-lg p-3 text-white/80 text-sm">
                          {broadcastFiles.map((file, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span className="inline-block w-4 h-4 bg-[var(--brand)]/80 rounded-full mr-2"></span>
                              {file.name}
                              <button
                                type="button"
                                className="ml-auto text-red-400 hover:text-red-600 text-xs font-bold px-2"
                                onClick={() => setBroadcastFiles(files => files.filter((_, i) => i !== idx))}
                                title="Entfernen"
                              >✕</button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <button className="btn-accent w-full py-3 text-lg font-bold rounded-lg shadow-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-pink-500 hover:to-purple-500 transition-all duration-200 text-white" disabled={busy}>
                      {busy ? "Sending…" : "Send broadcast"}
                    </button>
                  </form>
                </div>
              )}
              {/* HEALTH CHECK ------------------------------------------ */}
              {tab === "health" && (health ? (
                <div className="flex-1 flex flex-col justify-center items-center">
                  <div className="space-y-6 text-white mt-2 w-full max-w-2xl">
                    <h2 className="text-2xl font-bold flex items-center gap-3 mb-4"><HeartPulse size={24} /> System health</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="p-8 bg-white/10 rounded-2xl flex flex-col items-start justify-between shadow-lg border border-white/10">
                        <span className="text-lg mb-2">Database</span> <Status ok={health.db} />
                        <span className="text-xs mt-2 text-white/60">Checks DB connection with a test query.</span>
                      </div>
                      <div className="p-8 bg-white/10 rounded-2xl flex flex-col items-start justify-between shadow-lg border border-white/10">
                        <span className="text-lg mb-2">SMTP login</span> <Status ok={health.smtp} />
                        <span className="text-xs mt-2 text-white/60">Verifies mail server connectivity.</span>
                      </div>
                      <div className="p-8 bg-white/10 rounded-2xl flex flex-col items-start justify-between shadow-lg border border-white/10">
                        <span className="text-lg mb-2">Scheduled jobs</span>
                        <span className="flex items-center gap-1 text-emerald-300 text-lg font-semibold">{health.scheduler_jobs}</span>
                        <span className="text-xs mt-2 text-white/60">Active background jobs (reminders, etc).</span>
                      </div>
                    </div>

                    {/* Erweiterte Health-Infos */}
                    <div className="mt-10 bg-black/30 rounded-2xl p-6 border border-white/10 shadow-xl">
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Server size={20} /> Backend Diagnostics</h3>
                      <ul className="space-y-2 text-white/90 text-sm">
                        <li><b>Uptime:</b> <span>{uptime || "-"}</span></li>
                        <li><b>Server time:</b> {new Date().toLocaleString()}</li>
                        <li><b>Frontend build:</b> <span>{buildInfo || "-"}</span></li>
                        <li><b>Browser:</b> {navigator.userAgent}</li>
                        <li><b>Platform:</b> {navigator.platform}</li>
                        <li><b>Language:</b> {navigator.language}</li>
                        <li><b>Screen:</b> {window.screen.width}x{window.screen.height} px</li>
                        <li><b>Timezone:</b> {Intl.DateTimeFormat().resolvedOptions().timeZone}</li>
                        <li><b>API base:</b> {API}</li>
                      </ul>
                      <div className="mt-4 text-xs text-white/60">
                        <b>Tip:</b> For more details, check browser console and backend logs.
                      </div>
                    </div>

                    {/* Live ping to backend for latency */}
                    <div className="mt-8 flex flex-col gap-2 text-white/80 text-sm">
                      <span className="font-bold">Live API latency:</span>
                      <LatencyCheck api={API} />
                    </div>
                  </div>
                </div>
              ) : (
                <p className="py-10 text-center text-white/60">No data – click the tab again to refresh.</p>
              ))}
            </>
          )}
        </div>
      </div>
      {/* ───────── Confirm-Dialog ───────── */}
      <ConfirmModal
        open={dialog.open}
        title={dialog.title}
        message={dialog.message}
        onConfirm={dialog.onConfirm}
      />
      {/* ───────── Impersonation-Wait Modal ───────── */}
      {impersonateWait.open && (
        <ConfirmModal
          open={true}
          title="Waiting for user confirmation"
          message={`Waiting for ${impersonateWait.user?.email} to approve admin access.\n\nPlease inform the user that they need to confirm the email. This window will close automatically once the user has confirmed.`}
          onClose={() => setImpersonateWait({ open: false, user: null, requestId: null })}
        />
      )}
    </main>
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
