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

import Card from "../components/Card";
import KPI from "../components/KPI";
import { upcomingPayments } from "../utils/statsHelpers";

/* Farb-Map & Glass-Tooltip-Style */
const TYPE_COLORS = {
  rent: "#EF4444",
  streaming: "#EC4899",
  insurance: "#3B82F6",
  leasing: "#F59E0B",
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
  const [contracts, setContracts] = useState([]);
  const [err, setErr]             = useState("");
  const [loading, setLd]          = useState(true);

  const API        = API_BASE;
  const authHeader = useMemo(
    () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` }),
    []
  );
  const cur =
    localStorage.getItem(
      `currency_${localStorage.getItem("currentEmail")}`
    ) || "€";

  /* Contracts laden (limit=100) */
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
    const income = contracts
      .filter((c) => c.contract_type === "salary")
      .reduce((s, c) => s + Number(c.amount), 0);
    const fixed = contracts
      .filter((c) => c.contract_type !== "salary")
      .reduce((s, c) => {
        const yearly = c.payment_interval === "yearly";
        return s + Number(c.amount) / (yearly ? 12 : 1);
      }, 0);
    const available   = income - fixed;
    const savingRate  = income ? (available / income) * 100 : 0;
    return { income, fixed, available, savingRate };
  }, [contracts]);

  /* Expense-Donut (monthly) */
  const expenseData = useMemo(() => {
    const map = Object.fromEntries(
      Object.keys(TYPE_COLORS).map((k) => [k, 0])
    );
    contracts
      .filter((c) => c.contract_type !== "salary")
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
      .map(([name, value]) => ({ name, value }));
  }, [contracts]);
  const expenseTotal = expenseData.reduce((s, e) => s + e.value, 0);

  /* Income-Donut (if multiple salaries) */
  const incomeData = useMemo(() => {
    const sal = contracts.filter((c) => c.contract_type === "salary");
    return sal.length > 1
      ? sal.map((c) => ({ name: c.name, value: Number(c.amount) }))
      : [];
  }, [contracts]);
  const incomeTotal = incomeData.reduce((s, e) => s + e.value, 0);

  /* Upcoming payments */
  const upcoming    = useMemo(() => upcomingPayments(contracts), [contracts]);
  const upcomingSum = useMemo(() => 
    upcoming.reduce((s, x) => s + (x.type !== 'salary' ? x.amount : 0), 0),
    [upcoming]
  );

  if (loading)
    return (
      <main className="container mx-auto pt-24 p-6">
        <p className="text-white/70">Loading …</p>
      </main>
    );
  if (err)
    return (
      <main className="container mx-auto pt-24 p-6">
        <p className="text-red-300">{err}</p>
      </main>
    );

  return (
    <main className="container mx-auto pt-24 p-6 animate-fadeIn space-y-10">

      {/* KPI-Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Income"        value={kpi.income.toFixed(2)}      postfix={` ${cur}`} />
        <KPI label="Fixed"         value={kpi.fixed.toFixed(2)}       postfix={` ${cur}`} color="rose" />
        <KPI label="Available"     value={kpi.available.toFixed(2)}   postfix={` ${cur}`} color={kpi.available>=0 ? "emerald":"rose"} />
        <KPI label="Savings Rate"  value={kpi.savingRate.toFixed(0)}  postfix="%"      color="sky" />
      </div>

      {/* Donut-Charts */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Expense split */}
        <Card title="Expense split (monthly)">
          {expenseData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={expenseData}
                  dataKey="value"
                  innerRadius="55%"
                  paddingAngle={5}
                >
                  {expenseData.map((e) => (
                    <Cell key={e.name} fill={TYPE_COLORS[e.name]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => `${v.toFixed(2)} ${cur}`}
                  contentStyle={glassTooltipStyle}
                />
                <Legend
                  verticalAlign="bottom"
                  formatter={(value) => {
                    const item = expenseData.find((x) => x.name === value);
                    const pct = ((item.value / expenseTotal) * 100).toFixed(0);
                    return `${value} — ${pct}%`;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-white/70">
              No expense data available.
            </p>
          )}
        </Card>

        {/* Income split */}
        <Card title="Income split">
          {incomeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={incomeData}
                  dataKey="value"
                  innerRadius="55%"
                  paddingAngle={5}
                  fill="#10B981"
                />
                <Tooltip
                  formatter={(v) => `${v.toFixed(2)} ${cur}`}
                  contentStyle={glassTooltipStyle}
                />
                <Legend
                  verticalAlign="bottom"
                  formatter={(value) => {
                    const item = incomeData.find((x) => x.name === value);
                    const pct = ((item.value / incomeTotal) * 100).toFixed(0);
                    return `${value} — ${pct}%`;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-white/70">
              No income split data available.
            </p>
          )}
        </Card>
      </div>

      {/* Upcoming payments (next 30 days) */}
      <Card title="Upcoming payments (next 30 days)">
        {upcoming.length > 0 ? (
          <table className="min-w-full text-white/90 text-sm">
            <thead>
              <tr className="text-left">
                <th className="pb-2">Date</th>
                <th className="pb-2">Name</th>
                <th className="pb-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((u) => (
                <tr key={u.id} className="border-t border-white/10">
                  <td className="py-2">
                    {u.date.toLocaleDateString(undefined, {
                      day: "2-digit",
                      month: "short",
                    })}
                  </td>
                  <td className="py-2">{u.name}</td>
                  <td className={`py-2 ${u.type === 'salary' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {u.type === 'salary' ? '+' : '-'}{u.amount.toFixed(2)} {cur}
                  </td>
                </tr>
              ))}
              <tr className="border-t border-white/10">
                <td className="py-2 font-semibold">Total Expenses</td>
                <td />
                <td className="py-2 font-semibold text-red-400">
                  -{upcomingSum.toFixed(2)} {cur}
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <p className="text-white/70">
            No upcoming payments in the next 30 days.
          </p>
        )}
      </Card>
    </main>
  );
}
