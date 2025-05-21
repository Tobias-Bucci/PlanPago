import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Notification from "../components/Notification";

export default function ImpersonateConfirm() {
  const { token } = useParams();
  const [msg, setMsg] = useState("Checking request...");
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Use absolute API URL for backend call
        const apiUrl = (window.API_BASE || process.env.REACT_APP_API_URL || window.location.origin + '/api') + `/users/admin/impersonate-confirm/${token}`;
        const r = await fetch(apiUrl);
        const text = await r.text();
        if (r.ok && text.toLowerCase().includes("approved")) {
          setSuccess(true);
          setMsg("Admin access has been approved. You may close this window.");
        } else {
          setErr(text);
        }
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, [token]);

  return (
    <main className="container mx-auto pt-24 p-6 flex flex-col items-center">
      <div className="glass-card max-w-lg w-full p-8 animate-pop text-center">
        <h1 className="text-2xl font-semibold mb-4 text-white">Admin Access Confirmation</h1>
        {err && <Notification message={err} type="error" onDone={() => setErr("")} />}
        {!err && msg && <Notification message={msg} type="success" onDone={() => setMsg("")} />}
        {success && (
          <div className="mt-6 text-white/80 text-sm">You can now inform the admin to proceed.<br/>This window can be closed.</div>
        )}
      </div>
    </main>
  );
}
