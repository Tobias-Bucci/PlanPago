import React, { useState } from 'react';

const ContractForm = () => {
  // Allgemeine Felder
  const [name, setName] = useState('');
  const [contractType, setContractType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentInterval, setPaymentInterval] = useState('');
  const [notes, setNotes] = useState('');
  // Speziell für Gehalt
  const [brutto, setBrutto] = useState('');
  const [netto, setNetto] = useState('');
  // Für andere Vertragsarten
  const [amount, setAmount] = useState('');
  // Für Status; beim Erstellen setzen wir ihn standardmäßig auf "active"
  const status = "active";
  // Message, um den Status der Aktion anzuzeigen
  const [message, setMessage] = useState('');

  // Wenn bei "Gehalt" der Bruttobetrag eingegeben wird, berechne den Nettobetrag.
  const handleBruttoChange = (e) => {
    const value = e.target.value;
    setBrutto(value);
    const num = parseFloat(value);
    if (!isNaN(num)) {
      // Beispielrechnung: 30 % Abzug vom Brutto
      setNetto((num * 0.7).toFixed(2));
    } else {
      setNetto('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Erstelle die Daten, die an den Backend-Endpunkt gesendet werden
    const contractData = {
      name: name,
      contract_type: contractType,
      start_date: startDate,
      end_date: endDate || null,
      // Wenn es ein Gehaltsvertrag ist, verwenden wir den Nettobetrag
      amount: contractType === "Gehalt" ? parseFloat(netto) : parseFloat(amount),
      payment_interval: paymentInterval,
      status: status,
      // Bei Gehalt fügen wir zusätzlich die Bruttoangabe als Hinweis hinzu
      notes: contractType === "Gehalt" ? `Brutto: ${brutto}` : notes,
    };

    try {
      const response = await fetch("http://192.168.1.150:8001/contracts/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(contractData)
      });

      if (response.ok) {
        setMessage("Vertrag erfolgreich hinzugefügt!");
        // Formular zurücksetzen
        setName('');
        setContractType('');
        setStartDate('');
        setEndDate('');
        setPaymentInterval('');
        setNotes('');
        setBrutto('');
        setNetto('');
        setAmount('');
      } else {
        const errorData = await response.json();
        setMessage("Fehler beim Hinzufügen des Vertrags: " + (errorData.detail || ""));
      }
    } catch (error) {
      console.error("Error creating contract:", error);
      setMessage("Ein Fehler ist aufgetreten.");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 bg-white shadow rounded mt-8">
      <h2 className="text-2xl font-bold mb-4">Vertragsformular</h2>
      {message && <p className="mb-4 text-center text-green-600">{message}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Vertragsname */}
        <div>
          <label className="block font-medium">Vertragsname</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        {/* Vertragsart */}
        <div>
          <label className="block font-medium">Vertragsart</label>
          <select
            value={contractType}
            onChange={(e) => setContractType(e.target.value)}
            className="w-full border p-2 rounded"
            required
          >
            <option value="">Bitte wählen</option>
            <option value="Miete">Miete</option>
            <option value="Versicherung">Versicherung</option>
            <option value="Streaming">Streaming</option>
            <option value="Gehalt">Gehalt</option>
            <option value="Leasing">Leasing</option>
            <option value="Sonstiges">Sonstiges</option>
          </select>
        </div>
        {/* Dynamische Felder: Wenn Vertragsart "Gehalt" */}
        {contractType === "Gehalt" && (
          <>
            <div>
              <label className="block font-medium">Bruttogehalt</label>
              <input
                type="number"
                value={brutto}
                onChange={handleBruttoChange}
                className="w-full border p-2 rounded"
                required
              />
            </div>
            <div>
              <label className="block font-medium">Nettogehalt (automatisch berechnet)</label>
              <input
                type="text"
                value={netto}
                readOnly
                className="w-full border p-2 rounded bg-gray-100"
              />
            </div>
          </>
        )}
        {/* Wenn Vertragsart nicht "Gehalt" */}
        {contractType && contractType !== "Gehalt" && (
          <div>
            <label className="block font-medium">Betrag</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
          </div>
        )}
        {/* Startdatum */}
        <div>
          <label className="block font-medium">Startdatum</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        {/* Enddatum */}
        <div>
          <label className="block font-medium">Enddatum (optional)</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>
        {/* Zahlungsintervall */}
        <div>
          <label className="block font-medium">Zahlungsintervall</label>
          <select
            value={paymentInterval}
            onChange={(e) => setPaymentInterval(e.target.value)}
            className="w-full border p-2 rounded"
            required
          >
            <option value="">Bitte wählen</option>
            <option value="monatlich">Monatlich</option>
            <option value="jährlich">Jährlich</option>
            <option value="einmalig">Einmalig</option>
          </select>
        </div>
        {/* Notizen */}
        <div>
          <label className="block font-medium">Notizen</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border p-2 rounded"
          ></textarea>
        </div>
        {/*
          Optional: Vertragsdatei-Upload
          Wenn du Datei-Upload unterstützen möchtest, muss das Backend angepasst werden, da JSON nicht für Dateien geeignet ist.
          <div>
            <label className="block font-medium">Vertragsdatei (PDF, JPEG, PNG)</label>
            <input
              type="file"
              className="w-full"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </div>
        */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          Vertrag erstellen
        </button>
      </form>
    </div>
  );
};

export default ContractForm;
