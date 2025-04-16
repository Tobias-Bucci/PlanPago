// src/components/NavBar.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";

const NavBar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav className="bg-blue-500 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div>
          <Link to="/" className="text-white font-bold text-xl">
            PlanPago
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          {token ? (
            <>
              <Link to="/dashboard" className="text-white hover:text-blue-100">
                Dashboard
              </Link>
              <Link to="/profile" className="text-white hover:text-blue-100">
                Einstellungen
              </Link>
              <Link
                to="/contracts/new"
                className="text-white hover:text-blue-100 font-semibold"
              >
                Neuen Vertrag erstellen
              </Link>
              <button
                onClick={handleLogout}
                className="text-white border border-white px-3 py-1 rounded hover:bg-white hover:text-blue-500 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-white hover:text-blue-100">
                Login
              </Link>
              <Link to="/register" className="text-white hover:text-blue-100">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
