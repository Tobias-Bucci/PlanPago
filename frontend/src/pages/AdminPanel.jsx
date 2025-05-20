import { API_BASE } from "../config";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trash2, Mail, ChevronDown, ChevronRight,
  CheckCircle, XCircle, Loader2, Users, Server, Send, HeartPulse
} from "lucide-react";
import ConfirmModal from "../components/ConfirmModal";

const API = API_BASE;

export default function AdminPanel() {
  /* ─────────────── state ─────────────────────────────── */
  const [tab, setTab]     = useState("users");
  const [users, setUsers] = useState([]);
  const [logs, setLogs]   = useState("");
  const [mailRaw, setMailRaw] = useState("");
  const [health, setHealth]   = useState(null);
  const [busy, setBusy]       = useState(false);
  const [msg,  setMsg]        = useState("");
  const [err,  setErr]        = useState("");

  /* Dialog state for ConfirmModal */
  const [dialog, setDialog] = useState({ open: false });

  /* Impersonation waiting modal state */
  const [impersonateWait, setImpersonateWait] = useState({ open: false, user: null, requestId: null });

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
  const reallyDeleteUser = async (id) => {
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

  const deleteUser = (id) =>
    setDialog({
      open: true,
      title: "Delete user?",
      message: "This action cannot be undone.",
      onConfirm: () => reallyDeleteUser(id),
    });

  /* ─────────────── server & mail logs ─────────────────── */
  const loadLogs = async () => {
    setTab("logs"); setBusy(true);
    try   { setLogs(await fetchTXT(`${API}/admin/logs?lines=800`)); setErr(""); }
    catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const loadMailLogs = async () => {
    setTab("email"); setBusy(true);
    try   { setMailRaw(await fetchTXT(`${API}/admin/email-logs?lines=800`)); setErr(""); }
    catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  /* ─────────────── health check ───────────────────────── */
  const loadHealth = async () => {
    setTab("health"); setBusy(true);
    try   { setHealth(await fetchJSON(`${API}/users/admin/health`)); setErr(""); }
    catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  /* ─────────────── broadcast ──────────────────────────── */
  const sendBroadcast = async (e) => {
    e.preventDefault();
    if (!subj.trim() || !body.trim()) {
      setErr("Subject and body required."); return;
    }
    setBusy(true);
    try {
      const r = await fetch(`${API}/users/admin/broadcast`, {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subj.trim(), body }),
      });
      if (!r.ok) throw new Error(await r.text());
      setMsg("Broadcast sent."); setSubj(""); setBody(""); setErr("");
    } catch (e) {
      setErr(e.message);
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
      const [ts, recipient, ...rest] = ln.split("  ");
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
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] p-0">
      <div className="w-[1100px] h-[800px] max-w-full mx-auto rounded-3xl bg-white/10 shadow-2xl border border-white/10 backdrop-blur-2xl px-8 py-10 relative overflow-hidden animate-pop flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-6 mb-10 border-b border-white/10 pb-6 pl-2">
          <div className="bg-[var(--brand)] rounded-full p-4 shadow-lg flex items-center justify-center">
            <Users className="text-white" size={36} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-wide">Admin Panel</h1>
            <p className="text-white/60 text-base mt-1">Manage users, system health, logs & more</p>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex border-b border-white/20 mb-10 gap-2 px-2">
          <TabBtn id="users" label={<><Users size={20} className="inline mr-2"/>Users</>} onClick={() => setTab("users")} />
          <TabBtn id="logs"  label={<><Server size={20} className="inline mr-2"/>Server logs</>} onClick={loadLogs} />
          <TabBtn id="email" label={<><Mail size={20} className="inline mr-2"/>E-mail logs</>} onClick={loadMailLogs} />
          <TabBtn id="broadcast" label={<><Send size={20} className="inline mr-2"/>Broadcast</>} onClick={() => setTab("broadcast")} />
          <TabBtn id="health" label={<><HeartPulse size={20} className="inline mr-2"/>Health</>} onClick={loadHealth} />
        </div>
        {/* flash msgs */}
        {msg && <p className="mb-6 p-3 bg-emerald-600/20 text-emerald-300 rounded-lg shadow text-center text-lg font-medium max-w-lg mx-auto">{msg}</p>}
        {err && <p className="mb-6 p-3 bg-red-600/20 text-red-300 rounded-lg shadow text-center text-lg font-medium max-w-lg mx-auto">{err}</p>}
        {/* main area */}
        <div className="flex-1 flex flex-col overflow-hidden">
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
            {/* SERVER LOGS -------------------------------------------- */}
            {tab === "logs" && (
              <pre className="h-full min-h-[400px] max-h-full overflow-auto bg-black/40 text-green-300 p-8 rounded-2xl whitespace-pre-wrap shadow-inner border border-white/10 mt-2 text-base leading-relaxed">
                {logs || "No server logs."}
              </pre>
            )}
            {/* MAIL LOGS --------------------------------------------- */}
            {tab === "email" && (
              <div className="h-full min-h-[400px] max-h-full overflow-auto bg-black/40 rounded-2xl shadow-inner border border-white/10 mt-2 p-6">
                {groupedMails.length === 0 ? (
                  <p className="p-4 text-amber-200">No e-mail logs.</p>
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
                  <h2 className="text-2xl font-bold flex items-center gap-3 mb-4"><HeartPulse size={24}/> System health</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="p-8 bg-white/10 rounded-2xl flex items-center justify-between shadow-lg border border-white/10">
                      <span className="text-lg">Database</span> <Status ok={health.db} />
                    </div>
                    <div className="p-8 bg-white/10 rounded-2xl flex items-center justify-between shadow-lg border border-white/10">
                      <span className="text-lg">SMTP login</span> <Status ok={health.smtp} />
                    </div>
                    <div className="p-8 bg-white/10 rounded-2xl flex items-center justify-between shadow-lg border border-white/10">
                      <span className="text-lg">Scheduled jobs</span>
                      <span className="flex items-center gap-1 text-emerald-300 text-lg font-semibold">{health.scheduler_jobs}</span>
                    </div>
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
          confirmLabel="Cancel"
          onConfirm={() => setImpersonateWait({ open: false, user: null, requestId: null })}
        />
      )}
    </main>
  );
}
