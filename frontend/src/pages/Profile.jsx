// src/pages/Profile.jsx
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

  useEffect(() => {
    // Profil vom Backend laden
    const fetchProfile = async () => {
      try {
        const response = await fetch("http://192.168.1.150:8001/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setEmail(data.email);
        } else {
          navigate("/login");
        }
      } catch (err) {
        console.error(err);
        navigate("/login");
      }
    };
    fetchProfile();

    // Gespeicherte Einstellungen laden
    const storedCountry = localStorage.getItem("country") || "";
    const storedCurrency = localStorage.getItem("currency") || "EUR";
    setCountry(storedCountry);
    setCurrency(storedCurrency);
  }, [token, navigate]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const updateData = { email };
    if (newPassword) updateData.password = newPassword;
    try {
      const response = await fetch("http://192.168.1.150:8001/users/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });
      if (response.ok) {
        setMessage("Profil aktualisiert!");
      } else {
        const errorData = await response.json();
        setMessage("Update-Fehler: " + (errorData.detail || ""));
      }
    } catch (err) {
      console.error(err);
      setMessage("Update fehlgeschlagen.");
    }
  };

  const handleSettingsSave = () => {
    localStorage.setItem("country", country);
    localStorage.setItem("currency", currency);
    setMessage("Einstellungen gespeichert!");
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Möchten Sie Ihren Account wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.")) {
      try {
        const response = await fetch("http://192.168.1.150:8001/users/me", {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          // Lösche alle lokalen Einstellungen
          localStorage.removeItem("token");
          localStorage.removeItem("country");
          localStorage.removeItem("currency");
          setMessage("Account wurde gelöscht.");
          navigate("/register");
        } else {
          const errorData = await response.json();
          setMessage("Löschen fehlgeschlagen: " + (errorData.detail || ""));
        }
      } catch (err) {
        console.error(err);
        setMessage("Beim Löschen des Accounts ist ein Fehler aufgetreten.");
      }
    }
  };  

  return (
    <div className="max-w-md mx-auto p-4 bg-white shadow rounded mt-8">
      <h2 className="text-2xl font-bold mb-4 text-center">Nutzereinstellungen</h2>
      {message && <p className="text-center text-green-600 mb-4">{message}</p>}
      <form onSubmit={handleProfileUpdate} className="space-y-4">
        <div>
          <label className="block font-medium">E-Mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            placeholder="Leer lassen, wenn nicht ändern"
            className="w-full border p-2 rounded"
          />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
          Profil aktualisieren
        </button>
      </form>
      <div className="mt-6">
        <h3 className="text-xl font-bold mb-2">Einstellungen</h3>
        <div className="mb-4">
          <label className="block font-medium">Land</label>
          <CountryAutoComplete
            value={country}
            onChange={(val) => setCountry(val)}
          />
        </div>
        <div className="mb-4">
          <label className="block font-medium">Währung</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="CHF">CHF</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
        <button onClick={handleSettingsSave} className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">
          Einstellungen speichern
        </button>
      </div>
      <div className="mt-6">
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
