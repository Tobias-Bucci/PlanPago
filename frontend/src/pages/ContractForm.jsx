// src/pages/ContractForm.jsx
import React, { useState, useEffect } from "react";
import { computeNet } from "../utils/taxUtils";

const ContractForm = () => {
  const [name, setName] = useState("");
  const [contractType, setContractType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentInterval, setPaymentInterval] = useState("");
  const [notes, setNotes] = useState("");
  const [amount, setAmount] = useState("");
  const [brutto, setBrutto] = useState("");
  const [netto, setNetto] = useState("");
  const [message, setMessage] = useState("");
  const [currency, setCurrency] = useState("€");
  const [country, setCountry] = useState("");
  const [warning, setWarning] = useState("");

  // Lade Einstellungen aus localStorage (diese dürfen im Vertrag nicht verändert werden)
  useEffect(() => {
    const storedCurrency = localStorage.getItem("currency");
    if (storedCurrency) setCurrency(storedCurrency);
    const storedCountry = localStorage.getItem("country");
    if (storedCountry) {
      setCountry(storedCountry);
      setWarning("");
    } else {
      setWarning("Hinweis: Bitte tragen Sie in Ihren Einstellungen Ihr Land ein, damit das Nettogehalt korrekt berechnet wird.");
    }
  }, []);

  // Bei Gehaltsverträgen: Berechne automatisch den Nettobetrag basierend auf Brutto und länderspezifischen Steuersätzen
  const handleBruttoChange = (e) => {
    const value = e.target.value;
    setBrutto(value);
    const num = parseFloat(value);
    if (!isNaN(num)) {
      const net = computeNet(num, country);
      setNetto(net.toFixed(2));
    } else {
      setNetto("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Wenn kein Land definiert ist, weisen wir den Nutzer freundlich hin und verhindern das Absenden
    if (!country) {
      setMessage("Bitte tragen Sie in den Einstellungen Ihr Land ein, bevor Sie einen Vertrag erstellen.");
      return;
    }

    let netValue;
    if (contractType === "Gehalt") {
      netValue = netto !== "" ? parseFloat(netto) : parseFloat(brutto);
    } else {
      netValue = parseFloat(amount);
    }

    const contractData = {
      name: name,
      contract_type: contractType,
      start_date: startDate,
      end_date: endDate || null,
      amount: netValue,
      payment_interval: paymentInterval,
      status: "active",
      notes:
        contractType === "Gehalt"
          ? `Brutto: ${brutto} ${currency}, Land: ${country}`
          : notes,
    };

    try {
      const response = await fetch("http://192.168.1.150:8001/contracts/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contractData),
      });
      if (response.ok) {
        setMessage("Vertrag erfolgreich hinzugefügt!");
        // Felder zurücksetzen
        setName("");
        setContractType("");
        setStartDate("");
        setEndDate("");
        setPaymentInterval("");
        setNotes("");
        setBrutto("");
        setNetto("");
        setAmount("");
      } else {
        const errorData = await response.json();
        setMessage("Fehler: " + (errorData.detail || ""));
      }
    } catch (error) {
      console.error("Error creating contract:", error);
      setMessage("Ein Fehler ist aufgetreten.");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 bg-white shadow rounded mt-8">
      <h2 className="text-2xl font-bold mb-4">Vertragsformular</h2>
      {warning && <p className="mb-4 text-center text-red-500">{warning}</p>}
      {message && <p className="mb-4 text-center text-green-600">{message}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
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
        {contractType === "Gehalt" ? (
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
              <label className="block font-medium">Nettogehalt (optional manuell)</label>
              <input
                type="number"
                value={netto}
                onChange={(e) => setNetto(e.target.value)}
                placeholder="Falls manuell eingeben"
                className="w-full border p-2 rounded"
              />
            </div>
            <div>
              <label className="block font-medium">Land</label>
              <input
                type="text"
                value={country}
                readOnly
                className="w-full border p-2 rounded bg-gray-100"
              />
            </div>
            <div>
              <label className="block font-medium">Währung</label>
              <input
                type="text"
                value={currency}
                readOnly
                className="w-full border p-2 rounded bg-gray-100"
              />
            </div>
          </>
        ) : (
          contractType && contractType !== "Gehalt" && (
            <div>
              <label className="block font-medium">Betrag</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 border border-r-0 rounded-l bg-gray-100">
                  {currency}
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border p-2 rounded-r"
                  required
                />
              </div>
            </div>
          )
        )}
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
        <div>
          <label className="block font-medium">Enddatum (optional)</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>
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
        <div>
          <label className="block font-medium">Notizen</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border p-2 rounded"
          ></textarea>
        </div>
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
