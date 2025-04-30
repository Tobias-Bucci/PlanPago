import { API_BASE } from "../config";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlusCircle,
  Edit3,
  Trash2,
  ChevronsLeft,
  ChevronsRight,
  Search,
} from "lucide-react";
import ConfirmModal from "../components/ConfirmModal";

/* ───────── constants ─────────────────────────────────────────── */
const PAGE_SIZE = 10;

/* label → value (English UI, English keyword for API) */
const TYPE_OPTIONS = [
  { label: "All types", value: "" },
  { label: "Rent", value: "rent" },
  { label: "Insurance", value: "insurance" },
  { label: "Streaming", value: "streaming" },
  { label: "Salary", value: "salary" },
  { label: "Leasing", value: "leasing" },
  { label: "Other", value: "other" },
];

const STATUS_OPTIONS = [
  { label: "Any status", value: "" },
  { label: "Active", value: "active" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Expired", value: "expired" },
];

/* ───────── component ────────────────────────────────────────── */
export default function Dashboard() {
  /* main data */
  const [contracts, setContracts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);

  /* filters & search */
  const [query, setQuery] = useState("");
  const [filterType, setFType] = useState("");
  const [filterStat, setFStat] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  /* misc UI */
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLd] = useState(true);
  const [dialog, setDialog] = useState({ open: false });
  const [expandedId, setExpandedId] = useState(null);

  const navigate = useNavigate();
  const API = API_BASE;
  const authHeader = useMemo(
    () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` }),
    []
  );
  const currency =
    localStorage.getItem(
      `currency_${localStorage.getItem("currentEmail")}`
    ) || "€";

  /* ───── fetch & enrich page of contracts ───────────────────── */
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

      const r = await fetch(`${API}/contracts/?${p.toString()}`, {
        headers: authHeader,
      });
      if (!r.ok) throw new Error(await r.text());
      const { items, total } = await r.json();

      /* fetch attachments for visible rows only */
      const withFiles = await Promise.all(
        items.map(async (c) => {
          const fr = await fetch(`${API}/contracts/${c.id}/files`, {
            headers: authHeader,
          });
          const files = fr.ok ? await fr.json() : [];
          return { ...c, files };
        })
      );
      setContracts(withFiles);
      setTotal(total);
    } catch (e) {
      setErr(e.message || "Loading error");
    } finally {
      setLd(false);
    }
  }, [API, authHeader, page, query, filterType, filterStat]);

  /* initial load + all dependencies */
  useEffect(() => {
    loadPage();
  }, [loadPage]);

  /* instant reload when the user types into the search box */
  useEffect(() => {
    setPage(0);          // jump back to first page
    loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filterType, filterStat]);

  /* ───── deletion helpers ───────────────────────────────────── */
  const reallyDeleteContract = async (id) => {
    try {
      const r = await fetch(`${API}/contracts/${id}`, {
        method: "DELETE",
        headers: authHeader,
      });
      if (!r.ok) throw new Error("Deletion failed");
      setMsg("Contract deleted");
      loadPage();
    } catch (e) {
      setErr(e.message);
    }
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
      const r = await fetch(`${API}/contracts/${cid}/files/${fid}`, {
        method: "DELETE",
        headers: authHeader,
      });
      if (!r.ok) throw new Error("Attachment could not be deleted");
      setMsg("Attachment deleted");
      loadPage();
    } catch (e) {
      setErr(e.message);
    }
  };
  const deleteFile = (cid, fid) =>
    setDialog({
      open: true,
      title: "Delete attachment?",
      message: "The file will be removed permanently.",
      onConfirm: () => reallyDeleteFile(cid, fid),
    });

  /* ───── pagination helpers ─────────────────────────────────── */
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) return [...Array(totalPages).keys()];
    const start = Math.max(0, Math.min(page - 2, totalPages - 5));
    return [0, 1, 2, 3, 4].map((i) => i + start);
  }, [page, totalPages]);

  const today = new Date();

  /* ───── JSX ────────────────────────────────────────────────── */
  return (
    <main className="container mx-auto pt-24 p-6 animate-fadeIn">
      {/* header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold text-white">Overview</h1>
        <button
          className="btn-accent rounded-full p-3"
          title="New contract"
          onClick={() => navigate("/contracts/new")}
        >
          <PlusCircle size={24} />
        </button>
      </div>

      {/* filters */}
      <div className="glass-card p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <button
          className="btn-primary flex items-center gap-2 sm:w-auto"
          onClick={() => setModalOpen(true)}
        >
          <Search size={18} />
          Search
        </button>

        <select
          className="frosted-input sm:w-40"
          value={filterType}
          onChange={(e) => setFType(e.target.value)}
        >
          {TYPE_OPTIONS.map(({ label, value }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          className="frosted-input sm:w-40"
          value={filterStat}
          onChange={(e) => setFStat(e.target.value)}
        >
          {STATUS_OPTIONS.map(({ label, value }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* flash messages */}
      {msg && <div className="glass-card mb-4 p-3 text-emerald-200">{msg}</div>}
      {err && <div className="glass-card mb-4 p-3 text-red-300">{err}</div>}

      {/* table */}
      {loading ? (
        <p className="text-center py-10 text-white/70">Loading contracts…</p>
      ) : contracts.length === 0 ? (
        <p className="text-center py-10 text-white/70">No contracts found.</p>
      ) : (
        <div className="glass-card overflow-x-auto">
          <table className="min-w-full text-white/90">
            <thead className="text-white uppercase text-sm bg-white/10">
              <tr>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Type</th>
                <th className="px-6 py-3 text-left">Start</th>
                <th className="px-6 py-3 text-left">End</th>
                <th className="px-6 py-3 text-left">Amount</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Files</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c, idx) => {
                const end = new Date(c.end_date || "");
                const expired = c.end_date && end < today;
                const isExpanded = expandedId === c.id;
                return (
                  <React.Fragment key={c.id}>
                    <tr
                      className={
                        (expired ? "opacity-50 " : "") +
                        "hover:bg-white/10 transition cursor-pointer"
                      }
                      onClick={() => setExpandedId(isExpanded ? null : c.id)}
                    >
                      <td className="px-6 py-4">{c.name}</td>
                      <td className="px-6 py-4">{c.contract_type}</td>
                      <td className="px-6 py-4">
                        {new Date(c.start_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        {c.end_date ? end.toLocaleDateString() : "-"}
                      </td>
                      <td className="px-6 py-4">
                        {c.amount} {currency}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={expired ? "text-red-400" : "text-emerald-300"}
                        >
                          {expired ? "Expired" : c.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex flex-wrap gap-2">
                        {c.files.map((f) => (
                          <div key={f.id} className="relative">
                            <a
                              href={`${API}${f.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {f.url.endsWith(".pdf") ? (
                                <span className="text-2xl">📄</span>
                              ) : (
                                <img
                                  src={`${API}${f.url}`}
                                  alt={f.original_filename}
                                  className="h-10 w-10 rounded object-cover"
                                />
                              )}
                            </a>
                            <button
                              className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 text-[10px]"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteFile(c.id, f.id);
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </td>
                      <td className="px-6 py-4 text-center space-x-2">
                        <button
                          className="btn-primary p-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/contracts/${c.id}/edit`, {
                              state: { contract: c },
                            });
                          }}
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          className="btn-accent bg-red-600 hover:bg-red-700 p-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteContract(c.id);
                          }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                    {/* Notes row with animation */}
                    <tr>
                      <td colSpan="8" style={{ padding: 0, border: 0 }}>
                        <div
                          className={`contract-notes-transition ${
                            isExpanded ? "open" : ""
                          }`}
                          style={{
                            maxHeight: isExpanded ? 120 : 0,
                            opacity: isExpanded ? 1 : 0,
                            overflow: "hidden",
                            transition:
                              "max-height 0.35s cubic-bezier(.4,2,.6,1), opacity 0.25s",
                          }}
                        >
                          {isExpanded && (
                            <div className="p-6 bg-white/5 border-t border-white/10 animate-pop text-white/90">
                              <div className="font-semibold mb-1">Notes</div>
                              <div className="whitespace-pre-line text-white/80 min-h-[1.5em]">
                                {c.notes ? (
                                  c.notes
                                ) : (
                                  <span className="italic text-white/40">
                                    No notes entered.
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                    {idx < contracts.length - 1 && (
                      <tr>
                        <td colSpan="8">
                          <div className="border-b border-white/10" />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
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
              className={`px-3 py-1 rounded-lg ${
                n === page ? "bg-[var(--secondary)]" : "hover:bg-white/10"
              }`}
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

      {/* Confirm dialog (reuse component) */}
      <ConfirmModal
        open={dialog.open}
        title={dialog.title}
        message={dialog.message}
        onConfirm={dialog.onConfirm}
        onClose={() => setDialog({ open: false })}
      />

      {/* Search-Modal */}
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