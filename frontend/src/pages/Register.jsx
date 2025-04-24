import { API_BASE } from "../config";
import React, { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";

export default function Register() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [tempToken, setTemp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const API = API_BASE;

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const reg = await fetch(`${API}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (reg.status !== 201) {
        const err = await reg.json();
        throw new Error(err.detail || "Registration failed");
      }
      // direkt Code anfordern
      const form = new URLSearchParams({ username: email, password });
      const login1 = await fetch(`${API}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      });
      if (!login1.ok) throw new Error("Code request failed");
      const { temp_token } = await login1.json();
      setTemp(temp_token);
      setStep(2);
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
      if (!res.ok) throw new Error("Invalid code");
      const { access_token } = await res.json();
      localStorage.setItem("token", access_token);
      navigate("/dashboard", { replace: true });
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
              placeholder="E‑Mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent transition"
            />
            <input
              type="password"
              placeholder="Password"
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
              {loading ? "Please wait…" : "Register"}
            </button>
            <p className="text-center text-sm">
              Hast du schon einen Account?{" "}
              <NavLink to="/login" className="text-accent hover:underline">
                Anmelden
              </NavLink>
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <input
              type="text"
              placeholder="6-digit code via E‑Mail"
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
              {loading ? "Validation..." : "Confirm"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
