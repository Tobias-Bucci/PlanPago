// src/pages/Register.jsx
import { API_BASE } from "../config";
import React, { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";

/* helper – same as in Login */
const cacheProfile = async (token) => {
  try {
    const res = await fetch(`${API_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const me = await res.json();
    localStorage.setItem("currentEmail", me.email);
    localStorage.setItem(`country_${me.email}`, me.country || "");
    localStorage.setItem(`currency_${me.email}`, me.currency || "EUR");
  } catch {
    /* silent */
  }
};

export default function Register() {
  const [step, setStep]   = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPw] = useState("");
  const [code, setCode]   = useState("");
  const [tempToken, setT] = useState("");
  const [error, setErr]   = useState("");
  const [loading, setLd]  = useState(false);

  const navigate = useNavigate();
  const API = API_BASE;

  /* ───────── Step 1: create account ───────── */
  const handleRegister = async (e) => {
    e.preventDefault();
    setErr("");
    setLd(true);
    try {
      const reg = await fetch(`${API}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (reg.status !== 201) {
        const err = await reg.json().catch(() => ({}));
        throw new Error(err.detail || "Registration failed");
      }

      /* immediately request 2FA code */
      const form = new URLSearchParams({ username: email, password });
      const login1 = await fetch(`${API}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      });
      if (!login1.ok) throw new Error("Code request failed");
      const { temp_token } = await login1.json();
      setT(temp_token);
      setStep(2);
    } catch (err) {
      setErr(err.message);
    } finally {
      setLd(false);
    }
  };

  /* ───────── Step 2: confirm code ───────── */
  const handleVerify = async (e) => {
    e.preventDefault();
    setErr("");
    setLd(true);
    try {
      const res = await fetch(`${API}/users/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ temp_token: tempToken, code }),
      });
      if (!res.ok) throw new Error("Invalid code");
      const { access_token } = await res.json();
      localStorage.setItem("token", access_token);
      await cacheProfile(access_token);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setErr(err.message);
    } finally {
      setLd(false);
    }
  };

  /* ───────── JSX ───────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-light flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 animate-fadeIn transform hover:scale-[1.02] transition-transform duration-300">
        <h2 className="text-2xl font-semibold text-center mb-6">
          {step === 1 ? "Register" : "Confirm"}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg animate-fadeIn">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRegister} className="space-y-4">
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent transition"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPw(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent transition"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-200"
            >
              {loading ? "Please wait…" : "Register"}
            </button>
            <p className="text-center text-sm">
              Already have an account?{" "}
              <NavLink to="/login" className="text-accent hover:underline">
                Log in
              </NavLink>
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <input
              type="text"
              placeholder="6-digit code (e-mail)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent transition"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors duration-200"
            >
              {loading ? "Validating…" : "Confirm"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
