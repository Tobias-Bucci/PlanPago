import { API_BASE } from "../config";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { computeNet } from "../utils/taxUtils";
import Notification from "../components/Notification";
import { Upload, FileText, AlertCircle, Save, Plus, ArrowLeft } from "lucide-react";

const API = `${API_BASE}/contracts/`;
const TYPE_OPTIONS = [
  ["Rent", "rent"],
  ["Insurance", "insurance"],
  ["Streaming", "streaming"],
  ["Salary", "salary"],
  ["Leasing", "leasing"],
  ["Other", "other"],
];
const INTERVAL_OPTIONS = [
  ["Monthly", "monthly"],
  ["Yearly", "yearly"],
  ["One-time", "one-time"],
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export default function ContractForm() {
  /* ───── routing info ─────────────────────────────── */
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { state } = useLocation();
  const navigate = useNavigate();

  /* ───── component state ──────────────────────────── */
  const [form, setForm] = useState({
    name: "", contract_type: "", start_date: "", end_date: "",
    payment_interval: "", notes: "", amount: "", brutto: "", netto: "",
    files: null,
    backendFiles: [], // <-- Add this to track files from backend
  });
  const [country, setCountry] = useState("");
  const [currency, setCur] = useState("€");
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("info");
  const [busy, setBusy] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  /* ───── preload user context & contract ──────────── */
  useEffect(() => {
    const mail = localStorage.getItem("currentEmail");
    setCur(localStorage.getItem(`currency_${mail}`) || "€");
    setCountry(localStorage.getItem(`country_${mail}`) || "");

    if (isEdit) {
      if (state?.contract) prefill(state.contract);
      else fetchContract();
    }
    // eslint-disable-next-line
  }, []);

  const prefill = (c) =>
    setForm(f => ({
      ...f, ...c,
      start_date: c.start_date?.slice(0, 10) || "",
      end_date: c.end_date?.slice(0, 10) || "",
      netto: c.contract_type === "salary" ? c.amount : "",
      brutto: "",
      backendFiles: c.files || [], // <-- Store backend files
    }));

  const fetchContract = async () => {
    const r = await fetch(`${API}${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (r.ok) prefill(await r.json());
    else {
      setMsg("Error loading contract.");
      setMsgType("error");
    }
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
  const iso = d => (d ? `${d}T00:00:00` : null);
  const token = localStorage.getItem("token");

  const buildPayload = () => {
    if (!form.name || !form.contract_type || !form.start_date) {
      setMsg("Please fill out all required fields.");
      setMsgType("error");
      return null;
    }
    if (!country) {
      setMsg("Please select a country first.");
      setMsgType("error");
      return null;
    }
    if (
      form.contract_type !== "salary" &&
      (!form.amount || Number(form.amount) <= 0)
    ) {
      setMsg("Please enter an amount.");
      setMsgType("error");
      return null;
    }

    const amount =
      form.contract_type === "salary"
        ? Number(form.netto || 0)
        : Number(form.amount);

    // Fix: explicitly set end_date to null when empty
    const end_date = form.end_date === "" ? null : iso(form.end_date);

    return {
      name: form.name,
      contract_type: form.contract_type,
      start_date: iso(form.start_date),
      end_date: end_date,
      amount,
      payment_interval: form.payment_interval,
      status: "active",
      notes: form.notes,
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
      const url = isEdit ? `${API}${id}` : API;

      const r = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
      });

      if (!r.ok) {
        const text = await r.text();
        try {
          const j = JSON.parse(text);
          setMsg("Error: " + (j.detail || text));
        } catch (err) {
          setMsg("Error: " + text);
        }
        setMsgType("error");
        setBusy(false);
        return;
      }

      const data = await r.json();
      const cid = data.id || id;

      /* optional file upload */
      if (form.files?.length) {
        let filesToUpload = Array.from(form.files);

        if (filesToUpload.some(file => file.size > MAX_FILE_SIZE)) {
          setMsg("One or more files are too large. Max size per file is " + (MAX_FILE_SIZE / 1024 / 1024) + "MB.");
          setMsgType("error");
          setBusy(false);
          return;
        }
        const fd = new FormData();
        filesToUpload.forEach(f => fd.append("files", f));
        await fetch(`${API}${cid}/files`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        setField("files", null); // Clear local files after upload
        if (fileInputRef.current) fileInputRef.current.value = null; // Clear file input
        if (isEdit) await fetchContract(); // Refresh backend files
      }
      setMsg(isEdit ? "Contract updated." : "Contract created.");
      setMsgType("success");
      setTimeout(() => navigate("/dashboard"), 1200);
    } catch (err) {
      setMsg("Network error – please try again.");
      setMsgType("error");
      setBusy(false);
    }
  };

  /* ───── UI ───────────────────────────────────────── */
  return (
    <div
      className="min-h-screen"
      style={{
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #2d3748 50%, #1a202c 75%, #0f1419 100%)"
      }}
    >
      {/* Flash messages - positioned above everything */}
      <div className="fixed top-4 right-4 z-[9999]">
        {msg && <Notification message={msg} type={msgType} onDone={() => setMsg("")} />}
      </div>

      <main className="container mx-auto pt-24 p-6 animate-fadeIn" style={{ position: "relative", zIndex: 10 }}>

        {/* Header */}
        <div className="mb-8 animate-pop">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-300 backdrop-blur-md"
              title="Back to Dashboard"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
            <div>
              <h1 className="text-3xl font-semibold text-white mb-2">
                {isEdit ? "Edit Contract" : "Create New Contract"}
              </h1>
              <p className="text-white/70 text-lg">
                {isEdit ? "Update your contract details" : "Add a new contract to your portfolio"}
              </p>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="max-w-4xl mx-auto animate-pop">
          <div className="glass-card p-8">
            <form onSubmit={handleSubmit} className="space-y-8">

              {/* Basic Information Section */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white flex items-center gap-3 pb-4 border-b border-white/10">
                  <FileText size={24} />
                  Basic Information
                </h3>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-white/80 font-medium mb-2">Contract Name *</label>
                    <input
                      className="frosted-input"
                      placeholder="e.g. Netflix Subscription, Apartment Rent..."
                      value={form.name}
                      onChange={(e) => setField("name", e.target.value)}
                      required
                      disabled={busy}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-white/80 font-medium mb-2">Contract Type *</label>
                    <select
                      className="frosted-input"
                      value={form.contract_type}
                      onChange={(e) => setField("contract_type", e.target.value)}
                      required
                      disabled={busy}
                    >
                      <option value="">Select contract type</option>
                      {TYPE_OPTIONS.map(([l, v]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Financial Details Section */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white flex items-center gap-3 pb-4 border-b border-white/10">
                  <span className="text-2xl">💰</span>
                  Financial Details
                </h3>

                {form.contract_type === "salary" ? (
                  <>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-white/80 font-medium mb-2">Gross Salary</label>
                        <input
                          className="frosted-input"
                          type="number"
                          placeholder="Enter gross amount"
                          value={form.brutto}
                          onChange={(e) => setField("brutto", e.target.value)}
                          disabled={busy}
                        />
                        <p className="text-xs text-white/60">Enter your gross salary for automatic net calculation</p>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-white/80 font-medium mb-2">Net Salary</label>
                        <input
                          className="frosted-input"
                          type="number"
                          placeholder="Calculated automatically"
                          value={form.netto}
                          onChange={(e) => setField("netto", e.target.value)}
                          disabled={busy}
                        />
                        <p className="text-xs text-white/60">Net amount after tax deductions</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div></div>
                      <div className="space-y-2">
                        <label className="block text-white/80 font-medium mb-2">Payment Interval *</label>
                        <select
                          className="frosted-input"
                          value={form.payment_interval}
                          onChange={(e) => setField("payment_interval", e.target.value)}
                          required
                          disabled={busy}
                        >
                          <option value="">Select payment frequency</option>
                          {INTERVAL_OPTIONS.map(([l, v]) => (
                            <option key={v} value={v}>{l}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                ) : form.contract_type ? (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex flex-col justify-start">
                      <label className="block text-white/80 font-medium mb-2">Amount *</label>
                      <div className="relative">
                        <input
                          className="frosted-input pr-12"
                          type="number"
                          placeholder="Enter amount"
                          value={form.amount}
                          onChange={(e) => setField("amount", e.target.value)}
                          required
                          disabled={busy}
                        />
                        <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 font-medium">
                          {currency}
                        </span>
                      </div>
                      <p className="text-xs text-white/60 min-h-[16px] mt-2">Enter the contract amount</p>
                    </div>
                    <div className="flex flex-col justify-start">
                      <label className="block text-white/80 font-medium mb-2">Payment Interval *</label>
                      <select
                        className="frosted-input"
                        value={form.payment_interval}
                        onChange={(e) => setField("payment_interval", e.target.value)}
                        required
                        disabled={busy}
                      >
                        <option value="">Select payment frequency</option>
                        {INTERVAL_OPTIONS.map(([l, v]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                      <p className="text-xs text-white/60 min-h-[16px] mt-2">How often is this amount paid?</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle size={48} className="mx-auto text-white/40 mb-4" />
                    <p className="text-white/60">Please select a contract type first</p>
                  </div>
                )}
              </div>

              {/* Timeline Section */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white flex items-center gap-3 pb-4 border-b border-white/10">
                  <span className="text-2xl">📅</span>
                  Timeline
                </h3>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-white/80 font-medium mb-2">Start Date *</label>
                    <input
                      className="frosted-input"
                      type="date"
                      value={form.start_date}
                      onChange={(e) => setField("start_date", e.target.value)}
                      required
                      disabled={busy}
                    />
                    <p className="text-xs text-white/60">When does this contract begin?</p>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-white/80 font-medium mb-2">End Date</label>
                    <input
                      className="frosted-input"
                      type="date"
                      value={form.end_date || ""}
                      onChange={(e) => setField("end_date", e.target.value)}
                      disabled={busy || form.payment_interval === "one-time"}
                    />
                    {form.payment_interval === "one-time" ? (
                      <p className="text-xs text-orange-300">One-time contracts don't need an end date</p>
                    ) : (
                      <p className="text-xs text-white/60">Leave empty for ongoing contracts</p>
                    )}
                    {isEdit && form.end_date && form.payment_interval !== "one-time" && (
                      <button
                        type="button"
                        className="text-xs text-red-400 hover:text-red-300 underline transition-colors"
                        onClick={() => setField("end_date", "")}
                        disabled={busy}
                      >
                        Remove end date
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Information Section */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white flex items-center gap-3 pb-4 border-b border-white/10">
                  <span className="text-2xl">📝</span>
                  Additional Information
                </h3>

                <div className="space-y-2">
                  <label className="block text-white/80 font-medium mb-2">Notes</label>
                  <textarea
                    className="frosted-input"
                    rows={4}
                    placeholder="Add any additional notes about this contract..."
                    value={form.notes}
                    onChange={(e) => setField("notes", e.target.value)}
                    disabled={busy}
                  />
                  <p className="text-xs text-white/60">Optional details, cancellation terms, or reminders</p>
                </div>
              </div>

              {/* File Upload Section */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white flex items-center gap-3 pb-4 border-b border-white/10">
                  <Upload size={24} />
                  Attachments
                </h3>

                <div
                  className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 ${busy
                    ? 'opacity-60 cursor-not-allowed border-white/20 bg-white/5'
                    : dragActive
                      ? 'border-emerald-400 bg-emerald-900/20 scale-105'
                      : 'border-white/30 bg-white/5 hover:border-white/50 hover:bg-white/10 cursor-pointer'
                    }`}
                  onDragOver={e => { e.preventDefault(); if (!busy) setDragActive(true); }}
                  onDragLeave={e => { e.preventDefault(); setDragActive(false); }}
                  onDrop={e => {
                    e.preventDefault();
                    setDragActive(false);
                    if (busy) return;
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      const files = Array.from(e.dataTransfer.files);
                      if (files.some(file => file.size > MAX_FILE_SIZE)) {
                        setMsg("One or more files are too large. Max size per file is " + (MAX_FILE_SIZE / 1024 / 1024) + "MB.");
                        setMsgType("error");
                        setField("files", null);
                        return;
                      }
                      setMsg("");
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
                          setMsg("One or more files are too large. Max size per file is " + (MAX_FILE_SIZE / 1024 / 1024) + "MB.");
                          setMsgType("error");
                          setField("files", null);
                          e.target.value = null;
                          return;
                        }
                        setMsg("");
                        setField("files", e.target.files);
                      }
                    }}
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    disabled={busy}
                  />

                  <div className="text-center">
                    <Upload size={48} className={`mx-auto mb-4 ${dragActive ? 'text-emerald-400' : 'text-white/40'}`} />
                    {form.files && form.files.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-lg font-medium text-white">
                          {form.files.length} file{form.files.length > 1 ? 's' : ''} selected
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {Array.from(form.files).map((file, idx) => (
                            <span key={idx} className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-600/20 rounded-lg text-emerald-300 text-sm">
                              <FileText size={16} />
                              {file.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-lg font-medium text-white/80">
                          {dragActive ? 'Drop files here' : 'Upload contract documents'}
                        </p>
                        <p className="text-white/60">
                          Click or drag files here • PDF, images • Max {MAX_FILE_SIZE / 1024 / 1024}MB per file
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Show existing backend files */}
                {form.backendFiles && form.backendFiles.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-white/80 font-medium">Current Attachments</h4>
                    <div className="flex flex-wrap gap-3">
                      {form.backendFiles.map((file, idx) => (
                        <a
                          key={file.id || file.name || idx}
                          href={file.url || file.download_url || file.path || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-all duration-300 border border-white/20"
                          title={file.name || file.filename || 'Attachment'}
                        >
                          <FileText size={16} />
                          <span>{file.name || file.filename || 'Attachment'}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User Settings Preview */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white flex items-center gap-3 pb-4 border-b border-white/10">
                  <span className="text-2xl">⚙️</span>
                  Settings
                </h3>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-white/80 font-medium mb-2">Country</label>
                    <input
                      className="frosted-input bg-white/5"
                      readOnly
                      value={country || "Not set"}
                      placeholder="Country"
                    />
                    {!country && (
                      <div
                        onClick={() => !busy && navigate("/profile")}
                        className="flex items-center gap-2 mt-2 text-sm text-red-300 cursor-pointer hover:text-red-200 transition-colors"
                      >
                        <AlertCircle size={16} />
                        <span>Please select a country in your profile settings</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-white/80 font-medium mb-2">Currency</label>
                    <input
                      className="frosted-input bg-white/5"
                      readOnly
                      value={currency}
                    />
                    <p className="text-xs text-white/60">Currency can be changed in profile settings</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-row gap-4 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="btn-accent flex-none px-8"
                  disabled={busy}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 flex items-center justify-center gap-3 px-8"
                  disabled={busy}
                >
                  {busy ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      {isEdit ? <Save size={20} /> : <Plus size={20} />}
                      <span>{isEdit ? "Save Changes" : "Create Contract"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8 mt-16">
        <div className="container mx-auto px-6">
          <div className="flex flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <img src="/PlanPago-trans.png" alt="PlanPago" className="h-6 w-6" />
              <span className="text-lg font-semibold">PlanPago</span>
            </div>

            <div className="flex items-center gap-6 text-sm text-white/70">
              <span>&copy; {new Date().getFullYear()} PlanPago</span>
              <a href="/imprint" className="hover:text-white transition-colors">
                Imprint & Contact
              </a>
              <a href="/privacypolicy" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="/terms" className="hover:text-white transition-colors">
                Terms & Conditions
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
