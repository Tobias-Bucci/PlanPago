import { API_BASE } from "../config";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Edit3, Trash2 } from "lucide-react";

export default function Dashboard() {
  const [contracts, setContracts] = useState([]);
  const [msg, setMsg]             = useState("");
  const [err, setErr]             = useState("");
  const [loading, setLoading]     = useState(true);
  const [currency, setCurrency]   = useState("€");
  const navigate = useNavigate();

  const API = API_BASE;
  const authHeader = useMemo(() => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  }, []);

  /* load contracts & files */
  const loadContracts = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`${API}/contracts/`, { headers: authHeader });
      if (!res.ok) throw new Error("Error loading contracts");
      const list = await res.json();
      const withFiles = await Promise.all(
        list.map(async (c) => {
          const fr = await fetch(
            `${API}/contracts/${c.id}/files`,
            { headers: authHeader }
          );
          const files = fr.ok ? await fr.json() : [];
          return { ...c, files };
        })
      );
      setContracts(withFiles);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [API, authHeader]);

  /* first mount */
  useEffect(() => {
    const mail = localStorage.getItem("currentEmail");
    setCurrency(localStorage.getItem(`currency_${mail}`) || "€");
    loadContracts();
  }, [loadContracts]);

  /* delete contract or file */
  const deleteContract = async (id) => {
    if (!window.confirm("Delete this contract permanently?")) return;
    try {
      const res = await fetch(`${API}/contracts/${id}`, {
        method: "DELETE",
        headers: authHeader,
      });
      if (!res.ok) throw new Error("Deletion failed.");
      setMsg("Contract deleted.");
      loadContracts();
    } catch (e) {
      setErr(e.message);
    }
  };

  const deleteFile = async (contractId, fileId) => {
    if (!window.confirm("Delete this attachment?")) return;
    try {
      const res = await fetch(
        `${API}/contracts/${contractId}/files/${fileId}`,
        {
          method: "DELETE",
          headers: authHeader,
        }
      );
      if (!res.ok) throw new Error("Attachment could not be deleted.");
      setMsg("Attachment deleted.");
      loadContracts();
    } catch (e) {
      setErr(e.message);
    }
  };

  const today = new Date();

  return (
    <main className="container mx-auto p-6 animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold">Overview</h1>
        <button
          onClick={() => navigate("/contracts/new")}
          className="p-3 bg-accent text-white rounded-full shadow-lg hover:bg-accent-dark transition-colors"
          title="New contract"
        >
          <PlusCircle size={24} />
        </button>
      </div>

      {msg && (
        <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg shadow">
          {msg}
        </div>
      )}
      {err && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg shadow">
          {err}
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading contracts…</div>
      ) : contracts.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No contracts available.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
          <table className="min-w-full">
            <thead className="bg-primary text-white">
              <tr>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Type</th>
                <th className="px-6 py-3 text-left">Start</th>
                <th className="px-6 py-3 text-left">End</th>
                <th className="px-6 py-3 text-left">Amount</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Attachments</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c, idx) => {
                const end        = c.end_date ? new Date(c.end_date) : null;
                const isExpired  = end && end < today;
                const statusText = isExpired ? "Expired" : c.status;
                const statusCls  = isExpired ? "text-red-600" : "text-green-600";
                const rowCls     = isExpired
                  ? "opacity-50"
                  : "hover:bg-gray-100 transition-colors";

                return (
                  <React.Fragment key={c.id}>
                    <tr className={rowCls}>
                      <td className="px-6 py-4">{c.name}</td>
                      <td className="px-6 py-4">{c.contract_type}</td>
                      <td className="px-6 py-4">
                        {new Date(c.start_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        {end ? end.toLocaleDateString() : "-"}
                      </td>
                      <td className="px-6 py-4">
                        {c.amount} {currency}
                      </td>
                      <td className={`px-6 py-4 font-medium ${statusCls}`}>
                        {statusText}
                      </td>
                      <td className="px-6 py-4 flex flex-wrap gap-2">
                        {c.files.map((f) => (
                          <div key={f.id} className="relative inline-block">
                            <a
                              href={`${API}${f.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block"
                            >
                              {f.url.endsWith(".pdf") ? (
                                <span className="text-gray-600 text-2xl">📄</span>
                              ) : (
                                <img
                                  src={`${API}${f.url}`}
                                  alt={f.original_filename}
                                  className="h-10 w-10 rounded-lg shadow-sm object-cover"
                                />
                              )}
                            </a>
                            <button
                              onClick={() => deleteFile(c.id, f.id)}
                              className="absolute -top-1 -right-0.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                              title="Delete attachment"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </td>
                      <td className="px-6 py-4 text-center space-x-2">
                        <button
                          onClick={() =>
                            navigate(`/contracts/${c.id}/edit`, {
                              state: { contract: c },
                            })
                          }
                          className="p-2 bg-primary-light text-white rounded-lg hover:bg-primary transition-colors"
                          title="Edit"
                        >
                          <Edit3 size={20} />
                        </button>
                        <button
                          onClick={() => deleteContract(c.id)}
                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={20} />
                        </button>
                      </td>
                    </tr>
                    {idx < contracts.length - 1 && (
                      <tr>
                        <td colSpan="8" className="px-6">
                          <div className="border-b border-gray-200" />
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
    </main>
  );
}
