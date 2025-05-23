// Dashboard.jsx  –  overview, filters, inline-expand rows & exports
import { API_BASE } from "../config";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlusCircle,
  Edit3,
  Trash2,
  ChevronsLeft,
  ChevronsRight,
  Search,
  FileSpreadsheet,
  FileText,
  XCircle, // Icon für Cancel
  Undo2, // Icon für Re-activate
  ArrowUp, // Icon für Sort Ascending
  ArrowDown, // Icon für Sort Descending
  ArrowUpDown, // Icon für Sort Both Ways
} from "lucide-react";
import ConfirmModal from "../components/ConfirmModal";
import Notification from "../components/Notification";
import { fetchWithAuth } from "../utils/fetchWithAuth";

/* ───────── constants ─────────────────────────────────────────── */
const PAGE_SIZE = 10;                     // ← 0 caused empty pages

const TYPE_OPTIONS = [
  { label: "All Types", value: "" },
  { label: "Rent", value: "rent" },
  { label: "Insurance", value: "insurance" },
  { label: "Streaming", value: "streaming" },
  { label: "Salary", value: "salary" },
  { label: "Leasing", value: "leasing" },
  { label: "Other", value: "other" },
];

const STATUS_OPTIONS = [
  { label: "Any Status", value: "" },
  { label: "Active", value: "active" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Expired", value: "expired" },
];

// Sort options with labels and field names
const SORT_OPTIONS = [
  { label: "Date (newest first)", field: "start_date", dir: "desc" },
  { label: "Date (oldest first)", field: "start_date", dir: "asc" },
  { label: "Price (highest first)", field: "amount", dir: "desc" },
  { label: "Price (lowest first)", field: "amount", dir: "asc" },
  { label: "End date (soonest first)", field: "end_date", dir: "asc" },
  { label: "End date (latest first)", field: "end_date", dir: "desc" },
];

/* ───────── component ────────────────────────────────────────── */
export default function Dashboard() {
  /* main data & ui state */
  const [contracts, setContracts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);

  const [query, setQuery] = useState("");
  const [filterType, setFType] = useState("");
  const [filterStat, setFStat] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  // Sorting state
  const [sortField, setSortField] = useState("start_date");
  const [sortDir, setSortDir] = useState("desc");

  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("success");
  const [err, setErr] = useState("");
  const [loading, setLd] = useState(true);
  const [dialog, setDialog] = useState({ open: false });
  const [expandedId, setExpandedId] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef();
  const sortRef = useRef();
  const [filesCache, setFilesCache] = useState({}); // contractId -> files array

  const navigate = useNavigate();
  const API = API_BASE;
  const authHeader = useMemo(
    () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` }),
    []
  );
  const currency =
    localStorage.getItem(`currency_${localStorage.getItem("currentEmail")}`) ||
    "€";

  /* ───── fetch contracts page ───────────────────────────────── */
  const loadPage = useCallback(async () => {
    setLd(true);
    setErr("");
    try {
      const p = new URLSearchParams({
        skip: page * PAGE_SIZE,
        limit: PAGE_SIZE,
      });
      if (query.trim()) p.append("q", query.trim());
      if (filterType) p.append("type", filterType);
      if (filterStat) p.append("status", filterStat);
      // Add sorting parameters - this affects ALL contracts, not just current page
      if (sortField) p.append("sort_by", sortField);
      if (sortDir) p.append("sort_dir", sortDir);

      const r = await fetchWithAuth(`${API}/contracts/?${p.toString()}`, { headers: authHeader }, navigate);
      if (!r.ok) throw new Error(await r.text());
      const { items, total } = await r.json();

      setContracts(items);
      setTotal(total);

      // Batch-load files for all visible contracts
      const filesPromises = items.map(async (contract) => {
        const fr = await fetchWithAuth(`${API}/contracts/${contract.id}/files`, { headers: authHeader }, navigate);
        const files = fr.ok ? await fr.json() : [];
        return { contractId: contract.id, files };
      });
      const filesResults = await Promise.all(filesPromises);
      const filesMap = filesResults.reduce((acc, { contractId, files }) => {
        acc[contractId] = files;
        return acc;
      }, {});
      setFilesCache(filesMap);
    } catch (e) {
      setErr(e.message || "Loading error");
    } finally {
      setLd(false);
    }
  }, [API, authHeader, page, query, filterType, filterStat, navigate, sortField, sortDir]);

  /* Attachments for a contract: load and cache */
  const loadFilesForContract = async (contractId) => {
    if (filesCache[contractId]) return; // already loaded
    try {
      const fr = await fetchWithAuth(`${API}/contracts/${contractId}/files`, { headers: authHeader }, navigate);
      const files = fr.ok ? await fr.json() : [];
      setFilesCache((prev) => ({ ...prev, [contractId]: files }));
    } catch {
      setFilesCache((prev) => ({ ...prev, [contractId]: [] }));
    }
  };

  /* initial + dependents */
  useEffect(() => { loadPage(); }, [loadPage]);

  /* reload on filters/search change */
  useEffect(() => {
    setPage(0);
    loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filterType, filterStat, sortField, sortDir]);

  /* ───── deletion helpers ───────────────────────────────────── */
  const reallyDeleteContract = async (id) => {
    try {
      const r = await fetchWithAuth(`${API}/contracts/${id}`, {
        method: "DELETE",
        headers: authHeader,
      }, navigate);
      if (!r.ok) throw new Error("Deletion failed");
      setMsg("Contract deleted");
      setMsgType("success");
      loadPage();
    } catch (e) { setErr(e.message); }
  };
  const deleteContract = (id) =>
    setDialog({
      open: true,
      title: "Delete contract?",
      message: "This will remove the contract and its attachments.",
      onConfirm: () => reallyDeleteContract(id),
    });

  const reallyDeleteFile = async (cid, fid) => {
    try {
      const r = await fetchWithAuth(`${API}/contracts/${cid}/files/${fid}`, {
        method: "DELETE",
        headers: authHeader,
      }, navigate);
      if (!r.ok) throw new Error("Attachment could not be deleted");
      setMsg("Attachment deleted");
      setMsgType("success");
      loadPage();
    } catch (e) { setErr(e.message); }
  };
  const deleteFile = (cid, fid) =>
    setDialog({
      open: true,
      title: "Delete attachment?",
      message: "The file will be removed permanently.",
      onConfirm: () => reallyDeleteFile(cid, fid),
    });

  const reallyCancelContract = async (id) => {
    try {
      const r = await fetchWithAuth(`${API}/contracts/${id}`, {
        method: "PATCH",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      }, navigate);
      if (!r.ok) throw new Error("Cancel failed");
      setMsg("Contract cancelled");
      setMsgType("success");
      loadPage();
    } catch (e) { setErr(e.message); }
  };
  const cancelContract = (id) =>
    setDialog({
      open: true,
      title: "Cancel contract?",
      message: "This will mark the contract as cancelled. It will be ignored in statistics.",
      onConfirm: () => reallyCancelContract(id),
    });

  const reallyReactivateContract = async (id) => {
    try {
      const r = await fetchWithAuth(`${API}/contracts/${id}`, {
        method: "PATCH",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      }, navigate);
      if (!r.ok) throw new Error("Re-activate failed");
      setMsg("Contract re-activated");
      setMsgType("success");
      loadPage();
    } catch (e) { setErr(e.message); }
  };
  const reactivateContract = (id) =>
    setDialog({
      open: true,
      title: "Re-activate contract?",
      message: "This will set the contract back to active.",
      onConfirm: () => reallyReactivateContract(id),
    });

  /* ───── pagination helpers ─────────────────────────────────── */
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) return [...Array(totalPages).keys()];
    const start = Math.max(0, Math.min(page - 2, totalPages - 5));
    return [0, 1, 2, 3, 4].map(i => i + start);
  }, [page, totalPages]);

  const today = new Date();

  /* ───── JSX ────────────────────────────────────────────────── */
  return (
    <main className="container mx-auto pt-24 p-6 animate-fadeIn">

      {/* Header + action buttons */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold text-white">Overview</h1>
        <div className="flex gap-2 relative">
          <button
            className="btn-accent rounded-full p-3"
            title="New contract"
            onClick={() => navigate("/contracts/new")}
          >
            <PlusCircle size={24} />
          </button>
          <button
            className="btn-primary rounded-full px-4 py-2 flex items-center gap-2"
            title="Export contracts"
            onClick={() => setExportOpen((v) => !v)}
            ref={exportRef}
          >
            <FileSpreadsheet size={18} strokeWidth={2} /> / <FileText size={18} strokeWidth={2} /> Export
          </button>
          {exportOpen && (
            <div className="absolute right-0 mt-12 z-10 bg-[#181f3a] border border-white/10 rounded-lg shadow-lg min-w-[160px] animate-pop">
              <button
                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-white/10 text-white"
                onClick={async () => {
                  setExportOpen(false);
                  const res = await fetchWithAuth(`${API}/contracts/export/csv`, { headers: authHeader }, navigate);
                  if (!res.ok) return setErr("Export failed");
                  const blob = await res.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = Object.assign(document.createElement("a"), {
                    href: url,
                    download: "contracts.csv",
                  });
                  a.click(); window.URL.revokeObjectURL(url);
                }}
              >
                <FileSpreadsheet size={18} strokeWidth={2} /> Export as CSV
              </button>
              <button
                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-white/10 text-white"
                onClick={async () => {
                  setExportOpen(false);
                  const res = await fetchWithAuth(`${API}/contracts/export/pdf`, { headers: authHeader }, navigate);
                  if (!res.ok) return setErr("Export failed");
                  const blob = await res.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = Object.assign(document.createElement("a"), {
                    href: url,
                    download: "contracts.pdf",
                  });
                  a.click(); window.URL.revokeObjectURL(url);
                }}
              >
                <FileText size={18} strokeWidth={2} /> Export as PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <button
          className="btn-primary flex items-center gap-2 sm:w-auto"
          onClick={() => setModalOpen(true)}
        >
          <Search size={18} /> Search
        </button>

        <select
          className="frosted-input sm:w-40"
          value={filterType}
          onChange={(e) => setFType(e.target.value)}
        >
          {TYPE_OPTIONS.map(({ label, value }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <select
          className="frosted-input sm:w-40"
          value={filterStat}
          onChange={(e) => setFStat(e.target.value)}
        >
          {STATUS_OPTIONS.map(({ label, value }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <div className="relative" ref={sortRef}>
          <select
            className="frosted-input sm:w-56 pr-10"
            value={`${sortField}_${sortDir}`}
            onChange={(e) => {
              const [field, direction] = e.target.value.split('_');
              setSortField(field);
              setSortDir(direction);
            }}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={`${option.field}_${option.dir}`} value={`${option.field}_${option.dir}`}>
                {option.label}
              </option>
            ))}
          </select>
          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#aaa' }}>
            <ArrowUpDown size={20} />
          </span>
        </div>
      </div>

      {/* Flash messages */}
      {msg && <Notification message={msg} type={msgType} onDone={() => setMsg("")} />}
      {err && <Notification message={err} type="error" onDone={() => setErr("")} />}

      {/* Table/Card-List */}
      {loading ? (
        <p className="text-center py-10 text-white/70">Loading contracts…</p>
      ) : contracts.length === 0 ? (
        <p className="text-center py-10 text-white/70">No contracts found.</p>
      ) : (
        <div className="glass-card overflow-x-auto">
          {/* Mobile: Cards, Desktop: Table */}
          <div className="block sm:hidden">
            {/* Mobile Sorting Options */}
            <div className="flex items-center mb-4 p-4 bg-white/5 rounded-lg">
              <div className="w-full">
                <label className="block text-white/70 mb-2">Sort by:</label>
                <select
                  className="frosted-input w-full"
                  value={`${sortField}_${sortDir}`}
                  onChange={(e) => {
                    const [field, direction] = e.target.value.split('_');
                    setSortField(field);
                    setSortDir(direction);
                  }}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={`${option.field}_${option.dir}`} value={`${option.field}_${option.dir}`}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {contracts.slice(0, PAGE_SIZE).map((c, idx) => {
              const end = new Date(c.end_date || "");
              const expired = c.end_date && end < today;
              const cancelled = c.status === "cancelled";
              return (
                <div key={c.id} className={`mb-4 p-4 rounded-xl bg-white/5 shadow flex flex-col gap-2 ${(expired || cancelled) ? "opacity-50" : ""}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-lg">{c.name}</span>
                    <span className={`text-xs px-2 py-1 rounded ${cancelled ? "bg-gray-600/30 text-gray-400" : expired ? "bg-red-600/30 text-red-300" : "bg-emerald-600/20 text-emerald-300"}`}>
                      {cancelled ? "Cancelled" : expired ? "Expired" : c.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="bg-white/10 rounded px-2 py-1">{c.contract_type}</span>
                    <span className="bg-white/10 rounded px-2 py-1">{new Date(c.start_date).toLocaleDateString()}</span>
                    <span className="bg-white/10 rounded px-2 py-1">{c.end_date ? end.toLocaleDateString() : "-"}</span>
                    <span className="bg-white/10 rounded px-2 py-1">{c.amount} {currency}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {filesCache[c.id]?.map((f) => (
                      <div key={f.id} className="relative inline-block">
                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Authentifizierte Vorschau/Download per fetch
                            const token = localStorage.getItem("token");
                            const url = `${API}/contracts/${c.id}/files/preview/${f.id}`;
                            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
                            if (!res.ok) {
                              alert("Fehler beim Laden der Datei: " + (await res.text()));
                              return;
                            }
                            const blob = await res.blob();
                            const fileUrl = window.URL.createObjectURL(blob);
                            if (f.url.endsWith(".pdf")) {
                              window.open(fileUrl, "_blank");
                            } else {
                              const img = new window.Image();
                              img.src = fileUrl;
                              const w = window.open();
                              w.document.write(img.outerHTML);
                            }
                          }}
                          style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                          title="Preview/download"
                        >
                          {f.url.endsWith(".pdf") ? (
                            <span className="text-2xl">📄</span>
                          ) : (
                            <img
                              src="/static/placeholder.png"
                              alt={f.original_filename}
                              className="h-10 w-10 rounded object-cover"
                            />
                          )}
                        </button>
                        <button
                          className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 text-[10px]"
                          onClick={(e) => { e.stopPropagation(); deleteFile(c.id, f.id); }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button className="btn-primary flex-1" onClick={() => navigate(`/contracts/${c.id}/edit`, { state: { contract: c } })}>Edit</button>
                    <button className="btn-accent flex-1 bg-red-600 hover:bg-red-700" onClick={() => deleteContract(c.id)}>Delete</button>
                    {cancelled ? (
                      <button
                        className="btn-accent flex-1 bg-emerald-700 hover:bg-emerald-800"
                        onClick={() => reactivateContract(c.id)}
                        title="Reactivate contract"
                      >
                        Reactivate
                      </button>
                    ) : (
                      <button
                        className="btn-accent flex-1 bg-gray-500 hover:bg-gray-600"
                        onClick={() => cancelContract(c.id)}
                        disabled={expired}
                        title="Cancel contract"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                  {c.notes && (
                    <div className="mt-2 text-white/80 text-sm bg-white/5 rounded p-2">
                      <span className="font-semibold">Notes:</span> {c.notes}
                    </div>
                  )}
                </div>
              );
            })}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4 mb-2">
                <button
                  className="p-2 rounded hover:bg-white/10 disabled:opacity-40"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 0}
                >
                  <ChevronsLeft size={18} />
                </button>
                {pageNumbers.map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`px-3 py-1 rounded-lg ${n === page ? "bg-[var(--secondary)]" : "hover:bg-white/10"}`}
                  >
                    {n + 1}
                  </button>
                ))}
                <button
                  className="p-2 rounded hover:bg-white/10 disabled:opacity-40"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === totalPages - 1}
                >
                  <ChevronsRight size={18} />
                </button>
              </div>
            )}
          </div>
          <table className="min-w-full text-white/90 hidden sm:table">
            <thead className="text-white uppercase text-sm bg-white/10">
              <tr>
                <th className="px-6 py-3 text-center">Name</th>
                <th className="px-6 py-3 text-center">Type</th>
                <th className="px-6 py-3 text-center">Interval</th>
                <th className="px-6 py-3 text-center">
                  <button
                    className="inline-flex items-center gap-1"
                    onClick={() => setSortDir(sortField === "start_date" ? (sortDir === "asc" ? "desc" : "asc") : "asc") || setSortField("start_date")}
                    title={sortField === "start_date" ? (sortDir === "asc" ? "Sort start date descending" : "Sort start date ascending") : "Sort by start date"}
                  >
                    Start
                    {sortField === "start_date" ? (
                      sortDir === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                    ) : (
                      <ArrowUpDown size={14} className="opacity-50" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-center">
                  <button
                    className="inline-flex items-center gap-1"
                    onClick={() => setSortDir(sortField === "end_date" ? (sortDir === "asc" ? "desc" : "asc") : "asc") || setSortField("end_date")}
                    title={sortField === "end_date" ? (sortDir === "asc" ? "Sort end date descending" : "Sort end date ascending") : "Sort by end date"}
                  >
                    End
                    {sortField === "end_date" ? (
                      sortDir === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                    ) : (
                      <ArrowUpDown size={14} className="opacity-50" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-center">
                  <button
                    className="inline-flex items-center gap-1"
                    onClick={() => setSortDir(sortField === "amount" ? (sortDir === "asc" ? "desc" : "asc") : "asc") || setSortField("amount")}
                    title={sortField === "amount" ? (sortDir === "asc" ? "Sort amount descending" : "Sort amount ascending") : "Sort by amount"}
                  >
                    Amount
                    {sortField === "amount" ? (
                      sortDir === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                    ) : (
                      <ArrowUpDown size={14} className="opacity-50" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-center">Files</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c, idx) => {
                const end = new Date(c.end_date || "");
                const expired = c.end_date && end < today;
                const cancelled = c.status === "cancelled";
                const expanded = expandedId === c.id;
                // Payment interval label
                let intervalLabel = "-";
                if (c.payment_interval === "yearly") intervalLabel = "Yearly";
                else if (c.payment_interval === "monthly") intervalLabel = "Monthly";
                else if (c.payment_interval === "one-time") intervalLabel = "One-time";

                return (
                  <React.Fragment key={c.id}>
                    <tr
                      className={`${(expired || cancelled) ? "opacity-50" : ""} hover:bg-white/10 transition cursor-pointer`}
                      onClick={async () => {
                        if (expandedId !== c.id) {
                          setExpandedId(c.id);
                          if (!filesCache[c.id]) await loadFilesForContract(c.id);
                        } else {
                          setExpandedId(null);
                        }
                      }}
                    >
                      <td className="px-6 py-4 text-center">{c.name}</td>
                      <td className="px-6 py-4 text-center">{TYPE_OPTIONS.find(t => t.value === c.contract_type)?.label || c.contract_type}</td>
                      <td className="px-6 py-4 text-center">{intervalLabel}</td>
                      <td className="px-6 py-4 text-center">{new Date(c.start_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-center">{c.end_date ? end.toLocaleDateString() : "-"}</td>
                      <td className="px-6 py-4 text-center">{c.amount} {currency}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={cancelled ? "text-gray-400" : expired ? "text-red-400" : "text-emerald-300"}>
                          {cancelled ? "Cancelled" : expired ? "Expired" : (STATUS_OPTIONS.find(s => s.value === c.status)?.label || c.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-wrap gap-2 justify-center">
                          {filesCache[c.id]?.map((f) => (
                            <div key={f.id} className="relative inline-block">
                              <button
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  // Authentifizierte Vorschau/Download per fetch
                                  const token = localStorage.getItem("token");
                                  const url = `${API}/contracts/${c.id}/files/preview/${f.id}`;
                                  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
                                  if (!res.ok) {
                                    alert("Fehler beim Laden der Datei: " + (await res.text()));
                                    return;
                                  }
                                  const blob = await res.blob();
                                  const fileUrl = window.URL.createObjectURL(blob);
                                  if (f.url.endsWith(".pdf")) {
                                    window.open(fileUrl, "_blank");
                                  } else {
                                    const img = new window.Image();
                                    img.src = fileUrl;
                                    const w = window.open();
                                    w.document.write(img.outerHTML);
                                  }
                                }}
                                style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                                title="Preview/download"
                              >
                                {f.url.endsWith(".pdf") ? (
                                  <span className="text-2xl">📄</span>
                                ) : (
                                  <img
                                    src="/static/placeholder.png"
                                    alt={f.original_filename}
                                    className="h-10 w-10 rounded object-cover"
                                  />
                                )}
                              </button>
                              <button
                                className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 text-[10px]"
                                onClick={(e) => { e.stopPropagation(); deleteFile(c.id, f.id); }}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-4">
                          <button
                            className="btn-primary flex items-center justify-center w-12 h-12 rounded-lg transition hover:scale-110 hover:brightness-125"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/contracts/${c.id}/edit`, { state: { contract: c } });
                            }}
                            title="Edit contract"
                            style={{ minWidth: 48, minHeight: 48 }}
                          >
                            <Edit3 size={24} />
                          </button>
                          <button
                            className="btn-accent flex items-center justify-center w-12 h-12 rounded-lg bg-red-600 hover:bg-red-700 transition hover:scale-110 hover:brightness-125"
                            onClick={(e) => { e.stopPropagation(); deleteContract(c.id); }}
                            title="Delete contract"
                            style={{ minWidth: 48, minHeight: 48 }}
                          >
                            <Trash2 size={24} />
                          </button>
                          {c.status === "cancelled" ? (
                            <button
                              className="flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-700 hover:bg-emerald-600 transition hover:scale-110 hover:brightness-125"
                              onClick={(e) => { e.stopPropagation(); reactivateContract(c.id); }}
                              title="Re-activate contract"
                              style={{ minWidth: 48, minHeight: 48 }}
                            >
                              <Undo2 size={24} />
                            </button>
                          ) : (
                            <button
                              className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-700 hover:bg-gray-700 transition hover:scale-110 hover:brightness-125"
                              onClick={(e) => { e.stopPropagation(); cancelContract(c.id); }}
                              title="Cancel contract"
                              style={{ minWidth: 48, minHeight: 48 }}
                              disabled={c.status === "expired"}
                            >
                              <XCircle size={24} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* expandable notes row */}
                    <tr>
                      <td colSpan="9" style={{ padding: 0, border: 0 }}>
                        <div
                          className={`transition-[max-height,opacity] duration-300 ${expanded ? "max-h-40 opacity-100" : "max-h-0 opacity-0"} overflow-hidden`}
                        >
                          {expanded && (
                            <div className="p-6 bg-white/5 border-t border-white/10 animate-pop text-white/90">
                              <div className="font-semibold mb-1">Notes</div>
                              <div className="whitespace-pre-line text-white/80 min-h-[1.5em]">
                                {c.notes ? c.notes : <span className="italic text-white/40">No notes entered.</span>}
                              </div>
                              <div className="font-semibold mt-4 mb-2">Attachments:</div>
                              {filesCache[c.id] === undefined ? (
                                <span className="text-white/60 text-sm">Loading files…</span>
                              ) : filesCache[c.id].length === 0 ? (
                                <span className="text-white/40 text-sm italic">No attachments.</span>
                              ) : (
                                <div className="flex flex-wrap gap-2">
                                  {filesCache[c.id].map((f) => (
                                    <div key={f.id} className="relative inline-block">
                                      <button
                                        onClick={async (e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          const token = localStorage.getItem("token");
                                          const url = `${API}/contracts/${c.id}/files/preview/${f.id}`;
                                          const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
                                          if (!res.ok) {
                                            alert("Fehler beim Laden der Datei: " + (await res.text()));
                                            return;
                                          }
                                          const blob = await res.blob();
                                          const fileUrl = window.URL.createObjectURL(blob);
                                          if (f.url.endsWith(".pdf")) {
                                            window.open(fileUrl, "_blank");
                                          } else {
                                            const img = new window.Image();
                                            img.src = fileUrl;
                                            const w = window.open();
                                            w.document.write(img.outerHTML);
                                          }
                                        }}
                                        style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                                        title="Preview/download"
                                      >
                                        {f.url.endsWith(".pdf") ? (
                                          <span className="text-2xl">📄</span>
                                        ) : (
                                          <img
                                            src="/static/placeholder.png"
                                            alt={f.original_filename}
                                            className="h-10 w-10 rounded object-cover"
                                          />
                                        )}
                                      </button>
                                      <button
                                        className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 text-[10px]"
                                        onClick={(e) => { e.stopPropagation(); deleteFile(c.id, f.id); }}
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>

                    {idx < contracts.length - 1 && (
                      <tr><td colSpan="9"><div className="border-b border-white/10" /></td></tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination für Desktop bleibt wie gehabt */}
      {totalPages > 1 && (
        <div className="hidden sm:flex items-center justify-center gap-2 mt-6">
          <button
            className="p-2 rounded hover:bg-white/10 disabled:opacity-40"
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 0}
          >
            <ChevronsLeft size={18} />
          </button>
          {pageNumbers.map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`px-3 py-1 rounded-lg ${n === page ? "bg-[var(--secondary)]" : "hover:bg-white/10"}`}
            >
              {n + 1}
            </button>
          ))}
          <button
            className="p-2 rounded hover:bg-white/10 disabled:opacity-40"
            onClick={() => setPage((p) => p + 1)}
            disabled={page === totalPages - 1}
          >
            <ChevronsRight size={18} />
          </button>
        </div>
      )}

      {/* Confirm dialog */}
      <ConfirmModal
        open={dialog.open}
        title={dialog.title}
        message={dialog.message}
        onConfirm={dialog.onConfirm}
        onClose={() => setDialog({ open: false })}
      />

      {/* Search modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="glass-card p-6 w-80 animate-pop">
            <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <Search size={18} /> Search by name
            </h3>
            <input
              className="frosted-input mb-4"
              autoFocus
              placeholder="Type a name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                className="btn-accent"
                onClick={() => {
                  setQuery("");
                  setPage(0);
                  loadPage();
                  setModalOpen(false);
                }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  setPage(0);
                  loadPage();
                  setModalOpen(false);
                }}
              >
                Search
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}