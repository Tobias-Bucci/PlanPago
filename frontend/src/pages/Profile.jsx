// src/pages/Profile.jsx
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
  const API = "http://192.168.1.150:8001";

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
      if (!res.ok) throw new Error(data.detail || "Fehler beim Anfordern");
      setTempToken(data.temp_token);
      setMessage("Code gesendet – bitte unten eingeben.");
    } catch (err) {
      setMessage("Fehler: " + err.message);
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
      if (!res.ok) throw new Error(data.detail || "Fehler beim Bestätigen");

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

      setMessage("Profil erfolgreich aktualisiert!");
      setOldPassword("");
      setNewPassword("");
      setCode("");
      setTempToken("");
    } catch (err) {
      setMessage("Fehler: " + err.message);
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
        throw new Error(data.detail || "Fehler beim Speichern der Einstellungen");
      }
      setMessage("Einstellungen gespeichert!");
    } catch (err) {
      setMessage("Fehler: " + err.message);
    }
  };

  // — Account löschen
  const handleDelete = async () => {
    if (!window.confirm("Account wirklich löschen?")) return;
    await fetch(`${API}/users/me`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    localStorage.clear();
    navigate("/register");
  };

  return (
    <main className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-semibold">Einstellungen</h1>

      {message && (
        <div className="p-4 bg-blue-50 text-blue-800 rounded-lg shadow">
          {message}
        </div>
      )}

      {/* Passwort/Email ändern */}
      {tempToken ? (
        <form onSubmit={handleConfirm} className="space-y-4 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-medium">Code bestätigen</h2>
          <input
            type="text"
            placeholder="6‑stelliger Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent"
          />
          <button className="w-full py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition">
            Bestätigen
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
            placeholder="Altes Passwort"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent"
          />
          <input
            type="password"
            placeholder="Neues Passwort (optional)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent"
          />
          <button className="w-full py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition">
            Änderungen anfordern
          </button>
        </form>
      )}

      {/* Land, Währung & E‑Mail-Reminders */}
      <section className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-xl font-medium">Persönliche Einstellungen</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium">Land</label>
            <CountryAutoComplete value={country} onChange={setCountry} />
          </div>
          <div>
            <label className="block mb-1 font-medium">Währung</label>
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
          <span className="font-medium">E‑Mail‑Erinnerungen aktivieren</span>
        </label>
        <div className="flex justify-end">
          <button
            onClick={handleSettingsSave}
            className="py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
          >
            Einstellungen speichern
          </button>
        </div>
      </section>

      <button
        onClick={handleDelete}
        className="w-full py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
      >
        Account löschen
      </button>
    </main>
  );
}
