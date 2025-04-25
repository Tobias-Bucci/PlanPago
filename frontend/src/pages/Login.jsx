// src/pages/Login.jsx
import { API_BASE } from "../config";
import React, { useState } from "react";
import { useNavigate, useLocation, NavLink } from "react-router-dom";

/* helper – fetch profile & cache country/currency */
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

export default function Login() {
  const [step, setStep]       = useState(1);
  const [email, setEmail]     = useState("");
  const [password, setPwd]    = useState("");
  const [tempToken, setTemp]  = useState("");
  const [code, setCode]       = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoad]    = useState(false);

  const navigate  = useNavigate();
  const location  = useLocation();
  const target    = location.state?.from || "/dashboard";
  const API       = API_BASE;

  /* ───────── Login step 1 ───────── */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoad(true);
    try {
      const form = new URLSearchParams({ username: email, password });
      const res  = await fetch(`${API}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Login failed");

      /* Access-token without 2FA */
      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
        await cacheProfile(data.access_token);
        navigate(target, { replace: true });
        return;
      }

      /* else enter 2FA */
      if (data.temp_token) {
        setTemp(data.temp_token);
        setStep(2);
      } else {
        throw new Error("Unexpected server response");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoad(false);
    }
  };

  /* ───────── Login step 2 (verify) ───────── */
  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoad(true);
    try {
      const res = await fetch(`${API}/users/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ temp_token: tempToken, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Invalid code");

      localStorage.setItem("token", data.access_token);
      await cacheProfile(data.access_token);
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoad(false);
    }
  };

  /* ───────── JSX ───────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-light flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 animate-fadeIn transform hover:scale-[1.02] transition-transform duration-300">
        <h2 className="text-2xl font-semibold text-center mb-6">
          {step === 1 ? "Log in" : "Confirm code"}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg animate-fadeIn">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleLogin} className="space-y-4">
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
              onChange={(e) => setPwd(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent transition"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-200"
            >
              {loading ? "Please wait…" : "Log in"}
            </button>
            <p className="text-center text-sm">
              Don’t have an account?{" "}
              <NavLink to="/register" className="text-accent hover:underline">
                Register
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
