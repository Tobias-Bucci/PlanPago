// src/ProtectedRoute.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      // leiten wir zur Login-Seite weiter und merken uns, wohin wir wollten
      navigate("/login", { state: { from: location.pathname } });
    } else {
      setReady(true);
    }
  }, [navigate, location]);

  if (!ready) return null;
  return <>{children}</>;
}
