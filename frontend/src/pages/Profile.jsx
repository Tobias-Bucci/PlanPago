// src/pages/Profile.jsx
import { API_BASE } from "../config";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CountryAutoComplete from "../utils/CountryAutoComplete";

export default function Profile() {
  /* ─────────── State ─────────── */
  const [email, setEmail]                 = useState("");
  const [oldPw, setOldPw]                 = useState("");
  const [newPw, setNewPw]                 = useState("");
  const [country, setCountry]             = useState("");
  const [currency, setCurrency]           = useState("EUR");
  const [emailRem, setEmailRem]           = useState(true);
  const [msg, setMsg]                     = useState("");
  const [tmpToken, setTmpToken]           = useState("");
  const [code, setCode]                   = useState("");

  const navigate = useNavigate();
  const token    = localStorage.getItem("token");
  const API      = API_BASE;

  /* ───────── Load profile once ───────── */
  useEffect(() => {
    (async () => {
      const res = await fetch(`${API}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return navigate("/login");
      const me = await res.json();

      setEmail(me.email);
      setCountry(me.country ?? "");
      setCurrency(me.currency ?? "EUR");
      setEmailRem(me.email_reminders_enabled);

      localStorage.setItem("currentEmail", me.email);
    })();
  }, [API, navigate, token]);

  /* ───────── 2-step change of e-mail / password (unchanged) ───── */
  const handleRequest = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      const body = { old_password: oldPw };
      if (email)      body.email    = email;
      if (newPw)      body.password = newPw;

      const res  = await fetch(`${API}/users/me`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error requesting change");

      setTmpToken(data.temp_token);
      setMsg("Code sent – please confirm.");
    } catch (err) {
      setMsg("Error: " + err.message);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      const res = await fetch(`${API}/users/me/confirm`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ temp_token: tmpToken, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Code invalid");

      /* keep LS mapping */
      const old = localStorage.getItem("currentEmail");
      if (old !== data.email) {
        const oldCtry = localStorage.getItem(`country_${old}`);
        const oldCur  = localStorage.getItem(`currency_${old}`);
        if (oldCtry) localStorage.setItem(`country_${data.email}`, oldCtry);
        if (oldCur)  localStorage.setItem(`currency_${data.email}`, oldCur);
        localStorage.removeItem(`country_${old}`);
        localStorage.removeItem(`currency_${old}`);
      }
      localStorage.setItem("currentEmail", data.email);

      setEmail(data.email);
      setTmpToken("");
      setCode("");
      setOldPw("");
      setNewPw("");
      setMsg("Profile updated.");
    } catch (err) {
      setMsg("Error: " + err.message);
    }
  };

  /* ───────── Save personal settings ───────── */
  const saveSettings = async () => {
    setMsg("");
    try {
      const res = await fetch(`${API}/users/me/settings`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          country,
          currency,
          email_reminders_enabled: emailRem,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Error saving settings");

      /* sync LS */
      localStorage.setItem(`country_${email}`, country);
      localStorage.setItem(`currency_${email}`, currency);

      setMsg("Settings saved.");
    } catch (err) {
      setMsg("Error: " + err.message);
    }
  };

  /* ───────── Delete account ───────── */
  const deleteAccount = async () => {
    if (!window.confirm("Delete account permanently?")) return;
    await fetch(`${API}/users/me`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    localStorage.clear();
    navigate("/register");
  };

  /* ───────── UI ───────── */
  return (
    <main className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-semibold">Settings</h1>

      {msg && (
        <div className="p-4 bg-blue-50 text-blue-800 rounded-lg shadow">
          {msg}
        </div>
      )}

      {/* —— change e-mail / password —— */}
      {tmpToken ? (
        <form onSubmit={handleConfirm} className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-xl font-medium">Confirm code</h2>
          <input
            className="w-full border p-2 rounded"
            type="text"
            placeholder="6-digit e-mail code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          <button className="w-full bg-accent text-white py-2 rounded-lg">
            Confirm
          </button>
        </form>
      ) : (
        <form onSubmit={handleRequest} className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-xl font-medium">Change profile</h2>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            className="w-full border p-2 rounded"
            required
          />
          <input
            type="password"
            value={oldPw}
            onChange={(e) => setOldPw(e.target.value)}
            placeholder="Current password"
            className="w-full border p-2 rounded"
            required
          />
          <input
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            placeholder="New password (optional)"
            className="w-full border p-2 rounded"
          />
          <button className="w-full bg-primary text-white py-2 rounded-lg">
            Request change
          </button>
        </form>
      )}

      {/* —— country / currency / reminders —— */}
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
              className="w-full border p-2 rounded"
            >
              <option>EUR</option>
              <option>USD</option>
              <option>CHF</option>
              <option>GBP</option>
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={emailRem}
            onChange={(e) => setEmailRem(e.target.checked)}
            className="h-5 w-5 border rounded"
          />
          <span>Enable e-mail reminders</span>
        </label>

        <div className="flex justify-end">
          <button onClick={saveSettings} className="px-4 py-2 bg-primary text-white rounded-lg">
            Save
          </button>
        </div>
      </section>

      <button
        onClick={deleteAccount}
        className="w-full py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
      >
        Delete account
      </button>
    </main>
  );
}
