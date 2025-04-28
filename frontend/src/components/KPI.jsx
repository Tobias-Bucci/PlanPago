export default function KPI({ label, value, postfix = "", color = "emerald" }) {
    const palette = {
      emerald: "text-emerald-300",
      rose: "text-rose-300",
      sky: "text-sky-300",
      amber: "text-amber-300",
    };
    return (
      <div className="glass-card p-4 flex flex-col items-center gap-1">
        <span className="text-sm text-white/70">{label}</span>
        <span
          className={`text-2xl font-bold tracking-wide ${palette[color] || "text-white"}`}
        >
          {value}
          {postfix}
        </span>
      </div>
    );
  }
  