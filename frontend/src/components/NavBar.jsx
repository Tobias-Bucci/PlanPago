// src/components/NavBar.jsx
import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

export default function NavBar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const isAuth = Boolean(token);
  const [open, setOpen] = useState(false);

  const baseLink = "px-4 py-2 rounded-lg transition-colors duration-200";
  const activeLink = "bg-accent text-white";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentEmail");
    navigate("/login");
  };

  return (
    <nav className="bg-primary text-white shadow-lg">
      <div className="container mx-auto flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <img
            src="/PlanPago-trans.png"
            alt="PlanPago Logo"
            className="h-8 w-8 rounded-full"
          />
          <span className="text-2xl font-bold">PlanPago</span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-2">
          {isAuth ? (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `${baseLink} ${
                    isActive ? activeLink : "hover:bg-primary-light"
                  }`
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/stats"
                className={({ isActive }) =>
                  `${baseLink} ${
                    isActive ? activeLink : "hover:bg-primary-light"
                  }`
                }
              >
                Statistics
              </NavLink>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `${baseLink} ${
                    isActive ? activeLink : "hover:bg-primary-light"
                  }`
                }
              >
                Settings
              </NavLink>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 rounded-lg hover:bg-red-600 transition-colors duration-200"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `${baseLink} ${
                    isActive ? activeLink : "hover:bg-primary-light"
                  }`
                }
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) =>
                  `${baseLink} ${
                    isActive ? activeLink : "hover:bg-primary-light"
                  }`
                }
              >
                Register
              </NavLink>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-primary-light transition-colors duration-200"
          onClick={() => setOpen((o) => !o)}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {open ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 8h16M4 16h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-primary-light text-white">
          <div className="flex flex-col items-center gap-2 py-4">
            {isAuth ? (
              <>
                <NavLink
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="w-full text-center px-4 py-2 rounded-lg hover:bg-primary transition-colors"
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/stats"
                  onClick={() => setOpen(false)}
                  className="w-full text-center px-4 py-2 rounded-lg hover:bg-primary transition-colors"
                >
                  Statistics
                </NavLink>
                <NavLink
                  to="/profile"
                  onClick={() => setOpen(false)}
                  className="w-full text-center px-4 py-2 rounded-lg hover:bg-primary transition-colors"
                >
                  Settings
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="w-full text-center px-4 py-2 bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="w-full text-center px-4 py-2 rounded-lg hover:bg-primary transition-colors"
                >
                  Login
                </NavLink>
                <NavLink
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="w-full text-center px-4 py-2 rounded-lg hover:bg-primary transition-colors"
                >
                  Register
                </NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
