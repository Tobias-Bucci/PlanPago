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
  const [message, setMessage] = useState("");
  const [tempToken, setTempToken] = useState("");
  const [code, setCode] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("http://192.168.1.150:8001/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          navigate("/login");
          return;
        }
        const data = await res.json();
        setEmail(data.email);
        // Settings aus LocalStorage laden
        localStorage.setItem("currentEmail", data.email);
        setCountry(localStorage.getItem(`country_${data.email}`) || "");
        setCurrency(localStorage.getItem(`currency_${data.email}`) || "EUR");
      } catch {
        navigate("/login");
      }
    };
    fetchProfile();
  }, [token, navigate]);

  // Schritt 1: altes PW + neue Werte anfordern → tempToken + Mail
  const handleRequest = async (e) => {
    e.preventDefault();
    setMessage("");
    const body = { old_password: oldPassword };
    if (email) body.email = email;
    if (newPassword) body.password = newPassword;
    try {
      const res = await fetch("http://192.168.1.150:8001/users/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || res.status);
      }
      setTempToken(data.temp_token);
      setMessage("Ein Code wurde an Ihre E‑Mail gesendet. Bitte eingeben.");
    } catch (err) {
      setMessage("Fehler: " + err.message);
    }
  };

  // Schritt 2: Code eingeben → Änderungen anwenden
  const handleConfirm = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch("http://192.168.1.150:8001/users/me/confirm", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ temp_token: tempToken, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || res.status);
      }
      // Email aktualisieren in LocalStorage
      const oldMail = localStorage.getItem("currentEmail");
      if (oldMail && oldMail !== data.email) {
        // Settings transfer
        const ctry = localStorage.getItem(`country_${oldMail}`);
        const ccy = localStorage.getItem(`currency_${oldMail}`);
        if (ctry) localStorage.setItem(`country_${data.email}`, ctry);
        if (ccy) localStorage.setItem(`currency_${data.email}`, ccy);
        localStorage.removeItem(`country_${oldMail}`);
        localStorage.removeItem(`currency_${oldMail}`);
      }
      localStorage.setItem("currentEmail", data.email);
      setEmail(data.email);
      setOldPassword("");
      setNewPassword("");
      setCode("");
      setTempToken("");
      setMessage("Profil erfolgreich aktualisiert!");
    } catch (err) {
      setMessage("Fehler: " + err.message);
    }
  };

  // Settings speichern (Land/Währung)
  const handleSettingsSave = () => {
    localStorage.setItem(`country_${email}`, country);
    localStorage.setItem(`currency_${email}`, currency);
    setMessage("Einstellungen gespeichert!");
  };

  // Account löschen
  const handleDelete = async () => {
    if (!window.confirm("Account wirklich löschen?")) return;
    try {
      const res = await fetch("http://192.168.1.150:8001/users/me", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || res.status);
      }
      // LocalStorage aufräumen
      localStorage.removeItem(`country_${email}`);
      localStorage.removeItem(`currency_${email}`);
      localStorage.removeItem("token");
      localStorage.removeItem("currentEmail");
      navigate("/register");
    } catch (err) {
      setMessage("Fehler: " + err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white shadow rounded mt-8">
      <h2 className="text-2xl font-bold text-center mb-4">Nutzereinstellungen</h2>
      {message && <p className="text-center text-green-600 mb-4">{message}</p>}

      {!tempToken ? (
        /* Schritt 1: Formular für Update‑Request */
        <form onSubmit={handleRequest} className="space-y-4">
          <div>
            <label className="block font-medium">E‑Mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
          </div>
          <div>
            <label className="block font-medium">Altes Passwort</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
          </div>
          <div>
            <label className="block font-medium">Neues Passwort</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border p-2 rounded"
              placeholder="Leer lassen, wenn nicht ändern"
            />
          </div>
          <button className="w-full bg-blue-600 text-white p-2 rounded">
            Änderungen anfordern
          </button>
        </form>
      ) : (
        /* Schritt 2: Code bestätigen */
        <form onSubmit={handleConfirm} className="space-y-4">
          <div>
            <label className="block font-medium">Bestätigungscode</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full border p-2 rounded"
              placeholder="6‑stelliger Code"
              required
            />
          </div>
          <button className="w-full bg-green-600 text-white p-2 rounded">
            Code bestätigen
          </button>
        </form>
      )}

      {/* Persönliche Einstellungen */}
      <div className="mt-8">
        <h3 className="text-xl font-bold mb-2">Persönliche Einstellungen</h3>
        <div className="mb-4">
          <label className="block font-medium">Land</label>
          <CountryAutoComplete value={country} onChange={setCountry} />
        </div>
        <div className="mb-4">
          <label className="block font-medium">Währung</label>
          <select
            className="w-full border p-2 rounded"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="CHF">CHF</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
        <button
          onClick={handleSettingsSave}
          className="w-full bg-green-600 text-white p-2 rounded"
        >
          Einstellungen speichern
        </button>
      </div>

      {/* Account löschen */}
      <div className="mt-8">
        <button
          onClick={handleDelete}
          className="w-full bg-red-600 text-white p-2 rounded"
        >
          Account löschen
        </button>
      </div>
    </div>
  );
}
