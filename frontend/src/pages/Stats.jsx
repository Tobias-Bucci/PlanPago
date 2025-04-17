// src/pages/Stats.jsx
import React, {
    useState,
    useEffect,
    useCallback,
    useMemo,
  } from "react";
  import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
  } from "recharts";
  
  const API = "http://192.168.1.150:8001/contracts/";
  
  // Farben je Vertragsart
  const TYPE_COLORS = {
    Gehalt:       "#22c55e",
    Miete:        "#ef4444",
    Streaming:    "#ec4899",
    Versicherung: "#3b82f6",
    Leasing:      "#f59e0b",
    Sonstiges:    "#6b7280",
  };
  
  export default function Stats() {
    const [contracts, setContracts] = useState([]);
    const [salary,    setSalary]    = useState(0);
    const [fixCosts,  setFixCosts]  = useState(0);
    const [available, setAvailable] = useState(0);
    const [error,     setError]     = useState("");
  
    // akt. Benutzer‑E-Mail für Währung
    const currentEmail = localStorage.getItem("currentEmail") || "";
    const currency = useMemo(
      () => localStorage.getItem(`currency_${currentEmail}`) || "€",
      [currentEmail]
    );
  
    // Auth‑Header stabil
    const authHeader = useMemo(() => {
      const token = localStorage.getItem("token");
      return { Authorization: `Bearer ${token}` };
    }, []);
  
    // Verträge + Kennzahlen
    const loadContracts = useCallback(async () => {
      try {
        const res = await fetch(API, { headers: authHeader });
        if (!res.ok) {
          setError("Fehler beim Laden der Verträge");
          return;
        }
        const data = await res.json();
        setContracts(data);
  
        // Gehalt gesamt (monatlich)
        const sal = data
          .filter((c) => c.contract_type === "Gehalt")
          .reduce((sum, c) => sum + Number(c.amount), 0);
  
        // Fixkosten (monatlich normiert)
        const fix = data
          .filter((c) => c.contract_type !== "Gehalt")
          .reduce((sum, c) => {
            const val = Number(c.amount);
            if (c.payment_interval === "monatlich") return sum + val;
            if (c.payment_interval === "jährlich")  return sum + val / 12;
            return sum;
          }, 0);
  
        setSalary(sal);
        setFixCosts(fix);
        setAvailable(sal - fix);
        setError("");
      } catch (e) {
        console.error(e);
        setError("Netzwerk‑Fehler");
      }
    }, [authHeader]);
  
    useEffect(() => {
      loadContracts();
    }, [loadContracts]);
  
    // Chart‑Daten pro Vertragsart (Monatswerte)
    const chartData = useMemo(() => {
      const map = {};
      Object.keys(TYPE_COLORS).forEach((type) => {
        map[type] = 0;
      });
      contracts.forEach((c) => {
        const val = Number(c.amount);
        let monthly = 0;
        if (
          c.contract_type === "Gehalt" ||
          c.payment_interval === "monatlich"
        ) {
          monthly = val;
        } else if (c.payment_interval === "jährlich") {
          monthly = val / 12;
        }
        const key = TYPE_COLORS[c.contract_type]
          ? c.contract_type
          : "Sonstiges";
        map[key] += monthly;
      });
      return Object.entries(map)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value }));
    }, [contracts]);
  
    // Gesamt für Prozent-Berechnung
    const total = useMemo(
      () => chartData.reduce((sum, e) => sum + e.value, 0),
      [chartData]
    );
  
    // Legend-Formatter: Name und Prozent
    const formatLegend = (value, entry) => {
      const percent = ((entry.payload.value / total) * 100).toFixed(0);
      return `${value}: ${percent}%`;
    };
  
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">Statistiken</h1>
        {error && <p className="text-red-600 mb-4">{error}</p>}
  
        {/* grid mit vertikaler Zentrierung */}
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Übersicht weiter unten */}
          <div className="bg-white shadow rounded p-6 md:mt-12">
            <h2 className="text-xl font-bold mb-4">Übersicht</h2>
            <ul className="space-y-3 text-lg">
              <li>
                <span className="font-medium">Einkommen:</span>{" "}
                {salary.toFixed(2)} {currency}
              </li>
              <li>
                <span className="font-medium">Fixkosten / Monat:</span>{" "}
                {fixCosts.toFixed(2)} {currency}
              </li>
              <li>
                <span className="font-medium">Verfügbar:</span>{" "}
                {available.toFixed(2)} {currency}
              </li>
            </ul>
          </div>
  
          {/* Donut-Chart */}
          <div className="bg-white shadow rounded p-6">
            <h2 className="text-xl font-bold mb-4">Verteilung nach Typ</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="50%"
                  outerRadius="80%"
                  paddingAngle={4}
                >
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={TYPE_COLORS[entry.name]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => `${val.toFixed(2)} ${currency}`}
                />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                  formatter={formatLegend}
                  wrapperStyle={{ paddingTop: 10, fontSize: 14 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }
  