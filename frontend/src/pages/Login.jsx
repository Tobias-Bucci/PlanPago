// Login.jsx  –  glass-morphism edition
import { API_BASE } from "../config";
import React, { useState } from "react";
import { useNavigate, useLocation, NavLink } from "react-router-dom";
import Notification from "../components/Notification";

/* Cache country / currency locally after login ---------------- */
const cacheProfile = async (token) => {
  try {
    const res = await fetch(`${API_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const me = await res.json();
    localStorage.setItem("currentEmail", me.email);
    localStorage.setItem(`country_${me.email}`,  me.country  || "");
    localStorage.setItem(`currency_${me.email}`, me.currency || "EUR");
  } catch {/* silent */}
};

export default function Login() {
  /* ── state ──────────────────────────────────────────────── */
  const [step, setStep]       = useState(1);
  const [email, setEmail]     = useState("");
  const [password, setPwd]    = useState("");
  const [tempToken, setTemp]  = useState("");
  const [code, setCode]       = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoad]    = useState(false);

  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetPwd, setResetPwd] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  const [showPw, setShowPw] = useState(false);
  const [showResetPw, setShowResetPw] = useState(false);

  const [twofaMethod, setTwofaMethod] = useState("email");

  const navigate = useNavigate();
  const target   = useLocation().state?.from || "/dashboard";
  const API      = API_BASE;

  /* ── step 1: ask for e-mail & password ───────────────────── */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setLoad(true);
    try {
      const body = new URLSearchParams({ username: email, password });
      const r = await fetch(`${API}/users/login`, {
        method : "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body   : body.toString(),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail || "Login failed");

      if (data.access_token) {            // 2-FA already trusted
        localStorage.setItem("token", data.access_token);
        await cacheProfile(data.access_token);
        // Check if admin
        const meRes = await fetch(`${API}/users/me`, { headers: { Authorization: `Bearer ${data.access_token}` } });
        let me = null;
        if (meRes.ok) me = await meRes.json();
        if (me && me.email === "admin@admin") {
          localStorage.setItem("currentEmail", me.email);
          return navigate("/adminpanel", { replace: true });
        }
        return navigate(target, { replace: true });
      }
      if (data.temp_token){
        setTemp(data.temp_token);
        setTwofaMethod(data.twofa_method || "email");
        setStep(2);
      } else {
        throw new Error("Unexpected server response");
      }
    } catch (err){ setError(err.message) }
    finally      { setLoad(false) }
  };

  /* ── step 2: verify 2-FA code ────────────────────────────── */
  const handleVerify = async (e) => {
    e.preventDefault();
    setError(""); setLoad(true);
    try{
      const r = await fetch(`${API}/users/verify-code`,{
        method :"POST",
        headers: { "Content-Type":"application/json" },
        body   : JSON.stringify({ temp_token: tempToken, code }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail || "Invalid code");
      localStorage.setItem("token", data.access_token);
      await cacheProfile(data.access_token);
      // Check if admin
      const meRes = await fetch(`${API}/users/me`, { headers: { Authorization: `Bearer ${data.access_token}` } });
      let me = null;
      if (meRes.ok) me = await meRes.json();
      if (me && me.email === "admin@admin") {
        localStorage.setItem("currentEmail", me.email);
        return navigate("/adminpanel", { replace:true });
      }
      navigate(target, { replace:true });
    } catch (err){ setError(err.message) }
    finally      { setLoad(false) }
  };

  /* ── step 3: password reset ──────────────────────────────── */
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError(""); setResetMsg(""); setLoad(true);
    try {
      const r = await fetch(`${API}/users/password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail || "Failed to reset");
      if (data.temp_token) {
        setTemp(data.temp_token);
        setTwofaMethod(data.twofa_method || "email");
        setStep(5); // neuer Schritt für TOTP-Reset
      } else {
        setResetMsg("Password reset email sent. Check your inbox.");
        setTwofaMethod(data.twofa_method || "email");
        setStep(4); // wie bisher für E-Mail-Code
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoad(false);
    }
  };

  const handlePasswordResetConfirm = async (e) => {
    e.preventDefault();
    setError(""); setResetMsg(""); setLoad(true);
    try {
      const r = await fetch(`${API}/users/password-reset/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, code: resetCode, new_password: resetPwd }),
      });
      if (!r.ok) throw new Error("Invalid code or expired");
      setResetMsg("Password has been reset successfully.");
      setResetSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoad(false);
    }
  };

  /* ── JSX ─────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md p-8 animate-pop">
        <h2 className="text-2xl font-semibold text-center mb-6 tracking-wide">
          {step === 1 ? "Log in"
            : step === 2 ? "Confirm code"
            : step === 3 ? "Reset Password"
            : step === 4 ? "Set New Password"
            : step === 5 ? "Confirm code" // für TOTP-Reset
            : step === 6 ? "Set New Password" // für TOTP-Reset: neues Passwort
            : ""}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-600/20 text-red-300 rounded-lg">
            {error}
          </div>
        )}

        {/* ─── FORM – step 1 ─────────────────────────────── */}
        {step === 1 && (
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              autoComplete="username"
              placeholder="E-mail"
              className="frosted-input"
              value={email}
              onChange={e=>setEmail(e.target.value)}
              required
            />
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Password"
                className="frosted-input pr-10"
                value={password}
                onChange={e=>setPwd(e.target.value)}
                required
              />
              <button type="button" tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70" onClick={()=>setShowPw(v=>!v)} aria-label={showPw?"Hide password":"Show password"}>
                {showPw ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.956 9.956 0 012.223-3.592m3.31-2.687A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.956 9.956 0 01-4.043 5.306M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>
                )}
              </button>
            </div>

            <button className="btn-primary w-full" disabled={loading}>
              {loading ? "Please wait…" : "Log in"}
            </button>

            <p className="text-center text-sm text-white/80">
              Don’t have an account?{" "}
              <NavLink to="/register" className="underline text-white">
                Register
              </NavLink>
            </p>

            <p className="text-center text-sm text-white/80">
              <button
                type="button"
                className="underline text-white"
                onClick={() => setStep(3)}
              >
                Forgot Password?
              </button>
            </p>
          </form>
        )}

        {/* ─── FORM – step 2 ─────────────────────────────── */}
        {step === 2 && (
          <form onSubmit={handleVerify} className="space-y-4">
            <input
              type="text"
              placeholder={twofaMethod==="totp" ? "Code from Authenticator-App" : "6-digit code from email"}
              className="frosted-input"
              value={code}
              onChange={e=>setCode(e.target.value)}
              required
            />
            {twofaMethod==="email" && (
              <div className="text-xs text-white/60">A 6-digit code was sent to your email.</div>
            )}
            {twofaMethod==="totp" && (
              <div className="text-xs text-white/60">Enter the 6-digit code from your Authenticator-App.</div>
            )}
            <button className="btn-accent w-full" disabled={loading}>
              {loading ? "Validating…" : "Confirm"}
            </button>
          </form>
        )}

        {/* ─── FORM – step 3 ─────────────────────────────── */}
        {step === 3 && (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="frosted-input"
              value={resetEmail}
              onChange={e => setResetEmail(e.target.value)}
              required
            />
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Email"}
            </button>
            {resetMsg && (
              <Notification message={resetMsg} type="success" onDone={() => setResetMsg("")} />
            )}
          </form>
        )}

        {/* ─── FORM – step 4 ─────────────────────────────── */}
        {step === 4 && (
          <form onSubmit={handlePasswordResetConfirm} className="space-y-4">
            <input
              type="text"
              placeholder="6-digit code"
              className="frosted-input"
              value={resetCode}
              onChange={e => setResetCode(e.target.value)}
              required
            />
            <div className="relative">
              <input
                type={showResetPw ? "text" : "password"}
                placeholder="New password"
                className="frosted-input pr-10"
                value={resetPwd}
                onChange={e => setResetPwd(e.target.value)}
                required
              />
              <button type="button" tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70" onClick={()=>setShowResetPw(v=>!v)} aria-label={showResetPw?"Hide password":"Show password"}>
                {showResetPw ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.956 9.956 0 012.223-3.592m3.31-2.687A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.956 9.956 0 01-4.043 5.306M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>
                )}
              </button>
            </div>
            <button className="btn-primary w-full" disabled={loading || resetSuccess}>
              {loading ? "Resetting..." : resetSuccess ? "Done" : "Set new password"}
            </button>
            {resetMsg && (
              <Notification message={resetMsg} type="success" onDone={() => setResetMsg("")} />
            )}
          </form>
        )}

        {/* ─── FORM – step 5 (TOTP-Reset) ─────────────────────── */}
        {step === 5 && (
          <form onSubmit={async e => {
            e.preventDefault();
            setError(""); setLoad(true);
            try {
              const r = await fetch(`${API}/users/verify-code`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ temp_token: tempToken, code }),
              });
              const data = await r.json();
              if (!r.ok) throw new Error(data.detail || "Invalid code");
              // Nach erfolgreicher TOTP-Validierung: Passwort-Reset-Dialog anzeigen
              setStep(6);
            } catch (err) {
              setError(err.message);
            } finally {
              setLoad(false);
            }
          }} className="space-y-4">
            <input
              type="text"
              placeholder="Code from Authenticator-App"
              className="frosted-input"
              value={code}
              onChange={e => setCode(e.target.value)}
              required
            />
            <div className="text-xs text-white/60">Enter the 6-digit code from your Authenticator-App.</div>
            <button className="btn-accent w-full" disabled={loading}>
              {loading ? "Validating…" : "Confirm"}
            </button>
          </form>
        )}

        {/* ─── FORM – step 6 (TOTP-Reset: neues Passwort) ─────── */}
        {step === 6 && (
          <form onSubmit={async e => {
            e.preventDefault();
            setError(""); setResetMsg(""); setLoad(true);
            try {
              const r = await fetch(`${API}/users/password-reset/confirm`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: resetEmail, code, new_password: resetPwd }),
              });
              if (!r.ok) throw new Error("Invalid code or expired");
              setResetMsg("Password has been reset successfully.");
              setResetSuccess(true);
            } catch (err) {
              setError(err.message);
            } finally {
              setLoad(false);
            }
          }} className="space-y-4">
            <div className="relative">
              <input
                type={showResetPw ? "text" : "password"}
                placeholder="New password"
                className="frosted-input pr-10"
                value={resetPwd}
                onChange={e => setResetPwd(e.target.value)}
                required
              />
              <button type="button" tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70" onClick={()=>setShowResetPw(v=>!v)} aria-label={showResetPw?"Hide password":"Show password"}>
                {showResetPw ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.956 9.956 0 012.223-3.592m3.31-2.687A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.956 9.956 0 01-4.043 5.306M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>
                )}
              </button>
            </div>
            <button className="btn-primary w-full" disabled={loading || resetSuccess}>
              {loading ? "Resetting..." : resetSuccess ? "Done" : "Set new password"}
            </button>
            {resetMsg && (
              <Notification message={resetMsg} type="success" onDone={() => setResetMsg("")} />
            )}
          </form>
        )}
      </div>
    </div>
  );
}
