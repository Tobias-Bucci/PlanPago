// src/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    // Kein Token gefunden – weiterleiten zur Login-Seite
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default ProtectedRoute;
