// src/pages/Login.jsx
import { API_BASE } from "../config";
import React, { useState } from "react";
import { useNavigate, useLocation, NavLink } from "react-router-dom";

export default function Login() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tempToken, setTemp] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const target = location.state?.from || "/dashboard";

  const API = API_BASE;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const form = new URLSearchParams({ username: email, password });
      const res = await fetch(`${API}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Login fehlgeschlagen");
      }

      // Wenn direkt Access-Token zurückgegeben wird, überspringe 2FA
      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
        navigate(target, { replace: true });
        return;
      }

      // Sonst 2FA-Code-Phase
      if (data.temp_token) {
        setTemp(data.temp_token);
        setStep(2);
      } else {
        throw new Error("Unerwartete Server-Antwort");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/users/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ temp_token: tempToken, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Code ungültig");
      localStorage.setItem("token", data.access_token);
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-light flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 animate-fadeIn transform hover:scale-[1.02] transition-transform duration-300">
        <h2 className="text-2xl font-semibold text-center mb-6">
          {step === 1 ? "Anmelden" : "Code bestätigen"}
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
              placeholder="E‑Mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent transition"
            />
            <input
              type="password"
              placeholder="Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent transition"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-200"
            >
              {loading ? "Bitte warten…" : "Anmelden"}
            </button>
            <p className="text-center text-sm">
              Noch keinen Account?{" "}
              <NavLink to="/register" className="text-accent hover:underline">
                Registrieren
              </NavLink>
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <input
              type="text"
              placeholder="6‑stelliger Code"
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
              {loading ? "Validiere…" : "Code bestätigen"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
