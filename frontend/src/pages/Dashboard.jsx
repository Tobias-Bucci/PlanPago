// src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";

const Dashboard = () => {
  const [contracts, setContracts] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [currency, setCurrency] = useState("€");
  const token = localStorage.getItem("token"); // Token holen

  const fetchContracts = async () => {
    try {
      const response = await fetch("http://192.168.1.150:8001/contracts/", {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`  // Token im Header
        }
      });
      if (response.ok) {
        const data = await response.json();
        setContracts(data);
      } else if (response.status === 401) {
        setError("Nicht autorisiert. Bitte neu einloggen.");
      } else {
        setError("Fehler beim Laden der Verträge");
      }
    } catch (err) {
      console.error("Fehler beim Abrufen:", err);
      setError("Ein Fehler ist aufgetreten");
    }
  };

  useEffect(() => {
    // Währung aus Einstellungen
    const userCurrency = localStorage.getItem("currency");
    if (userCurrency) setCurrency(userCurrency);
    // Verträge laden
    fetchContracts();
  }, []);

  const handleDelete = async (contractId) => {
    if (!window.confirm("Möchten Sie diesen Vertrag wirklich löschen?")) return;

    try {
      const response = await fetch(
        `http://192.168.1.150:8001/contracts/${contractId}`,
        {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );
      if (response.ok) {
        setMessage("Vertrag gelöscht!");
        fetchContracts();
      } else if (response.status === 401) {
        setError("Nicht autorisiert. Bitte neu einloggen.");
      } else {
        const err = await response.json();
        setMessage("Fehler beim Löschen: " + (err.detail || ""));
      }
    } catch (err) {
      console.error(err);
      setMessage("Ein Fehler ist aufgetreten.");
    }
  };

  const today = new Date();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Vertragsübersicht</h1>
      {message && <p className="mb-4 text-green-600">{message}</p>}
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {contracts.length === 0 ? (
        <p>Keine Verträge gefunden.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border">Name</th>
                <th className="py-2 px-4 border">Vertragsart</th>
                <th className="py-2 px-4 border">Startdatum</th>
                <th className="py-2 px-4 border">Enddatum</th>
                <th className="py-2 px-4 border">Betrag</th>
                <th className="py-2 px-4 border">Zahlungsintervall</th>
                <th className="py-2 px-4 border">Status</th>
                <th className="py-2 px-4 border">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract) => {
                const endDate = contract.end_date ? new Date(contract.end_date) : null;
                const isInactive = endDate && endDate < today;
                return (
                  <tr key={contract.id} className={isInactive ? "bg-gray-200" : ""}>
                    <td className="py-2 px-4 border">{contract.name}</td>
                    <td className="py-2 px-4 border">{contract.contract_type}</td>
                    <td className="py-2 px-4 border">
                      {new Date(contract.start_date).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-4 border">
                      {endDate ? endDate.toLocaleDateString() : "-"}
                    </td>
                    <td className="py-2 px-4 border">
                      {contract.amount} {currency}
                    </td>
                    <td className="py-2 px-4 border">{contract.payment_interval}</td>
                    <td className="py-2 px-4 border">{isInactive ? "inactive" : contract.status}</td>
                    <td className="py-2 px-4 border text-center">
                      <button
                        onClick={() => handleDelete(contract.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Vertrag löschen"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="text-sm text-gray-600 mt-2">
            Hinweis: Abgelaufene Verträge werden automatisch als „inactive“ markiert.
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
