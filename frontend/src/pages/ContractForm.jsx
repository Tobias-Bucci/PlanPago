import { API_BASE } from "../config";
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { computeNet } from "../utils/taxUtils";

const API = `${API_BASE}/contracts/`;
const TYPE_OPTIONS = [
  ["Rent",        "Miete"],
  ["Insurance",   "Versicherung"],
  ["Streaming",   "Streaming"],
  ["Salary",      "Gehalt"],
  ["Leasing",     "Leasing"],
  ["Other",       "Sonstiges"],
];
/* Back-end keywords */
const INTERVAL_OPTIONS = [
  ["Monthly",  "monthly"],
  ["Yearly",   "yearly"],
  ["One-time", "one-time"],
];

export default function ContractForm() {
  /* ───── routing info ─────────────────────────────── */
  const { id }     = useParams();
  const isEdit     = Boolean(id);
  const { state }  = useLocation();
  const navigate   = useNavigate();

  /* ───── component state ──────────────────────────── */
  const [form, setForm] = useState({
    name: "", contract_type: "", start_date: "", end_date: "",
    payment_interval: "", notes: "", amount: "", brutto: "", netto: "",
    files: null,
  });
  const [country,  setCountry] = useState("");
  const [currency, setCur]     = useState("€");
  const [msg,      setMsg]     = useState("");
  const [busy,     setBusy]    = useState(false);      // <── NEW: blocks double click

  /* ───── preload user context & contract ──────────── */
  useEffect(() => {
    const mail = localStorage.getItem("currentEmail");
    setCur(localStorage.getItem(`currency_${mail}`)  || "€");
    setCountry(localStorage.getItem(`country_${mail}`) || "");

    if (isEdit) {
      if (state?.contract) prefill(state.contract);
      else                 fetchContract();
    }
    // eslint-disable-next-line
  }, []);

  const prefill = (c) =>
    setForm(f => ({
      ...f, ...c,
      start_date: c.start_date?.slice(0, 10) || "",
      end_date:   c.end_date?.slice(0, 10)   || "",
      netto: c.contract_type === "Gehalt" ? c.amount : "",
      brutto: "",
    }));

  const fetchContract = async () => {
    const r = await fetch(`${API}${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (r.ok) prefill(await r.json());
    else      setMsg("Error loading contract.");
  };

  /* ───── live net-salary calculation ─────────────── */
  useEffect(() => {
    if (form.contract_type === "Gehalt" && form.brutto && country) {
      const net = computeNet(Number(form.brutto), country);
      setForm(f => ({ ...f, netto: net.toFixed(2) }));
    }
  }, [form.brutto, country, form.contract_type]);

  /* ───── helpers ─────────────────────────────────── */
  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const iso      = d => (d ? `${d}T00:00:00` : null);
  const token    = localStorage.getItem("token");

  const buildPayload = () => {
    if (!form.name || !form.contract_type || !form.start_date)
      return setMsg("Please fill out all required fields."), null;
    if (!country)
      return setMsg("Please select a country first."), null;
    if (
      form.contract_type !== "Gehalt" &&
      (!form.amount || Number(form.amount) <= 0)
    )
      return setMsg("Please enter an amount."), null;

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

  /* ───── submit handler with lock ─────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;              // already running
    const payload = buildPayload();
    if (!payload) return;

    setBusy(true);
    setMsg("");

    try {
      const method = isEdit ? "PATCH" : "POST";
      const url    = isEdit ? `${API}${id}` : API;

      const r = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!r.ok) {
        const text = await r.text();
        try {
          const j = JSON.parse(text);
          setMsg("Error: " + (j.detail || text));
        } catch {
          setMsg("Error: " + text);
        }
        setBusy(false);
        return;
      }

      const data = await r.json();
      const cid  = data.id || id;

      /* optional file upload */
      if (form.files?.length) {
        const fd = new FormData();
        Array.from(form.files).forEach((f) => fd.append("files", f));
        await fetch(`${API}${cid}/files`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
      }
      navigate("/dashboard");
    } catch {
      setMsg("Network error – please try again.");
      setBusy(false);
    }
  };

  /* ───── UI ───────────────────────────────────────── */
  return (
    <div className="max-w-2xl mx-auto pt-24 p-4">
      <div className="glass-card p-6 animate-pop">
        <h2 className="text-2xl font-bold mb-4 text-white">
          {isEdit ? "Edit contract" : "Create new contract"}
        </h2>

        {msg && <p className="mb-4 text-red-300">{msg}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="frosted-input"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            required
            disabled={busy}
          />

          <select
            className="frosted-input"
            value={form.contract_type}
            onChange={(e) => setField("contract_type", e.target.value)}
            required
            disabled={busy}
          >
            <option value="">Contract type</option>
            {TYPE_OPTIONS.map(([l, v]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>

          {form.contract_type === "Gehalt" && (
            <>
              <input
                className="frosted-input"
                type="number"
                placeholder="Gross salary"
                value={form.brutto}
                onChange={(e) => setField("brutto", e.target.value)}
                disabled={busy}
              />
              <input
                className="frosted-input"
                type="number"
                placeholder="Net salary"
                value={form.netto}
                onChange={(e) => setField("netto", e.target.value)}
                disabled={busy}
              />
            </>
          )}

          {form.contract_type && form.contract_type !== "Gehalt" && (
            <input
              className="frosted-input"
              type="number"
              placeholder={`Amount (${currency})`}
              value={form.amount}
              onChange={(e) => setField("amount", e.target.value)}
              required
              disabled={busy}
            />
          )}

          <input
            className="frosted-input"
            type="date"
            value={form.start_date}
            onChange={(e) => setField("start_date", e.target.value)}
            required
            disabled={busy}
          />
          <input
            className="frosted-input"
            type="date"
            value={form.end_date || ""}
            onChange={(e) => setField("end_date", e.target.value)}
            disabled={busy}
          />

          <select
            className="frosted-input"
            value={form.payment_interval}
            onChange={(e) => setField("payment_interval", e.target.value)}
            required
            disabled={busy}
          >
            <option value="">Payment interval</option>
            {INTERVAL_OPTIONS.map(([l, v]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>

          <textarea
            className="frosted-input"
            rows={3}
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setField("notes", e.target.value)}
            disabled={busy}
          />

          {/* File input */}
          <div>
            <label className="block mb-1 text-white/80">Attachments</label>
            <input
              type="file"
              multiple
              accept="image/*,application/pdf"
              onChange={(e) => setField("files", e.target.files)}
              className="frosted-file"
              disabled={busy}
            />
          </div>

          {/* Country & Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <input
                className="frosted-input bg-white/5"
                readOnly
                value={country}
                placeholder="Country"
              />
              {!country && (
                <p
                  onClick={() => !busy && navigate("/profile")}
                  className="mt-1 text-sm text-red-300 cursor-pointer hover:underline"
                >
                  ⚠ Please select a country in settings
                </p>
              )}
            </div>
            <input
              className="frosted-input bg-white/5"
              readOnly
              value={currency}
            />
          </div>

          <button
            className="btn-primary w-full"
            disabled={busy}
          >
            {busy ? "Please wait…" : isEdit ? "Save" : "Create"}
          </button>
        </form>
      </div>
    </div>
  );
}
