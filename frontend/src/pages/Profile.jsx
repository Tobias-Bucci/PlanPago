import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CountryAutoComplete from "../components/CountryAutoComplete";

const Profile = () => {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  /* ── Profil laden ─────────────────────────────────────── */
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

        // E‑Mail im localStorage merken
        localStorage.setItem("currentEmail", data.email);

        // user‑spezifische Einstellungen laden
        setCountry(localStorage.getItem(`country_${data.email}`) || "");
        setCurrency(localStorage.getItem(`currency_${data.email}`) || "EUR");
      } catch (err) {
        console.error(err);
        navigate("/login");
      }
    };
    fetchProfile();
  }, [token, navigate]);

  /* ── Profil aktualisieren (E‑Mail/Passwort) ───────────── */
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const body = { email };
    if (newPassword) body.password = newPassword;

    const res = await fetch("http://192.168.1.150:8001/users/me", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const oldMail = localStorage.getItem("currentEmail");
      if (oldMail && oldMail !== email) transferSettings(oldMail, email);
      localStorage.setItem("currentEmail", email);
      setMessage("Profil aktualisiert!");
      setNewPassword("");
    } else {
      const err = await res.json();
      setMessage("Update fehlgeschlagen: " + (err.detail || res.status));
    }
  };

  /* ── Einstellungen speichern (user‑spezifisch) ────────── */
  const handleSettingsSave = () => {
    localStorage.setItem(`country_${email}`, country);
    localStorage.setItem(`currency_${email}`, currency);
    setMessage("Einstellungen gespeichert!");
  };

  /* ── Account löschen ──────────────────────────────────── */
  const handleDeleteAccount = async () => {
    if (!window.confirm("Account wirklich löschen?")) return;

    const res = await fetch("http://192.168.1.150:8001/users/me", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      // nur eigene Keys entfernen
      localStorage.removeItem(`country_${email}`);
      localStorage.removeItem(`currency_${email}`);
      localStorage.removeItem("token");
      localStorage.removeItem("currentEmail");
      navigate("/register");
    } else {
      const err = await res.json();
      setMessage("Löschen fehlgeschlagen: " + (err.detail || res.status));
    }
  };

  /* ── Helper: Settings auf neuen Key verschieben ───────── */
  const transferSettings = (oldMail, newMail) => {
    const ctry = localStorage.getItem(`country_${oldMail}`);
    const ccy  = localStorage.getItem(`currency_${oldMail}`);
    if (ctry) localStorage.setItem(`country_${newMail}`, ctry);
    if (ccy)  localStorage.setItem(`currency_${newMail}`, ccy);
    localStorage.removeItem(`country_${oldMail}`);
    localStorage.removeItem(`currency_${oldMail}`);
  };

  /* ── JSX ──────────────────────────────────────────────── */
  return (
    <div className="max-w-md mx-auto p-4 bg-white shadow rounded mt-8">
      <h2 className="text-2xl font-bold text-center mb-4">Nutzereinstellungen</h2>

      {message && <p className="text-center text-green-600 mb-4">{message}</p>}

      {/* Profil */}
      <form onSubmit={handleProfileUpdate} className="space-y-4">
        <div>
          <label className="block font-medium">E‑Mail</label>
          <input
            type="email"
            className="w-full border p-2 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-medium">Neues Passwort</label>
          <input
            type="password"
            className="w-full border p-2 rounded"
            placeholder="Leer lassen, wenn nicht ändern"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
          Profil aktualisieren
        </button>
      </form>

      {/* Einstellungen */}
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
          className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700"
        >
          Einstellungen speichern
        </button>
      </div>

      {/* Account löschen */}
      <div className="mt-8">
        <button
          onClick={handleDeleteAccount}
          className="w-full bg-red-600 text-white p-2 rounded hover:bg-red-700"
        >
          Account löschen
        </button>
      </div>
    </div>
  );
};

export default Profile;
