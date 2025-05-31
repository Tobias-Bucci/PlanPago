/** Expand contracts into monthly numbers (last 12 months)  */
export function buildMonthSeries(contracts) {
  // helper ↓
  const ym = (d) => `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}`;
  const add = (map, key, field, v) => {
    if (!map[key]) map[key] = { month: key, income: 0, fixed: 0 };
    map[key][field] += v;
  };

  // build map <YYYY-MM> → {income, fixed}
  const map = {};
  const now = new Date();
  const start = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1); // 12 months back +1

  contracts.forEach((c) => {
    if (c.status === "cancelled") return; // Cancelled Verträge ignorieren
    const isSalary = c.contract_type === "salary";
    const monthly =
      c.payment_interval === "jährlich" ||
        c.payment_interval === "yearly"
        ? c.amount / 12
        : c.amount;

    // iterate months in range where contract is active
    for (let i = 0; i < 13; i++) {
      const cur = new Date(start.getFullYear(), start.getMonth() + i, 1);
      if (cur > now) break;
      if (new Date(c.start_date) > cur) continue;
      if (c.end_date && new Date(c.end_date) < cur) continue;

      const key = ym(cur);
      add(map, key, isSalary ? "income" : "fixed", monthly);
    }
  });

  // sort chronologically
  return Object.values(map).sort((a, b) => (a.month > b.month ? 1 : -1));
}

/** Upcoming payments (next 30 d) – returns array sorted by date */
export function upcomingPayments(contracts, daysAhead = 30) {
  const today = new Date();
  const upcoming = [];

  contracts.forEach((contract) => {
    if (contract.status === "expired" || contract.status === "cancelled") {
      return;
    }

    let nextPaymentDate = new Date(contract.start_date);

    // Calculate next payment date based on interval
    if (contract.payment_interval === "monthly") {
      while (nextPaymentDate <= today) {
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
      }
    } else if (contract.payment_interval === "yearly") {
      while (nextPaymentDate <= today) {
        nextPaymentDate.setFullYear(nextPaymentDate.getFullYear() + 1);
      }
    } else if (contract.payment_interval === "one-time") {
      nextPaymentDate = new Date(contract.start_date);
    }

    // Check if payment is within the specified window
    const diffTime = nextPaymentDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= daysAhead && diffDays >= 0) {
      upcoming.push({
        id: contract.id,
        name: contract.name,
        amount: contract.amount,
        date: nextPaymentDate,
        type: contract.contract_type,
      });
    }
  });

  return upcoming.sort((a, b) => a.date.getTime() - b.date.getTime());
}
