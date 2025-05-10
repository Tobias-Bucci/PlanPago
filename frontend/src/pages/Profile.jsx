import { API_BASE } from "../config";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CountryAutoComplete from "../utils/CountryAutoComplete";
import ConfirmModal from "../components/ConfirmModal";

const passwordValid = pw =>
  !pw || /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(pw);

export default function Profile() {
  /* state */
  const [email, setEmail]     = useState("");
  const [oldPw, setOldPw]     = useState("");
  const [newPw, setNewPw]     = useState("");
  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [emailRem, setEmailRem] = useState(true);
  const [msg, setMsg]         = useState("");
  const [tmp, setTmp]         = useState("");
  const [code, setCode]       = useState("");
  const [newPwError, setNewPwError] = useState("");
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [twofaMethod, setTwofaMethod] = useState("email");

  /* Dialog-State */
  const [dialog, setDialog]   = useState({ open: false });

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const API   = API_BASE;

  /* load profile */
  useEffect(() => {
    (async () => {
      const r = await fetch(`${API}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) return navigate("/login");
      const me = await r.json();
      setEmail(me.email);
      setCountry(me.country || "");
      setCurrency(me.currency || "EUR");
      setEmailRem(me.email_reminders_enabled);
      setTwofaMethod(me.twofa_method || "email");
      localStorage.setItem("currentEmail", me.email);
    })();
  }, [API, navigate, token]);

  /* request / confirm change */
  const requestChange = async e => {
    e.preventDefault(); setMsg("");
    try {
      const body = { old_password: oldPw };
      if (email) body.email = email;
      if (newPw) body.password = newPw;
      const r = await fetch(`${API}/users/me`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Error");
      setTmp(d.temp_token); setMsg("Code sent – confirm below.");
    } catch (err) { setMsg("Error: " + err.message); }
  };
  const confirmChange = async e => {
    e.preventDefault(); setMsg("");
    try {
      const r = await fetch(`${API}/users/me/confirm`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ temp_token: tmp, code }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Invalid code");
      localStorage.setItem("currentEmail", d.email);
      setEmail(d.email); setTmp(""); setCode(""); setOldPw(""); setNewPw("");
      setMsg("Profile updated.");
    } catch (err) { setMsg("Error: " + err.message); }
  };

  /* save settings */
  const saveSettings = async () => {
    setMsg("");
    try {
      const r = await fetch(`${API}/users/me/settings`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ country, currency, email_reminders_enabled: emailRem }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.detail || "Error");
      }
      localStorage.setItem(`country_${email}`, country);
      localStorage.setItem(`currency_${email}`, currency);
      setMsg("Settings saved.");
    } catch (err) { setMsg("Error: " + err.message); }
  };

  /* delete */
  const reallyDeleteAccount = async () => {
    await fetch(`${API}/users/me`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    localStorage.clear(); navigate("/register");
  };
  const delAccount = () =>
    setDialog({
      open: true,
      title: "Delete account?",
      message: "All your contracts and files will be removed. Continue?",
      onConfirm: reallyDeleteAccount,
    });

  /* UI */
  return (
    <main className="container mx-auto pt-24 p-6 space-y-8">
      <h1 className="text-3xl font-semibold text-white">Settings</h1>

      {msg && <div className="glass-card p-4 text-emerald-200">{msg}</div>}

      {/* change email / pw */}
      {tmp ? (
        <form onSubmit={confirmChange} className="glass-card p-6 space-y-6 animate-pop">
          <h2 className="text-xl font-medium text-white">Confirm code</h2>
          <div className="space-y-2">
            <label className="block text-white/80 mb-1">
              {twofaMethod==="totp" ? "Code from Authenticator-App" : "6-digit code from email"}
            </label>
            <input className="frosted-input" placeholder={twofaMethod==="totp" ? "Code from Authenticator-App" : "6-digit code from email"}
                   value={code} onChange={e => setCode(e.target.value)} required />
            {twofaMethod === "email" && (
              <div className="text-xs text-white/60">A 6-digit code was sent to your email.</div>
            )}
            {twofaMethod === "totp" && (
              <div className="text-xs text-white/60">Enter the 6-digit code from your Authenticator-App.</div>
            )}
          </div>
          <button className="btn-accent w-full">Confirm</button>
        </form>
      ) : (
        <form onSubmit={requestChange} className="glass-card p-6 space-y-6 animate-pop">
          <h2 className="text-xl font-medium text-white">Change profile</h2>
          <div className="space-y-2">
            <label className="block text-white/80 mb-1">E-mail</label>
            <input className="frosted-input" type="email" placeholder="E-mail"
                   value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <label className="block text-white/80 mb-1">Current password</label>
            <div className="relative">
              <input className="frosted-input pr-10" type={showOldPw ? "text" : "password"} placeholder="Current password"
                     value={oldPw} onChange={e => setOldPw(e.target.value)} required />
              <button type="button" tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70" onClick={() => setShowOldPw(v => !v)} aria-label={showOldPw ? "Hide password" : "Show password"}>
                {showOldPw ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.956 9.956 0 012.223-3.592m3.31-2.687A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.956 9.956 0 01-4.043 5.306M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>
                )}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-white/80 mb-1">New password (optional)</label>
            <div className="relative">
              <input className="frosted-input pr-10" type={showNewPw ? "text" : "password"} placeholder="New password (optional)"
                     value={newPw} onChange={e => {
                       setNewPw(e.target.value);
                       setNewPwError(e.target.value && !passwordValid(e.target.value)
                         ? "Password must be at least 8 characters, include upper/lowercase, number, and special character."
                         : "");
                     }} />
              <button type="button" tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70" onClick={() => setShowNewPw(v => !v)} aria-label={showNewPw ? "Hide password" : "Show password"}>
                {showNewPw ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.956 9.956 0 012.223-3.592m3.31-2.687A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.956 9.956 0 01-4.043 5.306M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>
                )}
              </button>
            </div>
            {newPw && newPwError && <div className="text-red-400 text-sm">{newPwError}</div>}
          </div>
          <button className="btn-primary w-full" disabled={!!newPw && !!newPwError}>Request change</button>
        </form>
      )}

      {/* personal settings */}
      <section className="glass-card p-6 space-y-6 animate-pop">
        <h2 className="text-xl font-medium text-white">Personal settings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-white/80 mb-1">Country</label>
            <CountryAutoComplete value={country} onChange={setCountry} />
          </div>
          <div className="space-y-2">
            <label className="block text-white/80 mb-1">Currency</label>
            <select className="frosted-input" value={currency} onChange={e => setCurrency(e.target.value)}>
              <option>EUR</option><option>USD</option><option>CHF</option><option>GBP</option>
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 text-white/90">
          <input type="checkbox" checked={emailRem}
                 onChange={e => setEmailRem(e.target.checked)}
                 className="h-5 w-5 rounded" />
          Enable e-mail reminders
        </label>
        <div className="text-right">
          <button onClick={saveSettings} className="btn-primary">Save</button>
        </div>
      </section>

      <button onClick={delAccount}
              className="btn-accent bg-red-600 hover:bg-red-700 w-full">
        Delete account
      </button>

      {/* Confirm-Dialog */}
      <ConfirmModal
        open={dialog.open}
        title={dialog.title}
        message={dialog.message}
        onConfirm={dialog.onConfirm}
        onClose={() => setDialog({ open: false })}
      />
    </main>
  );
}
