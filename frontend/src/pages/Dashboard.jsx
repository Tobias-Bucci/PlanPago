// src/pages/Dashboard.jsx
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle } from "lucide-react";

const API = "http://192.168.1.150:8001/contracts/";
const FILE_BASE = "http://192.168.1.150:8001"; // for <img src=…>

export default function Dashboard() {
  const [contracts, setContracts] = useState([]);
  const [msg, setMsg]             = useState("");
  const [err, setErr]             = useState("");
  const [currency, setCurrency]   = useState("€");
  const navigate = useNavigate();

  const authHeader = useMemo(() => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  }, []);

  const loadContracts = useCallback(async () => {
    try {
      const res = await fetch(API, { headers: authHeader });
      if (!res.ok) {
        setErr(
          res.status === 401
            ? "Nicht autorisiert – bitte neu anmelden."
            : "Fehler beim Laden der Verträge."
        );
        return;
      }
      const list = await res.json();
      // fetch files per contract
      const withFiles = await Promise.all(
        list.map(async (c) => {
          const fr = await fetch(`${API}${c.id}/files`, { headers: authHeader });
          const files = fr.ok ? await fr.json() : [];
          return { ...c, files };
        })
      );
      setContracts(withFiles);
      setErr("");
    } catch (e) {
      console.error(e);
      setErr("Netzwerk‑Fehler beim Laden der Verträge.");
    }
  }, [authHeader]);

  useEffect(() => {
    const mail = localStorage.getItem("currentEmail");
    setCurrency(localStorage.getItem(`currency_${mail}`) || "€");
    loadContracts();
  }, [loadContracts]);

  const delContract = async (id) => {
    if (!window.confirm("Vertrag wirklich löschen?")) return;
    const res = await fetch(`${API}${id}`, {
      method: "DELETE",
      headers: authHeader,
    });
    if (res.ok) {
      setMsg("Vertrag gelöscht");
      loadContracts();
    } else {
      const e = await res.json();
      setMsg("Fehler: " + (e.detail || res.status));
    }
  };

  const deleteFile = async (contractId, fileId) => {
    if (!window.confirm("Anhang wirklich löschen?")) return;
    const res = await fetch(`${API}${contractId}/files/${fileId}`, {
      method: "DELETE",
      headers: authHeader,
    });
    if (res.ok) {
      setMsg("Anhang gelöscht");
      loadContracts();
    } else {
      const e = await res.json();
      setMsg("Fehler: " + (e.detail || res.status));
    }
  };

  const today = new Date();

  return (
    <div className="container mx-auto p-4 relative">
      {/* New‑contract button in top‑right */}
      <button
        onClick={() => navigate("/contracts/new")}
        className="
          absolute top-2 right-5
          bg-green-500 text-white
          rounded-full
          w-10 h-10
          flex items-center justify-center
        "
        title="Neuer Vertrag"
      >
        <PlusCircle size={25} strokeWidth={2} />
      </button>

      <h1 className="text-3xl font-bold mb-4">Vertragsübersicht</h1>
      {msg && <p className="text-green-600 mb-4">{msg}</p>}
      {err && <p className="text-red-600 mb-4">{err}</p>}

      {contracts.length === 0 ? (
        <p>Keine Verträge gefunden.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border">Name</th>
                <th className="py-2 px-4 border">Art</th>
                <th className="py-2 px-4 border">Start</th>
                <th className="py-2 px-4 border">Ende</th>
                <th className="py-2 px-4 border">Betrag</th>
                <th className="py-2 px-4 border">Status</th>
                <th className="py-2 px-4 border">Anhänge</th>
                <th className="py-2 px-4 border">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => {
                const end = c.end_date ? new Date(c.end_date) : null;
                const inactive = end && end < today;
                return (
                  <tr key={c.id} className={inactive ? "bg-gray-200" : ""}>
                    <td className="px-4 border">{c.name}</td>
                    <td className="px-4 border">{c.contract_type}</td>
                    <td className="px-4 border">
                      {new Date(c.start_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 border">
                      {end ? end.toLocaleDateString() : "-"}
                    </td>
                    <td className="px-4 border">
                      {c.amount} {currency}
                    </td>
                    <td className="px-4 border">{c.status}</td>
                    <td className="px-4 border">
                      {c.files.map((f) => {
                        const isImage = f.mime_type?.startsWith("image/");
                        return (
                          <span
                            key={f.id}
                            className="relative inline-block mr-2"
                          >
                            <a
                              href={`${FILE_BASE}${f.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={isImage ? "" : "text-blue-600 underline"}
                              title={f.original}
                            >
                              {isImage ? (
                                <img
                                  src={`${FILE_BASE}${f.url}`}
                                  alt={f.original}
                                  className="h-12 rounded border"
                                />
                              ) : (
                                "📄"
                              )}
                            </a>
                            <button
                              onClick={() => deleteFile(c.id, f.id)}
                              className="absolute -top-0.5 -right-1.5 bg-red-600 text-white text-[10px] rounded-full w-3 h-3 flex items-center justify-center"
                              title="Löschen"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </td>
                    <td className="px-4 border">
                      <button
                        onClick={() =>
                          navigate(`/contracts/${c.id}/edit`, {
                            state: { contract: c },
                          })
                        }
                        className="text-blue-600 mr-2"
                        title="Bearbeiten"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => delContract(c.id)}
                        className="text-red-600"
                        title="Löschen"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
