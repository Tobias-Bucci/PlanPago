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
      <div className="container mx-auto flex justify-between">
        <div>
          <Link to="/" className="text-white font-bold text-xl">PlanPago</Link>
        </div>
        <div>
          <Link to="/dashboard" className="text-white mr-4">Dashboard</Link>
          {!token && (
            <>
              <Link to="/login" className="text-white mr-4">Login</Link>
              <Link to="/register" className="text-white">Register</Link>
            </>
          )}
          {token && (
            <button onClick={handleLogout} className="text-white">
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
