// Register.jsx  –  glass-morphism edition
import { API_BASE } from "../config";
import React, { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import AnimatedParticlesParallax from "../components/AnimatedParticlesParallax";

/* identical helper used in Login */
const cacheProfile = async (token) => {
  try {
    const r = await fetch(`${API_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return;
    const me = await r.json();
    localStorage.setItem("currentEmail", me.email);
    localStorage.setItem(`country_${me.email}`, me.country || "");
    localStorage.setItem(`currency_${me.email}`, me.currency || "EUR");
  } catch {/* silent */ }
};

const passwordValid = pw =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(pw);

export default function Register() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [temp, setTemp] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [ld, setLd] = useState(false);
  const [pwError, setPwError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [twofa, setTwofa] = useState("email");
  const [qrUrl, setQrUrl] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  // Neue States für Link-Klicks
  const [clickedTerms, setClickedTerms] = useState(false);
  const [clickedPrivacy, setClickedPrivacy] = useState(false);

  const navigate = useNavigate();
  const API = API_BASE;

  /* create account + request 2-FA code ----------------------- */
  const handleRegister = async (e) => {
    e.preventDefault();
    setErr(""); setLd(true);
    try {
      const r = await fetch(`${API}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pw, twofa_method: twofa }),
      });
      let regData;
      try {
        regData = await r.json();
      } catch {
        regData = { detail: await r.text() };
      }
      if (r.status !== 201 && r.status !== 200) {
        throw new Error(regData.detail || "Registration failed");
      }
      if (twofa === "totp" && regData.totp_qr_url) {
        setQrUrl(regData.totp_qr_url);
      }

      /* immediately trigger code */
      const form = new URLSearchParams({ username: email, password: pw });
      const login1 = await fetch(`${API}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      });
      if (!login1.ok) throw new Error("Code request failed");
      const loginData = await login1.json();
      setTemp(loginData.temp_token); setStep(2);
    } catch (e) { setErr(e.message) }
    finally { setLd(false) }
  };

  /* confirm 2-FA code ---------------------------------------- */
  const handleVerify = async (e) => {
    e.preventDefault();
    setErr(""); setLd(true);
    try {
      const r = await fetch(`${API}/users/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ temp_token: temp, code }),
      });
      if (!r.ok) throw new Error("Invalid code");
      const { access_token } = await r.json();
      localStorage.setItem("token", access_token);
      await cacheProfile(access_token);
      navigate("/dashboard", { replace: true });
    } catch (e) { setErr(e.message) }
    finally { setLd(false) }
  };

  /* ── JSX ─────────────────────────────────────────── */
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      position: "relative",
      overflow: "hidden",
      background: "linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #2d3748 50%, #1a202c 75%, #0f1419 100%)"
    }}>
      <AnimatedParticlesParallax />

      <div className="glass-card w-full max-w-md p-8 animate-pop" style={{ position: "relative", zIndex: 10 }}>
        <h2 className="text-2xl font-semibold text-center mb-6 tracking-wide">
          {step === 1 ? "Register" : "Confirm"}
        </h2>

        {err && (
          <div className="mb-4 p-3 bg-red-600/20 text-red-300 rounded-lg">
            {err}
          </div>
        )}

        {/* step 1 form */}
        {step === 1 && (
          <form onSubmit={handleRegister} className="space-y-4">
            <input
              type="email"
              placeholder="E-mail"
              className="frosted-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                placeholder="Password"
                className="frosted-input pr-10"
                value={pw}
                onChange={e => {
                  setPw(e.target.value);
                  setPwError(e.target.value && !passwordValid(e.target.value)
                    ? "Password must be at least 8 characters, include upper/lowercase, number, and special character."
                    : "");
                }}
                required
              />
              <button type="button" tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70" onClick={() => setShowPw(v => !v)} aria-label={showPw ? "Hide password" : "Show password"}>
                {showPw ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.956 9.956 0 012.223-3.592m3.31-2.687A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.956 9.956 0 01-4.043 5.306M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>
                )}
              </button>
            </div>
            <div>
              <label className="block text-white/80 mb-1">2FA Method</label>
              <select className="frosted-input" value={twofa} onChange={e => setTwofa(e.target.value)}>
                <option value="email">Email Code</option>
                <option value="totp">Authenticator App (TOTP)</option>
              </select>
            </div>
            {/* Terms and Conditions checkbox */}
            <div className="flex items-center flex-wrap">
              <input
                id="acceptTerms"
                type="checkbox"
                className="mr-2"
                checked={acceptTerms}
                onChange={e => setAcceptTerms(e.target.checked)}
                required
                disabled={!(clickedTerms && clickedPrivacy)}
              />
              <label htmlFor="acceptTerms" className="text-white/80 text-sm">
                I accept the{' '}
                <NavLink
                  to="/terms"
                  className="underline text-white"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setClickedTerms(true)}
                >
                  Terms
                </NavLink>
                {' '}and the{' '}
                <NavLink
                  to="/privacypolicy"
                  className="underline text-white"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setClickedPrivacy(true)}
                >
                  Privacy Policy
                </NavLink>
              </label>
            </div>
            {!(clickedTerms && clickedPrivacy) && (
              <div className="text-yellow-300 text-xs mb-1">You must visit both links before accepting.</div>
            )}
            {pwError && <div className="text-red-400 text-sm">{pwError}</div>}
            <button className="btn-primary w-full" disabled={ld || !!pwError || !passwordValid(pw) || !acceptTerms}>
              {ld ? "Please wait…" : "Register"}
            </button>
            <p className="text-center text-sm text-white/80">
              Already have an account?{" "}
              <NavLink to="/login" className="underline text-white">
                Log in
              </NavLink>
            </p>
          </form>
        )}

        {/* step 2 form */}
        {step === 2 && (
          <form onSubmit={handleVerify} className="space-y-4">
            {twofa === "totp" && qrUrl && (
              <div className="mb-4 p-4 bg-white/10 rounded-lg text-center">
                <p className="mb-3 text-white/90 text-sm">
                  Scan this QR code with your authenticator app:
                </p>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrUrl)}&bgcolor=ffffff&color=0d1117&qzone=1`}
                  alt="TOTP QR Code"
                  className="mx-auto mb-3 rounded-md border border-white/20 shadow-lg"
                  width="180"
                  height="180"
                />
                <p className="text-xs text-white/70 break-all bg-black/20 p-2 rounded-md">
                  {qrUrl}
                </p>
              </div>
            )}
            <input
              type="text"
              placeholder={twofa === "totp" ? "Authenticator app code" : "6-digit code"}
              className="frosted-input"
              value={code}
              onChange={e => setCode(e.target.value)}
              required
            />
            {twofa === "email" && (
              <div className="text-xs text-white/60">Code was sent via email.</div>
            )}
            {twofa === "totp" && (
              <div className="text-xs text-white/60">Enter the code from your Authenticator app.</div>
            )}
            <button className="btn-accent w-full" disabled={ld}>
              {ld ? "Validating…" : "Confirm"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
