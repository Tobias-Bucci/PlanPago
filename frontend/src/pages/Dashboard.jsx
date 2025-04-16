// src/pages/Dashboard.js
import React, { useState, useEffect } from "react";

const Dashboard = () => {
  const [contracts, setContracts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const response = await fetch("http://192.168.1.150:8001/contracts/");
        if (response.ok) {
          const data = await response.json();
          setContracts(data);
        } else {
          setError("Fehler beim Laden der Verträge");
        }
      } catch (err) {
        console.error("Fehler beim Abrufen:", err);
        setError("Ein Fehler ist aufgetreten");
      }
    };
    fetchContracts();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Vertragsübersicht</h1>
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
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract) => (
                <tr key={contract.id}>
                  <td className="py-2 px-4 border">{contract.name}</td>
                  <td className="py-2 px-4 border">{contract.contract_type}</td>
                  <td className="py-2 px-4 border">
                    {new Date(contract.start_date).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-4 border">
                    {contract.end_date ? new Date(contract.end_date).toLocaleDateString() : "-"}
                  </td>
                  <td className="py-2 px-4 border">{contract.amount}</td>
                  <td className="py-2 px-4 border">{contract.payment_interval}</td>
                  <td className="py-2 px-4 border">{contract.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
