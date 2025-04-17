import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";

const API = "http://192.168.1.150:8001/contracts/";
const FILE_BASE = "http://192.168.1.150:8001";      // für <img src=…>

export default function Dashboard() {
  const [contracts, setContracts] = useState([]);
  const [msg, setMsg]             = useState("");
  const [err, setErr]             = useState("");
  const [currency, setCurrency]   = useState("€");
  const navigate = useNavigate();

  const token      = localStorage.getItem("token");
  const authHeader = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  /* ── Verträge + Files ─────────────────────────────── */
  const loadContracts = useCallback(async () => {
    try {
      const r = await fetch(API, { headers: authHeader });
      if (!r.ok) {
        setErr(r.status === 401 ? "Bitte neu einloggen." : "Ladefehler");
        return;
      }
      const list = await r.json();

      /*  Bilder & PDFs pro Vertrag */
      const full = await Promise.all(
        list.map(async (c) => {
          const fr = await fetch(`${API}${c.id}/files`, { headers: authHeader });
          const files = fr.ok ? await fr.json() : [];
          return { ...c, files };
        })
      );
      setContracts(full);
      setErr("");
    } catch (e) {
      console.error(e);
      setErr("Netzwerk‑Fehler");
    }
  }, [authHeader]);

  /* ── initial ──────────────────────────────────────── */
  useEffect(() => {
    const mail = localStorage.getItem("currentEmail");
    setCurrency(localStorage.getItem(`currency_${mail}`) || "€");
    loadContracts();
  }, [loadContracts]);

  /* ── Delete ───────────────────────────────────────── */
  const delContract = async (id) => {
    if (!window.confirm("Vertrag löschen?")) return;
    const r = await fetch(`${API}${id}`, { method: "DELETE", headers: authHeader });
    if (r.ok) {
      setMsg("Vertrag gelöscht");
      loadContracts();
    } else {
      const e = await r.json();
      setMsg("Fehler: " + (e.detail || r.status));
    }
  };

  /* oberhalb von return() */
const deleteFile = async (cId, fId) => {
  if (!window.confirm("Anhang wirklich löschen?")) return;
  const r = await fetch(`${API}${cId}/files/${fId}`, {
    method: "DELETE",
    headers: authHeader,
  });
  if (r.ok) {
    setMsg("Anhang gelöscht");
    loadContracts();            // Aktualisieren
  } else {
    const e = await r.json();
    setMsg("Fehler: " + (e.detail || r.status));
  }
};

  const today = new Date();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Vertragsübersicht</h1>

      {msg  && <p className="text-green-600 mb-4">{msg}</p>}
      {err  && <p className="text-red-600 mb-4">{err}</p>}

      {contracts.length === 0 ? (
        <p>Keine Verträge.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-1 px-2 border">Name</th>
                <th className="py-1 px-2 border">Art</th>
                <th className="py-1 px-2 border">Start</th>
                <th className="py-1 px-2 border">Ende</th>
                <th className="py-1 px-2 border">Betrag</th>
                <th className="py-1 px-2 border">Status</th>
                <th className="py-1 px-2 border">Anhänge</th>
                <th className="py-1 px-2 border">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => {
                const end = c.end_date ? new Date(c.end_date) : null;
                const inactive = end && end < today;

                return (
                  <tr key={c.id} className={inactive ? "bg-gray-200" : ""}>
                    <td className="px-2 border">{c.name}</td>
                    <td className="px-2 border">{c.contract_type}</td>
                    <td className="px-2 border">
                      {new Date(c.start_date).toLocaleDateString()}
                    </td>
                    <td className="px-2 border">
                      {end ? end.toLocaleDateString() : "-"}
                    </td>
                    <td className="px-2 border">
                      {c.amount} {currency}
                    </td>
                    <td className="px-2 border">
                      {inactive ? "inactive" : c.status}
                    </td>

                    {/* Anhänge */}
                    <td className="px-2 border whitespace-nowrap">
                      {c.files.map((f) =>
                        f.mime_type.startsWith("image/") ? (
                          <span key={f.id} className="relative inline-block mr-1">
                            <a
                              href={`${FILE_BASE}${f.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <img
                                src={`${FILE_BASE}${f.url}`}
                                alt={f.original}
                                className="h-10 rounded border"
                              />
                            </a>
                            <button
                              onClick={() => deleteFile(c.id, f.id)}
                              className="absolute -top-1 -right-1 text-xs bg-red-600 text-white rounded-full w-5 h-5 leading-4"
                              title="Löschen"
                            >
                              ×
                            </button>
                          </span>
                        ) : (
                          <span key={f.id} className="inline-block mr-2 relative">
                            <a
                              href={`${FILE_BASE}${f.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline"
                              title={f.original}
                            >
                              📄
                            </a>
                            <button
                              onClick={() => deleteFile(c.id, f.id)}
                              className="absolute -top-1 -right-1 text-xs bg-red-600 text-white rounded-full w-5 h-5 leading-4"
                              title="Löschen"
                            >
                              ×
                            </button>
                          </span>
                        )
                      )}
                    </td>

                    {/* Aktionen */}
                    <td className="px-2 border">
                      <button
                        onClick={() =>
                          navigate(`/contracts/${c.id}/edit`, { state: { contract: c } })
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
