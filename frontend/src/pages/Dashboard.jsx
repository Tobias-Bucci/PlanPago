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
        setError(err.toString());
      }
    };
    fetchContracts();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      {error && <p className="text-red-500">{error}</p>}
      <ul>
        {contracts.map((contract) => (
          <li key={contract.id} className="border p-2 mb-2">
            <p className="font-bold">{contract.name}</p>
            <p>Typ: {contract.contract_type}</p>
            <p>Betrag: {contract.amount} | Status: {contract.status}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Dashboard;
