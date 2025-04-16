import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [userData, setUserData] = useState({});
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Profil laden
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("http://192.168.1.150:8001/users/me", {
          headers: { "Authorization": `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
          setNewEmail(data.email);
        } else {
          navigate("/login");
        }
      } catch (err) {
        console.error(err);
        navigate("/login");
      }
    };
    fetchProfile();
  }, [token, navigate]);

  // Profil aktualisieren (Passwort/E-Mail ändern)
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const updateData = {};
      if (newEmail && newEmail !== userData.email) {
        updateData.email = newEmail;
      }
      if (newPassword) {
        updateData.password = newPassword;
      }
      const response = await fetch("http://192.168.1.150:8001/users/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });
      if (response.ok) {
        const updated = await response.json();
        setUserData(updated);
        setMessage("Profil aktualisiert!");
        setNewPassword(""); // Passwort-Feld leeren
      } else {
        const err = await response.json();
        setMessage("Update-Fehler: " + (err.detail || ""));
      }
    } catch (err) {
      console.error(err);
      setMessage("Update fehlgeschlagen.");
    }
  };

  // Profil löschen
  const handleDelete = async () => {
    if (window.confirm("Bist du sicher, dass du dein Profil löschen möchtest?")) {
      try {
        const response = await fetch("http://192.168.1.150:8001/users/me", {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` },
        });
        if (response.ok) {
          localStorage.removeItem("token");
          navigate("/register");
        } else {
          const err = await response.json();
          setMessage("Löschen fehlgeschlagen: " + (err.detail || ""));
        }
      } catch (err) {
        console.error(err);
        setMessage("Löschen fehlgeschlagen.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Mein Profil</h2>
        {message && <p className="text-center text-green-600 mb-4">{message}</p>}
        <div className="mb-4">
          <label className="block mb-1 font-medium">E-Mail</label>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Neues Passwort</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Feld leer lassen, wenn nicht ändern"
            className="w-full border p-2 rounded"
          />
        </div>
        <button
          onClick={handleUpdate}
          className="w-full bg-blue-600 text-white p-2 rounded mb-4 hover:bg-blue-700"
        >
          Profil aktualisieren
        </button>
        <button
          onClick={handleDelete}
          className="w-full bg-red-600 text-white p-2 rounded hover:bg-red-700"
        >
          Profil löschen
        </button>
      </div>
    </div>
  );
};

export default Profile;
