// Login.jsx  –  glass-morphism edition
import { API_BASE } from "../config";
import React, { useState } from "react";
import { useNavigate, useLocation, NavLink } from "react-router-dom";

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
        return navigate(target, { replace: true });
      }
      if (data.temp_token){
        setTemp(data.temp_token);
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
      navigate(target, { replace:true });
    } catch (err){ setError(err.message) }
    finally      { setLoad(false) }
  };

  /* ── JSX ─────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md p-8 animate-pop">
        <h2 className="text-2xl font-semibold text-center mb-6 tracking-wide">
          {step === 1 ? "Log in" : "Confirm code"}
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
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              className="frosted-input"
              value={password}
              onChange={e=>setPwd(e.target.value)}
              required
            />

            <button className="btn-primary w-full" disabled={loading}>
              {loading ? "Please wait…" : "Log in"}
            </button>

            <p className="text-center text-sm text-white/80">
              Don’t have an account?{" "}
              <NavLink to="/register" className="underline text-white">
                Register
              </NavLink>
            </p>
          </form>
        )}

        {/* ─── FORM – step 2 ─────────────────────────────── */}
        {step === 2 && (
          <form onSubmit={handleVerify} className="space-y-4">
            <input
              type="text"
              placeholder="6-digit code"
              className="frosted-input"
              value={code}
              onChange={e=>setCode(e.target.value)}
              required
            />

            <button className="btn-accent w-full" disabled={loading}>
              {loading ? "Validating…" : "Confirm"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
