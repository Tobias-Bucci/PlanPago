// src/pages/Profile.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CountryAutoComplete from "../utils/CountryAutoComplete";

export default function Profile() {
  const [email, setEmail]             = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [country, setCountry]         = useState("");
  const [currency, setCurrency]       = useState("EUR");
  const [message, setMessage]         = useState("");
  const [tempToken, setTempToken]     = useState("");
  const [code, setCode]               = useState("");
  const navigate                       = useNavigate();

  const token = localStorage.getItem("token");
  const API   = "http://192.168.1.150:8001";

  // — Lade Profil & initialisiere LocalStorage.currentEmail
  useEffect(() => {
    (async () => {
      const res = await fetch(`${API}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return navigate("/login");
      const data = await res.json();
      // setze currentEmail, damit alle anderen Seiten Country/CCY finden
      localStorage.setItem("currentEmail", data.email);
      setEmail(data.email);
      // lade vorhandene Settings
      setCountry(localStorage.getItem(`country_${data.email}`) || "");
      setCurrency(localStorage.getItem(`currency_${data.email}`) || "EUR");
    })();
  }, [API, navigate, token]);

  // — Schritt 1: Änderungs‑Request
  const handleRequest = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const body = { old_password: oldPassword };
      if (email)        body.email    = email;
      if (newPassword)  body.password = newPassword;

      const res = await fetch(`${API}/users/me`, {
        method:  "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Fehler beim Anfordern");
      setTempToken(data.temp_token);
      setMessage("Code gesendet – bitte unten bestätigen.");
    } catch (err) {
      setMessage("Fehler: " + err.message);
    }
  };

  // — Schritt 2: Code bestätigen & LocalStorage aktualisieren
  const handleConfirm = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch(`${API}/users/me/confirm`, {
        method:  "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ temp_token: tempToken, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Fehler beim Bestätigen");

      // falls Email geändert: LocalStorage.currentEmail anpassen
      const oldMail = localStorage.getItem("currentEmail");
      if (oldMail !== data.email) {
        // übertragen vorhandener Settings
        const oldC = localStorage.getItem(`country_${oldMail}`);
        const oldX = localStorage.getItem(`currency_${oldMail}`);
        if (oldC) localStorage.setItem(`country_${data.email}`, oldC);
        if (oldX) localStorage.setItem(`currency_${data.email}`, oldX);
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

  // — Speichere nur Land & Währung (Client‑Side)
  const handleSettingsSave = () => {
    if (!email) return;
    localStorage.setItem(`country_${email}`, country);
    localStorage.setItem(`currency_${email}`, currency);
    setMessage("Land & Währung gespeichert!");
  };

  // — Account löschen
  const handleDelete = async () => {
    if (!window.confirm("Account wirklich löschen?")) return;
    await fetch(`${API}/users/me`, {
      method:  "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    localStorage.clear();
    navigate("/register");
  };

  return (
    <main className="container mx-auto p-6 animate-fadeIn space-y-8">
      <h1 className="text-3xl font-semibold">Einstellungen</h1>

      {message && (
        <div className="p-4 bg-blue-50 text-blue-800 rounded-lg shadow animate-fadeIn">
          {message}
        </div>
      )}

      {/* — Passwort/Email ändern — */}
      {tempToken ? (
        <form
          onSubmit={handleConfirm}
          className="bg-white p-6 rounded-lg shadow-lg space-y-4"
        >
          <h2 className="text-xl font-medium">Code bestätigen</h2>
          <input
            type="text"
            placeholder="6‑stelliger Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent transition"
          />
          <button
            className="w-full py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors"
          >
            Bestätigen
          </button>
        </form>
      ) : (
        <form
          onSubmit={handleRequest}
          className="bg-white p-6 rounded-lg shadow-lg space-y-4"
        >
          <h2 className="text-xl font-medium">Profil ändern</h2>
          <input
            type="email"
            placeholder="E‑Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent transition"
          />
          <input
            type="password"
            placeholder="Altes Passwort"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent transition"
          />
          <input
            type="password"
            placeholder="Neues Passwort (optional)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent transition"
          />
          <button
            className="w-full py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Änderungen anfordern
          </button>
        </form>
      )}

      {/* — Land & Währung — */}
      <section className="bg-white p-6 rounded-lg shadow-lg space-y-4">
        <h2 className="text-xl font-medium">Land & Währung</h2>
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
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent transition"
            >
              <option>EUR</option>
              <option>USD</option>
              <option>CHF</option>
              <option>GBP</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleSettingsSave}
            className="py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Einstellungen speichern
          </button>
        </div>
      </section>

      <button
        onClick={handleDelete}
        className="w-full py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
      >
        Account löschen
      </button>
    </main>
  );
}
