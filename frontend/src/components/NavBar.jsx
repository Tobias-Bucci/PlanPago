import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function NavBar() {
  const navigate = useNavigate();
  const token    = localStorage.getItem("token");

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentEmail");
    navigate("/login");
  };

  return (
    <nav className="bg-gray-800 text-white px-4 py-2 flex gap-4 items-center">
      <span className="font-bold">PlanPago</span>

      {token ? (
        <>
          <Link to="/dashboard" className="hover:underline">
            Dashboard
          </Link>
          <Link
            to="/contracts/new"
            className="px-3 py-1 bg-green-600 rounded hover:bg-green-700"
          >
            + Neuer Vertrag
          </Link>
          <Link to="/profile" className="hover:underline ml-auto">
            Profil
          </Link>
          <button
            onClick={logout}
            className="ml-4 text-red-300 hover:text-red-500"
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <Link to="/login"    className="ml-auto hover:underline">Login</Link>
          <Link to="/register" className="hover:underline">Register</Link>
        </>
      )}
    </nav>
  );
}
