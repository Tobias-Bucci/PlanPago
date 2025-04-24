import { API_BASE } from "../config";
import React, { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

/* German contract-types remain keys for colours & backend */
const TYPE_COLORS = {
  Gehalt:       "#10B981",
  Miete:        "#EF4444",
  Streaming:    "#EC4899",
  Versicherung: "#3B82F6",
  Leasing:      "#F59E0B",
  Sonstiges:    "#6B7280",
};

/* map DE → EN for legend display */
const TYPE_LABEL = {
  Gehalt: "Salary",
  Miete: "Rent",
  Streaming: "Streaming",
  Versicherung: "Insurance",
  Leasing: "Leasing",
  Sonstiges: "Others",
};

export default function Stats() {
  const [contracts, setContracts] = useState([]);
  const [salary,    setSalary]    = useState(0);
  const [fixCosts,  setFixCosts]  = useState(0);
  const [available, setAvailable] = useState(0);
  const [error,     setError]     = useState("");
  const [loading,   setLoading]   = useState(true);

  const API = API_BASE;
  const authHeader = useMemo(() => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");

      try {
        const now = new Date();
        const res = await fetch(`${API}/contracts/`, { headers: authHeader });
        if (!res.ok) throw new Error("Error loading data");
        let data = await res.json();

        /* only active contracts */
        data = data.filter((c) => !c.end_date || new Date(c.end_date) >= now);
        setContracts(data);

        /* salary sum */
        const sal = data
          .filter((c) => c.contract_type === "Gehalt")
          .reduce((sum, c) => sum + Number(c.amount), 0);

        /* fixed costs */
        const fix = data.reduce((sum, c) => {
          if (c.contract_type === "Gehalt") return sum;
          const val = Number(c.amount);
          if (c.payment_interval === "monatlich") return sum + val;
          if (c.payment_interval === "jährlich") return sum + val / 12;
          return sum;
        }, 0);

        setSalary(sal);
        setFixCosts(fix);
        setAvailable(sal - fix);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [API, authHeader]);

  /* prepare chart */
  const chartData = useMemo(() => {
    const map = Object.fromEntries(Object.keys(TYPE_COLORS).map((t) => [t, 0]));
    contracts.forEach((c) => {
      let monthly = Number(c.amount);
      if (c.contract_type !== "Gehalt" && c.payment_interval === "jährlich") {
        monthly /= 12;
      }
      const key = TYPE_COLORS[c.contract_type] ? c.contract_type : "Sonstiges";
      map[key] += monthly;
    });
    return Object.entries(map)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [contracts]);

  const total = chartData.reduce((sum, e) => sum + e.value, 0);
  const formatLegend = (val, entry) =>
    `${TYPE_LABEL[val]}: ${((entry.payload.value / total) * 100).toFixed(0)}%`;

  const currentEmail = localStorage.getItem("currentEmail") || "";
  const currency = localStorage.getItem(`currency_${currentEmail}`) || "€";

  return (
    <main className="container mx-auto p-6 animate-fadeIn">
      <h1 className="text-3xl font-semibold mb-6">Statistics</h1>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading data…</div>
      ) : error ? (
        <div className="p-4 bg-red-100 text-red-800 rounded-lg shadow">
          {error}
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Overview */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-medium mb-4">Overview</h2>
            <ul className="space-y-2 text-lg">
              <li>
                <span className="font-semibold">Income:</span>{" "}
                {salary.toFixed(2)} {currency}
              </li>
              <li>
                <span className="font-semibold">Fixed costs / month:</span>{" "}
                {fixCosts.toFixed(2)} {currency}
              </li>
              <li>
                <span className="font-semibold">Available:</span>{" "}
                {available.toFixed(2)} {currency}
              </li>
            </ul>
          </div>

          {/* Donut */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-medium mb-4">Distribution by type</h2>
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
                  paddingAngle={6}
                >
                  {chartData.map((e) => (
                    <Cell key={e.name} fill={TYPE_COLORS[e.name]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${v.toFixed(2)} ${currency}`} />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                  formatter={formatLegend}
                  wrapperStyle={{ paddingTop: 10 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </main>
  );
}
