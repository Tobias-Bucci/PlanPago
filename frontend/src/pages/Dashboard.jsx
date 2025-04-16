/*  src/pages/Dashboard.jsx
    – Vertragsübersicht, Bearbeiten (PATCH) und Löschen (DELETE)
    – benötigt ein gültiges JWT in localStorage.token
*/
import { useNavigate } from "react-router-dom";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

const api = "http://192.168.1.150:8001/contracts/";

export default function Dashboard() {
  /* ─── State ───────────────────────────────────────────── */
  const [contracts, setContracts] = useState([]);
  const [message,   setMessage]   = useState("");
  const [error,     setError]     = useState("");
  const [currency,  setCurrency]  = useState("€");
  const [editModal, setEditModal] = useState(null);   // null | contract‑Objekt
  const navigate = useNavigate();

  /* ─── Auth‑Header – stabil via useMemo ────────────────── */
  const token = localStorage.getItem("token");
  const authHeader = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  /* ─── Daten laden ─────────────────────────────────────── */
  const fetchContracts = useCallback(async () => {
    try {
      const res = await fetch(api, { headers: authHeader });
      if (res.ok) {
        setContracts(await res.json());
        setError("");
      } else if (res.status === 401) {
        setError("Nicht autorisiert – bitte neu anmelden.");
      } else {
        setError("Fehler beim Laden der Verträge");
      }
    } catch (err) {
      console.error(err);
      setError("Netzwerk‑Fehler");
    }
  }, [authHeader]);

  /* ─── Initial‑Effect ──────────────────────────────────── */
  useEffect(() => {
    const mail = localStorage.getItem("currentEmail");
    if (mail) {
      setCurrency(localStorage.getItem(`currency_${mail}`) || "€");
    }
    fetchContracts();
  }, [fetchContracts]);

  /* ─── Löschen ─────────────────────────────────────────── */
  const handleDelete = async (id) => {
    if (!window.confirm("Vertrag wirklich löschen?")) return;
    try {
      const res = await fetch(`${api}${id}`, {
        method: "DELETE",
        headers: authHeader,
      });
      if (res.ok) {
        setMessage("Vertrag gelöscht!");
        fetchContracts();
      } else {
        const err = await res.json();
        setMessage("Löschen fehlgeschlagen: " + (err.detail || res.status));
      }
    } catch (err) {
      console.error(err);
      setMessage("Netzwerk‑Fehler.");
    }
  };

  /* ─── Bearbeiten ──────────────────────────────────────── */
  const openEdit  = (c) => setEditModal({ ...c });   // Kopie
  const closeEdit = () => setEditModal(null);

  const handleUpdate = async () => {
    if (!editModal) return;
    const { id, ...payload } = editModal;
    /* nur geänderte Felder → exclude null/undefined */
    const body = Object.fromEntries(
      Object.entries(payload).filter(([, v]) => v !== undefined && v !== null)
    );

    try {
      const res = await fetch(`${api}${id}`, {
        method: "PATCH",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setMessage("Vertrag aktualisiert!");
        closeEdit();
        fetchContracts();
      } else {
        const err = await res.json();
        setMessage("Update‑Fehler: " + (err.detail || res.status));
      }
    } catch (err) {
      console.error(err);
      setMessage("Netzwerk‑Fehler.");
    }
  };

  /* ─── Render ──────────────────────────────────────────── */
  const today = new Date();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Vertragsübersicht</h1>

      {message && <p className="text-green-600 mb-4">{message}</p>}
      {error   && <p className="text-red-600 mb-4">{error}</p>}

      {/* Tabelle */}
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
                <th className="py-2 px-4 border">Intervall</th>
                <th className="py-2 px-4 border">Status</th>
                <th className="py-2 px-4 border">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => {
                const end = c.end_date ? new Date(c.end_date) : null;
                const inactive = end && end < today;

                return (
                  <tr key={c.id} className={inactive ? "bg-gray-200" : ""}>
                    <td className="py-2 px-4 border">{c.name}</td>
                    <td className="py-2 px-4 border">{c.contract_type}</td>
                    <td className="py-2 px-4 border">
                      {new Date(c.start_date).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-4 border">
                      {end ? end.toLocaleDateString() : "-"}
                    </td>
                    <td className="py-2 px-4 border">
                      {c.amount} {currency}
                    </td>
                    <td className="py-2 px-4 border">{c.payment_interval}</td>
                    <td className="py-2 px-4 border">
                      {inactive ? "inactive" : c.status}
                    </td>
                    <td className="py-2 px-4 border text-center">
                      {/* Löschen */}
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-red-600 hover:text-red-800 mr-2"
                        title="Vertrag löschen"
                      >
                        🗑️
                      </button>
                      {/* Bearbeiten */}
                      <button
                        onClick={() => navigate(`/contracts/${c.id}/edit`, { state: { contract: c } })}
                        className="text-blue-600 hover:text-blue-800"
                        title="Vertrag bearbeiten"
                      >
                        ✏️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="text-sm text-gray-600 mt-2">
            Verträge mit abgelaufenem Enddatum werden als „inactive“ angezeigt.
          </p>
        </div>
      )}

      {/* ─── Modal zum Bearbeiten ───────────────────────── */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 grid place-items-center z-50">
          <div className="bg-white p-4 rounded w-96 shadow-lg">
            <h3 className="text-xl font-bold mb-3">Vertrag bearbeiten</h3>

            <label className="block text-sm font-medium">Name</label>
            <input
              className="w-full border p-1 mb-3"
              value={editModal.name}
              onChange={(e) =>
                setEditModal({ ...editModal, name: e.target.value })
              }
            />

            <label className="block text-sm font-medium">Notizen</label>
            <textarea
              className="w-full border p-1 mb-3"
              value={editModal.notes || ""}
              onChange={(e) =>
                setEditModal({ ...editModal, notes: e.target.value })
              }
            />

            <label className="block text-sm font-medium">
              Betrag ({currency})
            </label>
            <input
              type="number"
              className="w-full border p-1 mb-4"
              value={editModal.amount}
              onChange={(e) =>
                setEditModal({
                  ...editModal,
                  amount: Number(e.target.value),
                })
              }
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={closeEdit}
                className="px-3 py-1 bg-gray-300 rounded"
              >
                Abbrechen
              </button>
              <button
                onClick={handleUpdate}
                className="px-3 py-1 bg-blue-600 text-white rounded"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
