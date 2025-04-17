import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [step, setStep]         = useState(1);
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode]         = useState("");
  const [tempToken, setTemp]    = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const navigate                = useNavigate();

  // Schritt 1: Registrierung + Code anfordern
  const handleRegistration = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // 1a) User anlegen
      const reg = await fetch("http://192.168.1.150:8001/users/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (reg.status !== 201) {
        const err = await reg.json();
        throw new Error(err.detail || "Registrierung fehlgeschlagen");
      }

      // 1b) Code per E‑Mail anfordern (login‑Phase 1)
      const form = new URLSearchParams();
      form.append("username", email);
      form.append("password", password);
      const login1 = await fetch("http://192.168.1.150:8001/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      });
      if (!login1.ok) {
        const err = await login1.json();
        throw new Error(err.detail || "Code-Anforderung fehlgeschlagen");
      }
      const { temp_token } = await login1.json();
      setTemp(temp_token);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Schritt 2: Code validieren und direkt einloggen
  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://192.168.1.150:8001/users/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ temp_token: tempToken, code }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Code ungültig");
      }
      const { access_token } = await res.json();
      localStorage.setItem("token", access_token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {step === 1 ? "Registrieren" : "Code bestätigen"}
          </h2>
          {step === 1 && (
            <p className="mt-2 text-center text-sm text-gray-600">
              Hast du bereits einen Account?{" "}
              <a
                href="/login"
                className="font-medium text-blue-600 hover:text-blue-500 no-underline"
              >
                Melde dich an
              </a>
            </p>
          )}
        </div>
        {error && (
          <div className="text-red-500 text-sm text-center">{error}</div>
        )}
        {step === 1 && (
          <form className="mt-8 space-y-6" onSubmit={handleRegistration}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email-Adresse
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Email-Adresse"
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Passwort
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Passwort"
                />
              </div>
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {loading ? "Bitte warten..." : "Registrieren"}
              </button>
            </div>
          </form>
        )}
        {step === 2 && (
          <form className="mt-8 space-y-6" onSubmit={handleVerify}>
            <div>
              <label htmlFor="code" className="sr-only">
                Bestätigungscode
              </label>
              <input
                id="code"
                name="code"
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Code eingeben"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                {loading ? "Validiere..." : "Code bestätigen"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
