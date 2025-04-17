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

export default function Dashboard() {
  const [contracts, setContracts] = useState([]);
  const [message,   setMessage]   = useState("");
  const [error,     setError]     = useState("");
  const [currency,  setCurrency]  = useState("€");
  const navigate = useNavigate();

  // stabiler Auth-Header
  const authHeader = useMemo(() => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  }, []);

  // Verträge laden
  const fetchContracts = useCallback(async () => {
    try {
      const res = await fetch(API, { headers: authHeader });
      if (!res.ok) {
        setError(
          res.status === 401
            ? "Nicht autorisiert – bitte neu anmelden."
            : "Fehler beim Laden der Verträge"
        );
        return;
      }
      setContracts(await res.json());
      setError("");
    } catch (err) {
      console.error(err);
      setError("Netzwerk-Fehler");
    }
  }, [authHeader]);

  useEffect(() => {
    const mail = localStorage.getItem("currentEmail");
    setCurrency(localStorage.getItem(`currency_${mail}`) || "€");
    fetchContracts();
  }, [fetchContracts]);

  // Vertrag löschen
  const handleDelete = async (id) => {
    if (!window.confirm("Vertrag wirklich löschen?")) return;
    try {
      const res = await fetch(`${API}${id}`, {
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
      setMessage("Netzwerk-Fehler.");
    }
  };

  const today = new Date();

  return (
    <div className="container mx-auto p-4 relative">
      {/* Neuer Vertrag Button oben rechts */}
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
      {message && <p className="text-green-600 mb-4">{message}</p>}
      {error   && <p className="text-red-600 mb-4">{error}</p>}

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
                const end      = c.end_date ? new Date(c.end_date) : null;
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
                        onClick={() => handleDelete(c.id)}
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
