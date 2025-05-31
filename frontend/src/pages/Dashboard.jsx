// Dashboard.jsx  –  glass-morphism edition
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
  XCircle,
  Undo2,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronFirst,
  SlidersHorizontal,
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

  /* ───── close export dropdown on outside click ───────────── */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportRef.current && !exportRef.current.contains(event.target)) {
        setExportOpen(false);
      }
    };

    if (exportOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [exportOpen]);

  /* ───── clear search filter ─────────────────────────────────── */
  const clearSearch = () => {
    setQuery("");
    setPage(0);
  };

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
    <div className="min-h-screen" style={{
      position: "relative",
      overflow: "hidden",
      background: "linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #2d3748 50%, #1a202c 75%, #0f1419 100%)"
    }}>
      {/* Flash messages - positioned above everything */}
      <div className="fixed top-4 right-4 z-[9999]">
        {msg && <Notification message={msg} type={msgType} onDone={() => setMsg("")} />}
        {err && <Notification message={err} type="error" onDone={() => setErr("")} />}
      </div>

      <main className="container mx-auto pt-24 p-6 animate-fadeIn" style={{ position: "relative", zIndex: 10 }}>

        {/* Header + action buttons - without glass card wrapper */}
        <div className="mb-8 animate-pop">
          <div className="flex flex-row items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-white mb-2">Contract Overview</h1>
              <p className="text-white/70 text-lg">
                {`Total contracts: ${total}`}
              </p>
            </div>
            <div className="flex flex-row gap-3">
              <button
                className="btn-primary flex items-center justify-center gap-2 px-6 py-3 rounded-xl"
                onClick={() => navigate("/contracts/new")}
              >
                <PlusCircle size={20} />
                <span>New Contract</span>
              </button>
              <div className="relative" ref={exportRef}>
                <button
                  className="btn-accent flex items-center justify-center gap-2 px-6 py-3 rounded-xl relative z-10"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setExportOpen((v) => !v);
                  }}
                >
                  <FileSpreadsheet size={18} strokeWidth={2} />
                  <span>Export</span>
                </button>
                {exportOpen && (
                  <div className="absolute left-full top-0 ml-2 z-[99999] min-w-[200px] animate-pop"
                    style={{
                      background: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
                    }}>
                    <div className="p-2">
                      <button
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/20 text-white rounded-lg transition-colors text-left"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setExportOpen(false);
                          try {
                            console.log('Starting CSV export...');
                            const res = await fetchWithAuth(`${API}/contracts/export/csv`, { headers: authHeader }, navigate);
                            console.log('CSV export response status:', res.status);
                            if (!res.ok) {
                              const errorText = await res.text();
                              console.error('CSV export error:', errorText);
                              throw new Error(`Export failed: ${errorText}`);
                            }
                            const blob = await res.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = Object.assign(document.createElement("a"), {
                              href: url,
                              download: "contracts.csv",
                            });
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            window.URL.revokeObjectURL(url);
                            setMsg("CSV export successful");
                            setMsgType("success");
                          } catch (e) {
                            console.error('CSV export error:', e);
                            setErr(e.message || "CSV export failed");
                          }
                        }}
                      >
                        <FileSpreadsheet size={18} strokeWidth={2} />
                        <span>Export as CSV</span>
                      </button>
                      <button
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/20 text-white rounded-lg transition-colors text-left"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setExportOpen(false);
                          try {
                            console.log('Starting PDF export...');
                            setMsg("Generating PDF export...");
                            setMsgType("info");

                            const res = await fetchWithAuth(`${API}/contracts/export/pdf`, {
                              headers: authHeader,
                              method: 'GET'
                            }, navigate);

                            console.log('PDF export response status:', res.status);
                            console.log('PDF export response headers:', Object.fromEntries(res.headers.entries()));

                            if (!res.ok) {
                              const errorText = await res.text();
                              console.error('PDF export error response:', errorText);
                              throw new Error(`PDF export failed (${res.status}): ${errorText}`);
                            }

                            const contentType = res.headers.get('content-type');
                            console.log('Content-Type:', contentType);

                            if (!contentType || !contentType.includes('application/pdf')) {
                              const responseText = await res.text();
                              console.error('Unexpected content type:', contentType, 'Response:', responseText);
                              throw new Error(`Expected PDF but got: ${contentType}`);
                            }

                            const blob = await res.blob();
                            console.log('PDF blob size:', blob.size);

                            if (blob.size === 0) {
                              throw new Error('PDF file is empty');
                            }

                            const url = window.URL.createObjectURL(blob);
                            const a = Object.assign(document.createElement("a"), {
                              href: url,
                              download: `contracts_${new Date().toISOString().split('T')[0]}.pdf`,
                            });
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            window.URL.revokeObjectURL(url);

                            setMsg("PDF export successful");
                            setMsgType("success");
                          } catch (e) {
                            console.error('PDF export error:', e);
                            setErr(e.message || "PDF export failed");
                          }
                        }}
                      >
                        <FileText size={18} strokeWidth={2} />
                        <span>Export as PDF</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 animate-pop">
          <div className="flex flex-row items-center gap-4 p-6 rounded-2xl bg-white/5 border border-white/10 relative z-[1]">
            {/* Search Section */}
            <div className="flex items-center gap-3">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white border border-white/20"
                onClick={() => setModalOpen(true)}
              >
                <Search size={18} />
                <span>Search</span>
              </button>

              {query && (
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-600/20 text-blue-300 rounded-lg text-sm border border-blue-500/30">
                  <span>"{query}"</span>
                  <button
                    onClick={clearSearch}
                    className="hover:bg-blue-600/30 rounded-full p-1 transition-colors"
                    title="Clear search"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              )}
            </div>

            <div className="block w-px h-8 bg-white/20"></div>

            <div className="flex items-center gap-3 ml-auto">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-white/70" />
                <span className="text-white/70 text-sm">Filters:</span>
              </div>

              <div className="flex flex-row gap-3 relative z-[2]">
                <div>
                  <select
                    className="frosted-input w-36 text-sm relative z-[3]"
                    value={filterType}
                    onChange={(e) => setFType(e.target.value)}
                  >
                    {TYPE_OPTIONS.map(({ label, value }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    className="frosted-input w-36 text-sm relative z-[3]"
                    value={filterStat}
                    onChange={(e) => setFStat(e.target.value)}
                  >
                    {STATUS_OPTIONS.map(({ label, value }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table/Card-List */}
        {loading ? (
          <div className="glass-card p-12 text-center animate-pop">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white/70 mb-4"></div>
            <p className="text-white/70">Loading contracts…</p>
          </div>
        ) : contracts.length === 0 ? (
          <div className="glass-card p-12 text-center animate-pop">
            <div className="text-6xl mb-4 opacity-50">📄</div>
            <p className="text-xl text-white/70 mb-2">No contracts found</p>
            <p className="text-white/50">Create your first contract to get started</p>
          </div>
        ) : (
          <div className="glass-card overflow-x-auto animate-pop">
            <table className="min-w-full text-white/90">
              <thead className="text-white uppercase text-sm bg-white/10">
                <tr>
                  <th className="px-6 py-4 text-center font-semibold">Name</th>
                  <th className="px-6 py-4 text-center font-semibold">Type</th>
                  <th className="px-6 py-4 text-center font-semibold">Interval</th>
                  <th className="px-6 py-4 text-center font-semibold">
                    <button
                      className="inline-flex items-center gap-2 hover:text-white transition-colors"
                      onClick={() => setSortDir(sortField === "start_date" ? (sortDir === "asc" ? "desc" : "asc") : "asc") || setSortField("start_date")}
                    >
                      Start Date
                      {sortField === "start_date" ? (
                        sortDir === "asc" ? <ArrowUp size={16} /> : <ArrowDown size={16} />
                      ) : (
                        <ArrowUpDown size={16} className="opacity-50" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-center font-semibold">
                    <button
                      className="inline-flex items-center gap-2 hover:text-white transition-colors"
                      onClick={() => setSortDir(sortField === "end_date" ? (sortDir === "asc" ? "desc" : "asc") : "asc") || setSortField("end_date")}
                    >
                      End Date
                      {sortField === "end_date" ? (
                        sortDir === "asc" ? <ArrowUp size={16} /> : <ArrowDown size={16} />
                      ) : (
                        <ArrowUpDown size={16} className="opacity-50" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-center font-semibold">
                    <button
                      className="inline-flex items-center gap-2 hover:text-white transition-colors"
                      onClick={() => setSortDir(sortField === "amount" ? (sortDir === "asc" ? "desc" : "asc") : "asc") || setSortField("amount")}
                    >
                      Amount
                      {sortField === "amount" ? (
                        sortDir === "asc" ? <ArrowUp size={16} /> : <ArrowDown size={16} />
                      ) : (
                        <ArrowUpDown size={16} className="opacity-50" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-center font-semibold">Status</th>
                  <th className="px-6 py-4 text-center font-semibold">Files</th>
                  <th className="px-6 py-4 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c, idx) => {
                  const end = new Date(c.end_date || "");
                  const expired = c.end_date && end < today;
                  const cancelled = c.status === "cancelled";
                  const expanded = expandedId === c.id;
                  let intervalLabel = "-";
                  if (c.payment_interval === "yearly") intervalLabel = "Yearly";
                  else if (c.payment_interval === "monthly") intervalLabel = "Monthly";
                  else if (c.payment_interval === "one-time") intervalLabel = "One-time";

                  return (
                    <React.Fragment key={c.id}>
                      <tr
                        className={`${(expired || cancelled) ? "opacity-60" : ""} hover:bg-white/5 transition-all cursor-pointer border-b border-white/10`}
                        onClick={async () => {
                          if (expandedId !== c.id) {
                            setExpandedId(c.id);
                            if (!filesCache[c.id]) await loadFilesForContract(c.id);
                          } else {
                            setExpandedId(null);
                          }
                        }}
                      >
                        <td className="px-6 py-4 text-center font-medium">{c.name}</td>
                        <td className="px-6 py-4 text-center">{TYPE_OPTIONS.find(t => t.value === c.contract_type)?.label || c.contract_type}</td>
                        <td className="px-6 py-4 text-center">{intervalLabel}</td>
                        <td className="px-6 py-4 text-center">{new Date(c.start_date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-center">{c.end_date ? end.toLocaleDateString() : "-"}</td>
                        <td className="px-6 py-4 text-center font-semibold">{c.amount} {currency}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${cancelled ? "bg-gray-600/30 text-gray-300" : expired ? "bg-red-600/30 text-red-300" : "bg-emerald-600/30 text-emerald-300"}`}>
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

        {/* Pagination - Modern floating circles */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8 mb-8 animate-pop">
            <button
              className="w-12 h-12 rounded-full backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 disabled:opacity-40 transition-all duration-300 flex items-center justify-center text-white shadow-lg hover:shadow-xl hover:scale-110"
              onClick={() => setPage(0)}
              disabled={page === 0}
              title="First page"
            >
              <ChevronFirst size={20} />
            </button>
            <button
              className="w-12 h-12 rounded-full backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 disabled:opacity-40 transition-all duration-300 flex items-center justify-center text-white shadow-lg hover:shadow-xl hover:scale-110"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 0}
              title="Previous page"
            >
              <ChevronsLeft size={18} />
            </button>

            {pageNumbers.map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-12 h-12 rounded-full backdrop-blur-md border transition-all duration-300 flex items-center justify-center font-medium shadow-lg hover:shadow-xl hover:scale-110 ${n === page
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 border-blue-400 text-white"
                  : "bg-white/10 border-white/20 text-white/80 hover:bg-white/20 hover:text-white"
                  }`}
              >
                {n + 1}
              </button>
            ))}

            <button
              className="w-12 h-12 rounded-full backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 disabled:opacity-40 transition-all duration-300 flex items-center justify-center text-white shadow-lg hover:shadow-xl hover:scale-110"
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages - 1}
              title="Next page"
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
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="glass-card p-8 w-full max-w-md mx-4 animate-pop">
              <h3 className="text-xl font-semibold mb-6 text-white flex items-center gap-3">
                <Search size={20} />
                Search Contracts
              </h3>
              <input
                className="frosted-input mb-6"
                autoFocus
                placeholder="Enter contract name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setPage(0);
                    setModalOpen(false);
                  }
                }}
              />
              <div className="flex justify-end gap-3">
                <button
                  className="btn-accent px-6 py-2"
                  onClick={() => {
                    setModalOpen(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary px-6 py-2"
                  onClick={() => {
                    setPage(0);
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

      {/* Footer */}
      <footer className="relative z-[1] border-t border-white/10 py-8">
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