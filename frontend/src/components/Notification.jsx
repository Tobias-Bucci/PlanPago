import React, { useEffect, useState } from "react";

/**
 * Animated notification/toast for success/error/info messages.
 * Usage: <Notification message={msg} type="success" onDone={() => setMsg("")} />
 */
export default function Notification({ message, type = "info", duration = 2200, onDone }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (message) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration]);

  useEffect(() => {
    if (!show && message) {
      // Wait for exit animation, then call onDone
      const timer = setTimeout(() => onDone?.(), 350);
      return () => clearTimeout(timer);
    }
  }, [show, message, onDone]);

  if (!message && !show) return null;

  let color = "bg-emerald-600/90 border-emerald-300 text-white";
  if (type === "error") color = "bg-red-600/90 border-red-300 text-white";
  if (type === "info") color = "bg-blue-600/90 border-blue-300 text-white";

  return (
    <div
      className={`notification-toast fixed left-1/2 top-8 z-[10000] px-6 py-3 rounded-xl border shadow-lg transition-all duration-300 ${color} ${show ? "opacity-100 scale-100 translate-x-[-50%]" : "opacity-0 scale-90 translate-x-[-50%] pointer-events-none"}`}
      style={{ minWidth: 220, maxWidth: 400, textAlign: "center" }}
      aria-live="polite"
    >
      {message}
    </div>
  );
}
