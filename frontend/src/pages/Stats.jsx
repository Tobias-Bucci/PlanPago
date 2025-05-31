// Stats.jsx – alle Charts & Upcoming payments immer anzeigen
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
import { TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";

import Card from "../components/Card";
import KPI from "../components/KPI";
import Notification from "../components/Notification";
import { upcomingPayments } from "../utils/statsHelpers";
import { authCookies } from "../utils/cookieUtils";

/* Color map & Glass tooltip style */
const TYPE_COLORS = {
  rent: "#EF4444",
  streaming: "#EC4899",
  insurance: "#3B82F6",
  leasing: "#F59E0B",
  salary: "#10B981",
  other: "#6B7280",
};

const glassTooltipStyle = {
  background: "rgba(255,255,255,.08)",
  backdropFilter: "blur(10px) saturate(180%)",
  border: "1px solid rgba(255,255,255,.25)",
  color: "#fff",
  borderRadius: "0.75rem",
  fontSize: "0.85rem",
  padding: "0.4rem 0.6rem",
};

export default function Stats() {
  const authHeader = useMemo(
    () => ({ Authorization: `Bearer ${authCookies.getToken()}` }),
    []
  );

  const [contracts, setContracts] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLd] = useState(true);
  const [msg, setMsg] = useState("");
  const [msgType] = useState("success");

  const API = API_BASE;
  const currency =
    localStorage.getItem(
      `currency_${localStorage.getItem("currentEmail")}`
    ) || "€";

  /* Load contracts (limit=100) */
  useEffect(() => {
    (async () => {
      try {
        setLd(true);
        const r = await fetch(`${API}/contracts/?limit=100`, {
          headers: authHeader,
        });
        if (!r.ok) throw new Error(await r.text());
        const raw = await r.json();
        setContracts(Array.isArray(raw) ? raw : raw.items);
      } catch (e) {
        setErr(e.message || "Unknown error");
      } finally {
        setLd(false);
      }
    })();
  }, [API, authHeader]);

  /* KPI calculation */
  const kpi = useMemo(() => {
    const activeContracts = contracts.filter(c => c.status !== "expired" && c.status !== "cancelled");
    const income = activeContracts
      .filter((c) => c.contract_type === "salary")
      .reduce((s, c) => {
        const yearly = c.payment_interval === "yearly";
        return s + Number(c.amount) / (yearly ? 12 : 1);
      }, 0);
    const expenses = activeContracts
      .filter((c) => c.contract_type !== "salary")
      .reduce((s, c) => {
        const yearly = c.payment_interval === "yearly";
        return s + Number(c.amount) / (yearly ? 12 : 1);
      }, 0);
    const available = income - expenses;
    const savingRate = income ? (available / income) * 100 : 0;
    return { income, expenses, available, savingRate };
  }, [contracts]);

  /* Expense donut (monthly) */
  const expenseData = useMemo(() => {
    const map = Object.fromEntries(
      Object.keys(TYPE_COLORS).filter(k => k !== 'salary').map((k) => [k, 0])
    );
    contracts
      .filter((c) => c.contract_type !== "salary" && c.status !== "expired" && c.status !== "cancelled")
      .forEach((c) => {
        const yearly = c.payment_interval === "yearly";
        const v = Number(c.amount) / (yearly ? 12 : 1);
        const key = TYPE_COLORS[c.contract_type]
          ? c.contract_type
          : "other";
        map[key] += v;
      });
    return Object.entries(map)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
      }));
  }, [contracts]);
  const expenseTotal = expenseData.reduce((s, e) => s + e.value, 0);

  /* Income donut (monthly) */
  const incomeData = useMemo(() => {
    const map = {};
    contracts
      .filter((c) => c.contract_type === "salary" && c.status !== "expired" && c.status !== "cancelled")
      .forEach((c) => {
        const yearly = c.payment_interval === "yearly";
        const v = Number(c.amount) / (yearly ? 12 : 1);
        map[c.name] = (map[c.name] || 0) + v;
      });
    return Object.entries(map)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [contracts]);
  const incomeTotal = incomeData.reduce((s, e) => s + e.value, 0);

  /* Upcoming payments */
  const upcoming = useMemo(() => upcomingPayments(contracts), [contracts]);
  const upcomingExpenses = useMemo(() =>
    upcoming.reduce((s, x) => s + (x.type !== 'salary' ? x.amount : 0), 0),
    [upcoming]
  );

  if (loading) {
    return (
      <div className="min-h-screen" style={{
        background: "linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #2d3748 50%, #1a202c 75%, #0f1419 100%)"
      }}>
        <main className="container mx-auto pt-24 p-6">
          <div className="glass-card p-12 text-center animate-pop">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white/70 mb-4"></div>
            <p className="text-white/70">Loading statistics…</p>
          </div>
        </main>
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen" style={{
        background: "linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #2d3748 50%, #1a202c 75%, #0f1419 100%)"
      }}>
        <div className="fixed top-4 right-4 z-[9999]">
          <Notification message={err} type="error" onDone={() => setErr("")} />
        </div>
        <main className="container mx-auto pt-24 p-6">
          <div className="glass-card p-12 text-center animate-pop">
            <div className="text-6xl mb-4 opacity-50">⚠️</div>
            <p className="text-xl text-white/70 mb-2">Error loading statistics</p>
            <p className="text-white/50">{err}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{
      position: "relative",
      overflow: "hidden",
      background: "linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #2d3748 50%, #1a202c 75%, #0f1419 100%)"
    }}>
      {/* Flash messages */}
      <div className="fixed top-4 right-4 z-[9999]">
        {msg && <Notification message={msg} type={msgType} onDone={() => setMsg("")} />}
        {err && <Notification message={err} type="error" onDone={() => setErr("")} />}
      </div>

      <main className="container mx-auto pt-24 p-6 animate-fadeIn space-y-8" style={{ position: "relative", zIndex: 10 }}>

        {/* Header */}
        <div className="mb-8 animate-pop">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-white mb-2 flex items-center gap-3">
                <TrendingUp size={32} className="text-blue-400" />
                Financial Statistics
              </h1>
              <p className="text-white/70 text-lg">
                Overview of your income, expenses, and financial health
              </p>
            </div>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pop">
          <KPI
            label="Monthly Income"
            value={kpi.income.toFixed(2)}
            postfix={` ${currency}`}
            color="emerald"
          />
          <KPI
            label="Monthly Expenses"
            value={kpi.expenses.toFixed(2)}
            postfix={` ${currency}`}
            color="rose"
          />
          <KPI
            label="Available Budget"
            value={kpi.available.toFixed(2)}
            postfix={` ${currency}`}
            color={kpi.available >= 0 ? "emerald" : "rose"}
          />
          <KPI
            label="Savings Rate"
            value={kpi.savingRate.toFixed(0)}
            postfix="%"
            color="sky"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pop">

          {/* Expense Breakdown */}
          <Card title="Monthly Expense Breakdown">
            {expenseData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseData}
                    dataKey="value"
                    innerRadius="55%"
                    outerRadius="85%"
                    paddingAngle={3}
                  >
                    {expenseData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={TYPE_COLORS[entry.name.toLowerCase()] || TYPE_COLORS.other}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value.toFixed(2)} ${currency}`, 'Amount']}
                    contentStyle={glassTooltipStyle}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => {
                      const item = expenseData.find((x) => x.name === value);
                      const pct = expenseTotal > 0 ? ((item.value / expenseTotal) * 100).toFixed(0) : 0;
                      return `${value} (${pct}%)`;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-white/70">
                <DollarSign size={48} className="mb-4 opacity-50" />
                <p className="text-lg">No expense data available</p>
                <p className="text-sm opacity-70">Add some contracts to see your expense breakdown</p>
              </div>
            )}
          </Card>

          {/* Income Sources */}
          <Card title="Monthly Income Sources">
            {incomeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={incomeData}
                    dataKey="value"
                    innerRadius="55%"
                    outerRadius="85%"
                    paddingAngle={3}
                    fill="#10B981"
                  >
                    {incomeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#10B981" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value.toFixed(2)} ${currency}`, 'Amount']}
                    contentStyle={glassTooltipStyle}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => {
                      const item = incomeData.find((x) => x.name === value);
                      const pct = incomeTotal > 0 ? ((item.value / incomeTotal) * 100).toFixed(0) : 0;
                      return `${value} (${pct}%)`;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-white/70">
                <TrendingUp size={48} className="mb-4 opacity-50" />
                <p className="text-lg">No income data available</p>
                <p className="text-sm opacity-70">Add salary contracts to see your income sources</p>
              </div>
            )}
          </Card>
        </div>

        {/* Upcoming Payments */}
        <Card title="Upcoming Payments (Next 30 Days)" className="animate-pop">
          {upcoming.length > 0 ? (
            <div className="space-y-4">
              <div className="divide-y divide-white/10">
                {upcoming.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between py-4 text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-white/60" />
                        <span className="font-mono text-white/80 w-20">
                          {payment.date.toLocaleDateString(undefined, { day: "2-digit", month: "short" })}
                        </span>
                      </div>
                      <span className="text-white font-medium">{payment.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {payment.type === 'salary' ? (
                        <TrendingUp size={16} className="text-emerald-400" />
                      ) : (
                        <TrendingDown size={16} className="text-red-400" />
                      )}
                      <span className={`font-semibold ${payment.type === 'salary' ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                        {payment.type === 'salary' ? '+' : '-'}{payment.amount.toFixed(2)} {currency}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {upcomingExpenses > 0 && (
                <div className="flex items-center justify-between py-4 border-t border-white/20 font-semibold">
                  <span className="text-white flex items-center gap-2">
                    <DollarSign size={16} />
                    Total Upcoming Expenses
                  </span>
                  <span className="text-red-400 flex items-center gap-2">
                    <TrendingDown size={16} />
                    -{upcomingExpenses.toFixed(2)} {currency}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-white/70">
              <Calendar size={48} className="mb-4 opacity-50" />
              <p className="text-lg">No upcoming payments</p>
              <p className="text-sm opacity-70">You're all caught up for the next 30 days!</p>
            </div>
          )}
        </Card>
      </main>

      {/* Footer */}
      <footer className="relative z-[1] border-t border-white/10 py-8 mt-16">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
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
