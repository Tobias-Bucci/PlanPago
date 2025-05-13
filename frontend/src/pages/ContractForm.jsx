import { API_BASE } from "../config";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { computeNet } from "../utils/taxUtils";

const API = `${API_BASE}/contracts/`;
const TYPE_OPTIONS = [
  ["Rent",        "rent"],
  ["Insurance",   "insurance"],
  ["Streaming",   "streaming"],
  ["Salary",      "salary"],
  ["Leasing",     "leasing"],
  ["Other",       "other"],
];
const INTERVAL_OPTIONS = [
  ["Monthly",  "monthly"],
  ["Yearly",   "yearly"],
  ["One-time", "one-time"],
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export default function ContractForm() {
  /* ───── routing info ─────────────────────────────── */
  const { id }   = useParams();
  const isEdit   = Boolean(id);
  const { state } = useLocation();
  const navigate = useNavigate();

  /* ───── component state ──────────────────────────── */
  const [form, setForm] = useState({
    name: "", contract_type: "", start_date: "", end_date: "",
    payment_interval: "", notes: "", amount: "", brutto: "", netto: "",
    files: null,
  });
  const [country,  setCountry] = useState("");
  const [currency, setCur]     = useState("€");
  const [msg,      setMsg]     = useState("");
  const [busy,     setBusy]    = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

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
      end_date  : c.end_date?.slice(0, 10)   || "",
      netto     : c.contract_type === "salary" ? c.amount : "",
      brutto    : "",
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
    if (form.contract_type === "salary" && form.brutto && country) {
      const net = computeNet(Number(form.brutto), country);
      setForm(f => ({ ...f, netto: net.toFixed(2) }));
    }
  }, [form.brutto, country, form.contract_type]);

  /* ───── helpers ─────────────────────────────────── */
  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const iso      = d => (d ? `${d}T00:00:00` : null);
  const token    = localStorage.getItem("token");

  const buildPayload = () => {
    if (!form.name || !form.contract_type || !form.start_date) {
      setMsg("Please fill out all required fields.");
      return null;
    }
    if (!country) {
      setMsg("Please select a country first.");
      return null;
    }
    if (
      form.contract_type !== "salary" &&
      (!form.amount || Number(form.amount) <= 0)
    ) {
      setMsg("Please enter an amount.");
      return null;
    }

    const amount =
      form.contract_type === "salary"
        ? Number(form.netto || 0)
        : Number(form.amount);

    // Fix: end_date explizit auf null setzen, wenn leer
    const end_date = form.end_date === "" ? null : iso(form.end_date);

    return {
      name            : form.name,
      contract_type   : form.contract_type,
      start_date      : iso(form.start_date),
      end_date        : end_date,
      amount,
      payment_interval: form.payment_interval,
      status          : "active",
      notes           : form.notes,
    };
  };

  /* ───── submit handler with lock ─────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const payload = buildPayload();
    if (!payload) return;

    setBusy(true); setMsg("");
    try {
      const method = isEdit ? "PATCH" : "POST";
      const url    = isEdit ? `${API}${id}` : API;

      const r = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body   : JSON.stringify(payload),
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
        let filesToUpload = Array.from(form.files);

        if (filesToUpload.some(file => file.size > MAX_FILE_SIZE)) {
          setMsg(`One or more files are too large. Max size per file is ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
          setBusy(false);
          return;
        }
        
        const fd = new FormData();
        filesToUpload.forEach(f => fd.append("files", f));
        await fetch(`${API}${cid}/files`, {
          method : "POST",
          headers: { Authorization: `Bearer ${token}` },
          body   : fd,
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-white/80 mb-1">Name</label>
            <input
              className="frosted-input"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              required
              disabled={busy}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-white/80 mb-1">Contract type</label>
            <select
              className="frosted-input"
              value={form.contract_type}
              onChange={(e) => setField("contract_type", e.target.value)}
              required
              disabled={busy}
            >
              <option value="">Select type</option>
              {TYPE_OPTIONS.map(([l, v]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          {form.contract_type === "salary" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-white/80 mb-1">Gross salary</label>
                <input
                  className="frosted-input"
                  type="number"
                  placeholder="Gross salary"
                  value={form.brutto}
                  onChange={(e) => setField("brutto", e.target.value)}
                  disabled={busy}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-white/80 mb-1">Net salary</label>
                <input
                  className="frosted-input"
                  type="number"
                  placeholder="Net salary"
                  value={form.netto}
                  onChange={(e) => setField("netto", e.target.value)}
                  disabled={busy}
                />
              </div>
            </div>
          )}

          {form.contract_type && form.contract_type !== "salary" && (
            <div className="space-y-2">
              <label className="block text-white/80 mb-1">Amount</label>
              <input
                className="frosted-input"
                type="number"
                placeholder={`Amount (${currency})`}
                value={form.amount}
                onChange={(e) => setField("amount", e.target.value)}
                required
                disabled={busy}
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-white/80 mb-1">Start date</label>
              <input
                className="frosted-input"
                type="date"
                value={form.start_date}
                onChange={(e) => setField("start_date", e.target.value)}
                required
                disabled={busy}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-white/80 mb-1">End date</label>
              <input
                className="frosted-input"
                type="date"
                value={form.end_date || ""}
                onChange={(e) => setField("end_date", e.target.value)}
                disabled={busy || form.payment_interval === "one-time"}
              />
              {form.payment_interval === "one-time" && (
                <p className="text-xs text-white/60 mt-1">End date is not applicable for one-time contracts.</p>
              )}
              {isEdit && form.end_date && form.payment_interval !== "one-time" && (
                <button
                  type="button"
                  className="text-xs text-red-400 underline mt-1"
                  onClick={() => setField("end_date", "")}
                  disabled={busy}
                >
                  Remove end date
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-white/80 mb-1">Payment interval</label>
            <select
              className="frosted-input"
              value={form.payment_interval}
              onChange={(e) => setField("payment_interval", e.target.value)}
              required
              disabled={busy}
            >
              <option value="">Select interval</option>
              {INTERVAL_OPTIONS.map(([l, v]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-white/80 mb-1">Notes</label>
            <textarea
              className="frosted-input"
              rows={3}
              placeholder="Notes"
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              disabled={busy}
            />
          </div>

          <div className="space-y-2">
            <label className="block mb-1 text-white/80">Attachments</label>
            <div
              className={`frosted-file border-dashed border-2 ${busy ? 'opacity-60' : 'hover:border-emerald-400'} ${dragActive ? 'border-emerald-400 bg-emerald-900/10' : 'border-white/20 bg-transparent'}`}
              style={{ minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: busy ? 'not-allowed' : 'pointer' }}
              onDragOver={e => { e.preventDefault(); if (!busy) setDragActive(true); }}
              onDragLeave={e => { e.preventDefault(); setDragActive(false); }}
              onDrop={e => {
                e.preventDefault(); setDragActive(false);
                if (busy) return;
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  const files = Array.from(e.dataTransfer.files);
                  if (files.some(file => file.size > MAX_FILE_SIZE)) {
                    setMsg(`One or more files are too large. Max size per file is ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
                    setField("files", null); // Clear previous selection if any
                    return;
                  }
                  setMsg(""); // Clear previous error messages
                  setField("files", e.dataTransfer.files);
                }
              }}
              onClick={() => !busy && fileInputRef.current && fileInputRef.current.click()}
            >
              <input
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={e => {
                  if (e.target.files && e.target.files.length > 0) {
                    const files = Array.from(e.target.files);
                    if (files.some(file => file.size > MAX_FILE_SIZE)) {
                      setMsg(`One or more files are too large. Max size per file is ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
                      setField("files", null); // Clear previous selection
                      e.target.value = null; // Reset file input
                      return;
                    }
                    setMsg(""); // Clear previous error messages
                    setField("files", e.target.files);
                  }
                }}
                className="frosted-file"
                disabled={busy}
                ref={fileInputRef}
                style={{ display: 'none' }}
              />
              <span className="text-white/70 select-none pointer-events-none">
                {form.files && form.files.length > 0
                  ? Array.from(form.files).map(f => f.name).join(", ")
                  : "Click or drag files here (PDF, images)"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/80 mb-1">Country</label>
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
                  ⚠️ Please select a country in settings
                </p>
              )}
            </div>
            <div>
              <label className="block text-white/80 mb-1">Currency</label>
              <input
                className="frosted-input bg-white/5"
                readOnly
                value={currency}
              />
            </div>
          </div>

          <button className="btn-primary w-full" disabled={busy}>
            {busy ? "Please wait…" : isEdit ? "Save" : "Create"}
          </button>
        </form>
      </div>
    </div>
  );
}
