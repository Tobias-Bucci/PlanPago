import React, { useState, useEffect } from "react";
import { computeNet } from "../utils/taxUtils";

const ContractForm = () => {
  // ─── State ────────────────────────────────────────────────
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
  const token = localStorage.getItem("token");

  // ─── Einstellungen laden ─────────────────────────────────

  useEffect(() => {
    const mail = localStorage.getItem("currentEmail");
    if (!mail) return;
    setCountry(localStorage.getItem(`country_${mail}`) || "");
    setCurrency(localStorage.getItem(`currency_${mail}`) || "€");
  }, []);
  

  // ─── Bruttogehalt‑Änderung ────────────────────────────────
  const handleBrutto = (e) => {
    setBrutto(e.target.value);
    const b = parseFloat(e.target.value);
    if (!isNaN(b)) setNetto(computeNet(b, country).toFixed(2));
    else setNetto("");
  };

  // ─── Submit ───────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!country) {
      setMessage("Bitte Land in den Einstellungen eintragen.");
      return;
    }
    const netValue =
      contractType === "Gehalt"
        ? netto !== "" ? parseFloat(netto) : parseFloat(brutto)
        : parseFloat(amount);

    const body = {
      name,
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
      const res = await fetch("http://192.168.1.150:8001/contracts/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setMessage("Vertrag angelegt!");
        // Felder leeren
        setName(""); setContractType(""); setStartDate("");
        setEndDate(""); setPaymentInterval(""); setNotes("");
        setBrutto(""); setNetto(""); setAmount("");
      } else if (res.status === 401) {
        setMessage("Nicht autorisiert – bitte erneut anmelden.");
      } else {
        const err = await res.json();
        setMessage("Fehler: " + (err.detail || ""));
      }
    } catch (err) {
      console.error(err);
      setMessage("Netzwerk‑Fehler.");
    }
  };

  // ─── JSX ─────────────────────────────────────────────────
  return (
    <div className="max-w-xl mx-auto p-4 bg-white shadow rounded mt-8">
      <h2 className="text-2xl font-bold mb-4">Vertrag hinzufügen</h2>
      {warning && <p className="text-red-500 mb-4 text-center">{warning}</p>}
      {message && <p className="text-green-600 mb-4 text-center">{message}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block font-medium">Vertragsname</label>
          <input
            className="w-full border p-2 rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {/* Vertragsart */}
        <div>
          <label className="block font-medium">Vertragsart</label>
          <select
            className="w-full border p-2 rounded"
            value={contractType}
            onChange={(e) => setContractType(e.target.value)}
            required
          >
            <option value="">Bitte wählen</option>
            <option>Miete</option>
            <option>Versicherung</option>
            <option>Streaming</option>
            <option>Gehalt</option>
            <option>Leasing</option>
            <option>Sonstiges</option>
          </select>
        </div>

        {/* Gehalts‑Spezialfelder */}
        {contractType === "Gehalt" ? (
          <>
            <div>
              <label className="block font-medium">Bruttogehalt</label>
              <input
                type="number"
                className="w-full border p-2 rounded"
                value={brutto}
                onChange={handleBrutto}
                required
              />
            </div>
            <div>
              <label className="block font-medium">
                Nettogehalt (optional manuell)
              </label>
              <input
                type="number"
                className="w-full border p-2 rounded"
                value={netto}
                onChange={(e) => setNetto(e.target.value)}
              />
            </div>
            <div>
              <label className="block font-medium">Land</label>
              <input
                className="w-full border p-2 rounded bg-gray-100"
                value={country}
                readOnly
              />
            </div>
            <div>
              <label className="block font-medium">Währung</label>
              <input
                className="w-full border p-2 rounded bg-gray-100"
                value={currency}
                readOnly
              />
            </div>
          </>
        ) : (
          contractType && (
            <div>
              <label className="block font-medium">Betrag</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 border border-r-0 rounded-l bg-gray-100">
                  {currency}
                </span>
                <input
                  type="number"
                  className="w-full border p-2 rounded-r"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
            </div>
          )
        )}

        {/* Gemeinsame Felder */}
        <div>
          <label className="block font-medium">Startdatum</label>
          <input
            type="date"
            className="w-full border p-2 rounded"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-medium">Enddatum (optional)</label>
          <input
            type="date"
            className="w-full border p-2 rounded"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block font-medium">Zahlungsintervall</label>
          <select
            className="w-full border p-2 rounded"
            value={paymentInterval}
            onChange={(e) => setPaymentInterval(e.target.value)}
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
            className="w-full border p-2 rounded"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
          Vertrag erstellen
        </button>
      </form>
    </div>
  );
};

export default ContractForm;
