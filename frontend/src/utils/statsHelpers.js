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
      const isSalary = c.contract_type === "Gehalt";
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
    const res = [];
    const today = new Date();
  
    contracts.forEach((c) => {
      if (c.contract_type === "Gehalt") return; // skip salaries
      let due = new Date(c.start_date);
  
      // advance to next due date
      const step =
        c.payment_interval === "jährlich" || c.payment_interval === "yearly"
          ? 365
          : 30; // rough; good enough for list
      while (due < today) due.setDate(due.getDate() + step);
  
      const diff = (due - today) / 864e5;
      if (diff <= daysAhead)
        res.push({ id: c.id, name: c.name, date: due, amount: c.amount });
    });
  
    return res.sort((a, b) => a.date - b.date).slice(0, 5);
  }
  