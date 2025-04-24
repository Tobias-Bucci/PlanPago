// src/pages/Profile.jsx
import { API_BASE } from "../config";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CountryAutoComplete from "../utils/CountryAutoComplete";

export default function Profile() {
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [emailRemindersEnabled, setEmailRemindersEnabled] = useState(true);
  const [message, setMessage] = useState("");
  const [tempToken, setTempToken] = useState("");
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const API = API_BASE;

  // — Lade Profil und Einstellungen
  useEffect(() => {
    (async () => {
      const res = await fetch(`${API}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        navigate("/login");
        return;
      }
      const data = await res.json();
      setEmail(data.email);
      setEmailRemindersEnabled(data.email_reminders_enabled);
      localStorage.setItem("currentEmail", data.email);
      setCountry(localStorage.getItem(`country_${data.email}`) || "");
      setCurrency(localStorage.getItem(`currency_${data.email}`) || "EUR");
    })();
  }, [API, navigate, token]);

  // — Passwort/Email ändern anfordern (2FA)
  const handleRequest = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const body = { old_password: oldPassword };
      if (email) body.email = email;
      if (newPassword) body.password = newPassword;

      const res = await fetch(`${API}/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error during request");
      setTempToken(data.temp_token);
      setMessage("Code sent – please enter it below.");
    } catch (err) {
      setMessage("Error: " + err.message);
    }
  };

  // — Code bestätigen und Änderungen übernehmen
  const handleConfirm = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch(`${API}/users/me/confirm`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ temp_token: tempToken, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error confirming code");

      // Email ggf. in LocalStorage anpassen
      const oldMail = localStorage.getItem("currentEmail");
      if (oldMail !== data.email) {
        const oldCountry = localStorage.getItem(`country_${oldMail}`);
        const oldCurrency = localStorage.getItem(`currency_${oldMail}`);
        if (oldCountry) localStorage.setItem(`country_${data.email}`, oldCountry);
        if (oldCurrency) localStorage.setItem(`currency_${data.email}`, oldCurrency);
        localStorage.removeItem(`country_${oldMail}`);
        localStorage.removeItem(`currency_${oldMail}`);
      }
      localStorage.setItem("currentEmail", data.email);
      setEmail(data.email);

      setMessage("Profile updated successfully!");
      setOldPassword("");
      setNewPassword("");
      setCode("");
      setTempToken("");
    } catch (err) {
      setMessage("Error: " + err.message);
    }
  };

  // — Einstellungen (Land, Währung, E‑Mail-Reminders) speichern
  const handleSettingsSave = async () => {
    setMessage("");
    try {
      // Client‐side speichern
      localStorage.setItem(`country_${email}`, country);
      localStorage.setItem(`currency_${email}`, currency);

      // Serverseitig E‑Mail‑Reminders speichern
      const res = await fetch(`${API}/users/me/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email_reminders_enabled: emailRemindersEnabled }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Error saving settings");
      }
      setMessage("Settings saved!");
    } catch (err) {
      setMessage("Error: " + err.message);
    }
  };

  // — Account löschen
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your account?")) return;
    await fetch(`${API}/users/me`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    localStorage.clear();
    navigate("/register");
  };

  return (
    <main className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-semibold">Settings</h1>

      {message && (
        <div className="p-4 bg-blue-50 text-blue-800 rounded-lg shadow">
          {message}
        </div>
      )}

      {/* Passwort/Email ändern */}
      {tempToken ? (
        <form onSubmit={handleConfirm} className="space-y-4 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-medium">Confirm code</h2>
          <input
            type="text"
            placeholder="6-digit code via E‑Mail"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent"
          />
          <button className="w-full py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition">
            Confirm
          </button>
        </form>
      ) : (
        <form onSubmit={handleRequest} className="space-y-4 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-medium">Profil ändern</h2>
          <input
            type="email"
            placeholder="E‑Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent"
          />
          <input
            type="password"
            placeholder="Old password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent"
          />
          <input
            type="password"
            placeholder="New password (optional)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent"
          />
          <button className="w-full py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition">
            Request changes
          </button>
        </form>
      )}

      {/* Land, Währung & E‑Mail-Reminders */}
      <section className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-xl font-medium">Personal settings</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium">Country</label>
            <CountryAutoComplete value={country} onChange={setCountry} />
          </div>
          <div>
            <label className="block mb-1 font-medium">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent"
            >
              <option>EUR</option>
              <option>USD</option>
              <option>CHF</option>
              <option>GBP</option>
            </select>
          </div>
        </div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={emailRemindersEnabled}
            onChange={(e) => setEmailRemindersEnabled(e.target.checked)}
            className="h-5 w-5 rounded border focus:ring-accent"
          />
          <span className="font-medium">Enable email reminders</span>
        </label>
        <div className="flex justify-end">
          <button
            onClick={handleSettingsSave}
            className="py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
          >
            Save
          </button>
        </div>
      </section>

      <button
        onClick={handleDelete}
        className="w-full py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
      >
        Delete account
      </button>
    </main>
  );
}
