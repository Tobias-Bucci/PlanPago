/*  ContractForm.jsx
    – Neu anlegen  (/contracts/new)  oder  Bearbeiten  (/contracts/:id/edit)
    – Netto wird live berechnet, bleibt aber editierbar
*/

import React, { useState, useEffect } from "react";
import {
  useNavigate,
  useLocation,
  useParams,
} from "react-router-dom";
import { computeNet } from "../utils/taxUtils";

const API = "http://192.168.1.150:8001/contracts/";

export default function ContractForm() {
  /* ─── Modus erkennen ─────────────────────────────────── */
  const { id }    = useParams();
  const isEdit    = Boolean(id);
  const { state } = useLocation();
  const navigate  = useNavigate();

  /* ─── Form‑State ─────────────────────────────────────── */
  const [form, setForm] = useState({
    name: "",
    contract_type: "",
    start_date: "",
    end_date: "",
    payment_interval: "",
    notes: "",
    amount: "",
    brutto: "",
    netto: "",
  });

  const [country,  setCountry]  = useState("");
  const [currency, setCurrency] = useState("€");
  const [msg,      setMsg]      = useState("");

  /* ─── Prefill & Settings ─────────────────────────────── */
  useEffect(() => {
    const mail = localStorage.getItem("currentEmail");
    setCurrency(localStorage.getItem(`currency_${mail}`) || "€");
    setCountry(localStorage.getItem(`country_${mail}`)   || "");

    if (isEdit) {
      if (state?.contract) prefill(state.contract);
      else fetchContract();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prefill = (c) =>
    setForm({
      ...form,
      ...c,
      netto: c.contract_type === "Gehalt" ? c.amount : "",
      brutto: "",
    });

  const fetchContract = async () => {
    const res = await fetch(`${API}${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (res.ok) prefill(await res.json());
    else setMsg("Fehler beim Laden des Vertrags.");
  };

  /* ─── Netto live berechnen, wenn Brutto ändert ───────── */
  useEffect(() => {
    if (
      form.contract_type === "Gehalt" &&
      form.brutto !== "" &&
      country.trim()
    ) {
      const net = computeNet(Number(form.brutto), country);
      setForm((f) => ({ ...f, netto: net.toFixed(2) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.brutto, country, form.contract_type]);

  /* ─── Helper ─────────────────────────────────────────── */
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const iso = (d) => (d ? d + "T00:00:00" : null);

  const buildPayload = () => {
    if (!form.name || !form.contract_type || !form.start_date) {
      setMsg("Bitte alle Pflichtfelder ausfüllen.");
      return null;
    }
    if (!country.trim()) {
      setMsg("Bitte zuerst ein Land auswählen.");
      return null;
    }
    if (
      form.contract_type !== "Gehalt" &&
      (form.amount === "" || Number(form.amount) <= 0)
    ) {
      setMsg("Bitte einen Betrag eingeben.");
      return null;
    }

    const amount =
      form.contract_type === "Gehalt"
        ? Number(form.netto || 0)
        : Number(form.amount);

    return {
      name: form.name,
      contract_type: form.contract_type,
      start_date: iso(form.start_date),
      end_date: iso(form.end_date),
      amount,
      payment_interval: form.payment_interval,
      status: "active",
      notes: form.notes,
    };
  };

  /* ─── Submit ─────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = buildPayload();
    if (!payload) return;

    const method = isEdit ? "PATCH" : "POST";
    const url    = isEdit ? `${API}${id}` : API;

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) navigate("/dashboard");
    else {
      const err = await res.json();
      setMsg("Fehler: " + JSON.stringify(err.detail ?? err));
    }
  };

  /* ─── JSX ───────────────────────────────────────────── */
  return (
    <div className="max-w-xl mx-auto p-4 bg-white shadow rounded mt-8">
      <h2 className="text-2xl font-bold mb-4">
        {isEdit ? "Vertrag bearbeiten" : "Neuen Vertrag anlegen"}
      </h2>

      {msg && <p className="mb-4 text-red-600 text-center">{msg}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block font-medium">Name</label>
          <input
            className="w-full border p-2 rounded"
            required
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
          />
        </div>

        {/* Vertragsart */}
        <div>
          <label className="block font-medium">Vertragsart</label>
          <select
            className="w-full border p-2 rounded"
            required
            value={form.contract_type}
            onChange={(e) => setField("contract_type", e.target.value)}
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

        {/* Gehalt-spezifisch */}
        {form.contract_type === "Gehalt" && (
          <>
            <div>
              <label className="block font-medium">Bruttogehalt</label>
              <input
                type="number"
                className="w-full border p-2 rounded"
                value={form.brutto}
                onChange={(e) => setField("brutto", e.target.value)}
              />
            </div>
            <div>
              <label className="block font-medium">
                Nettogehalt (berechnet – editierbar)
              </label>
              <input
                type="number"
                className="w-full border p-2 rounded"
                value={form.netto}
                onChange={(e) => setField("netto", e.target.value)}
              />
            </div>
          </>
        )}

        {/* Betrag für nicht‑Gehalt */}
        {form.contract_type &&
          form.contract_type !== "Gehalt" && (
            <div>
              <label className="block font-medium">
                Betrag ({currency})
              </label>
              <input
                type="number"
                className="w-full border p-2 rounded"
                required
                value={form.amount}
                onChange={(e) => setField("amount", e.target.value)}
              />
            </div>
          )}

        {/* Datum & Intervall */}
        <div>
          <label className="block font-medium">Startdatum</label>
          <input
            type="date"
            className="w-full border p-2 rounded"
            required
            value={form.start_date}
            onChange={(e) => setField("start_date", e.target.value)}
          />
        </div>

        <div>
          <label className="block font-medium">Enddatum</label>
          <input
            type="date"
            className="w-full border p-2 rounded"
            value={form.end_date || ""}
            onChange={(e) => setField("end_date", e.target.value)}
          />
        </div>

        <div>
          <label className="block font-medium">Zahlungsintervall</label>
          <select
            className="w-full border p-2 rounded"
            required
            value={form.payment_interval}
            onChange={(e) => setField("payment_interval", e.target.value)}
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
            value={form.notes}
            onChange={(e) => setField("notes", e.target.value)}
          />
        </div>

        {/* Land & Währung */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium">Land</label>
            <input
              className="w-full border p-2 rounded bg-gray-100"
              readOnly
              value={country}
              placeholder="Nicht gesetzt"
            />
            {!country && (
              <p
                className="text-red-600 text-sm cursor-pointer"
                onClick={() => navigate("/profile")}
              >
                ⚠ Bitte ein Land wählen (Profil öffnen)
              </p>
            )}
          </div>
          <div>
            <label className="block font-medium">Währung</label>
            <input
              className="w-full border p-2 rounded bg-gray-100"
              readOnly
              value={currency}
            />
          </div>
        </div>

        <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
          {isEdit ? "Speichern" : "Erstellen"}
        </button>
      </form>
    </div>
  );
}
