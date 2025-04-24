import { API_BASE } from "../config";
import React, { useState, useEffect } from "react";
import {
  useNavigate,
  useLocation,
  useParams,
} from "react-router-dom";
import { computeNet } from "../utils/taxUtils";

const API = `${API_BASE}/contracts/`;

export default function ContractForm() {
  /* ── Mode ─────────────────────────────────────────── */
  const { id }    = useParams();                 // undefined bei /new
  const isEdit    = Boolean(id);
  const { state } = useLocation();
  const navigate  = useNavigate();

  /* ── Form State ───────────────────────────────────── */
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
    files: null,            // FileList | null
  });

  const [country,  setCountry]  = useState("");
  const [currency, setCurrency] = useState("€");
  const [msg,      setMsg]      = useState("");

  /* ── Prefill & Settings ───────────────────────────── */
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
    setForm((f) => ({
      ...f,
      ...c,
      start_date: c.start_date ? c.start_date.slice(0, 10) : "",
      end_date:   c.end_date   ? c.end_date.slice(0, 10)   : "",
      netto:  c.contract_type === "Gehalt" ? c.amount : "",
      brutto: "",
    }));

  const fetchContract = async () => {
    const res = await fetch(`${API}${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (res.ok) prefill(await res.json());
    else setMsg("Error loading the contract.");
  };

  /* ── Live‑Netto‑Berechnung ───────────────────────── */
  useEffect(() => {
    if (
      form.contract_type === "Salary" &&
      form.brutto !== "" &&
      country.trim()
    ) {
      const net = computeNet(Number(form.brutto), country);
      setForm((f) => ({ ...f, netto: net.toFixed(2) }));
    }
  }, [form.brutto, country, form.contract_type]);

  /* ── Helpers ─────────────────────────────────────── */
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const iso      = (d) => (d ? d + "T00:00:00" : null);
  const token    = localStorage.getItem("token");

  const buildPayload = () => {
    if (!form.name || !form.contract_type || !form.start_date) {
      setMsg("Please fill out all required fields.");
      return null;
    }
    if (!country.trim()) {
      setMsg("Please select a country first.");
      return null;
    }
    if (
      form.contract_type !== "Gehalt" &&
      (form.amount === "" || Number(form.amount) <= 0)
    ) {
      setMsg("Please enter an amount.");
      return null;
    }

    const amount =
      form.contract_type === "Salary"
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

  /* ── Submit ──────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = buildPayload();
    if (!payload) return;

    const method = isEdit ? "PATCH" : "POST";
    const url    = isEdit ? `${API}${id}` : API;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        setMsg("Fehler: " + JSON.stringify(err.detail ?? err));
        return;
      }

      /* ─── ID für Upload ermitteln ─── */
      const data = await res.json();
      const newId = data.id;            // bei POST
      const contractId = newId || id;

      /* ─── (A) Bilder hochladen ─────── */
      if (form.files && form.files.length > 0) {
        const fd = new FormData();
        Array.from(form.files).forEach((file) => fd.append("files", file));
        await fetch(`${API}${contractId}/files`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
      }

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setMsg("Network error");
    }
  };

  /* ── JSX ─────────────────────────────────────────── */
  return (
    <div className="max-w-xl mx-auto p-4 bg-white shadow rounded mt-8">
      <h2 className="text-2xl font-bold mb-4">
        {isEdit ? "Edit contract" : "Create new contract"}
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
          <label className="block font-medium">Contract type</label>
          <select
            className="w-full border p-2 rounded"
            required
            value={form.contract_type}
            onChange={(e) => setField("contract_type", e.target.value)}
          >
            <option value="">Please select</option>
            <option>Rent</option>
            <option>Insurance</option>
            <option>Streaming</option>
            <option>Salary</option>
            <option>Leasing</option>
            <option>Other</option>
          </select>
        </div>

        {/* Gehalt-spezifisch */}
        {form.contract_type === "Salary" && (
          <>
            <div>
              <label className="block font-medium">Gross salary</label>
              <input
                type="number"
                className="w-full border p-2 rounded"
                value={form.brutto}
                onChange={(e) => setField("brutto", e.target.value)}
              />
            </div>
            <div>
              <label className="block font-medium">
                Net salary (calculated – editable)
              </label>
              <input
                type="number"
                className="w-full border p-2 rounded"
                value={form.netto}
                onChange={(e) => setField("net", e.target.value)}
              />
            </div>
          </>
        )}

        {/* Betrag für nicht‑Gehalt */}
        {form.contract_type &&
          form.contract_type !== "Salary" && (
            <div>
              <label className="block font-medium">
                Amount({currency})
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
          <label className="block font-medium">Start date</label>
          <input
            type="date"
            className="w-full border p-2 rounded"
            required
            value={form.start_date}
            onChange={(e) => setField("start_date", e.target.value)}
          />
        </div>

        <div>
          <label className="block font-medium">End date</label>
          <input
            type="date"
            className="w-full border p-2 rounded"
            value={form.end_date || ""}
            onChange={(e) => setField("end_date", e.target.value)}
          />
        </div>

        <div>
          <label className="block font-medium">Payment interval</label>
          <select
            className="w-full border p-2 rounded"
            required
            value={form.payment_interval}
            onChange={(e) => setField("payment_interval", e.target.value)}
          >
          <option value="">Please select</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
          <option value="one-time">One-time</option>
          </select>
        </div>

        <div>
          <label className="block font-medium">Notes</label>
          <textarea
            className="w-full border p-2 rounded"
            value={form.notes}
            onChange={(e) => setField("notes", e.target.value)}
          />
        </div>

        {/* ─── Anhänge (Bilder & PDFs) ───────────────────────── */}
        <div>
          <label className="block font-medium">
            Anhänge (Bild / PDF – mehrere möglich)
          </label>

          <input
            type="file"
            accept="image/*,application/pdf"
            multiple
            onChange={(e) => setField("files", e.target.files)}
            className="mt-1"
          />

          {/* kleine Vorschau / Auflistung */}
          {form.files && (
            <ul className="mt-1 text-sm text-gray-600 list-disc list-inside">
              {Array.from(form.files).map((f) => (
                <li key={f.name}>
                  {f.name} – {(f.size / 1024).toFixed(1)} kB
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Land & Währung */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium">Land</label>
            <input
              className="w-full border p-2 rounded bg-gray-100"
              readOnly
              value={country}
              placeholder="Not set"
            />
            {!country && (
              <p
                className="text-red-600 text-sm cursor-pointer"
                onClick={() => navigate("/profile")}
              >
                ⚠ Please select a country (open settings)
              </p>
            )}
          </div>
          <div>
            <label className="block font-medium">Currency</label>
            <input
              className="w-full border p-2 rounded bg-gray-100"
              readOnly
              value={currency}
            />
          </div>
        </div>

        <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
          {isEdit ? "Save" : "Create"}
        </button>
      </form>
    </div>
  );
}
