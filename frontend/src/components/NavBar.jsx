import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

export default function NavBar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const isAuth = Boolean(token);

  const linkBase   = "px-3 py-2 rounded";
  const linkActive = "bg-blue-600 text-white";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentEmail");
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto flex items-center justify-between p-4">
        {/* links: Brand + (wenn auth) Dashboard & Statistiken */}
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold text-blue-600">PlanPago</div>
          {isAuth && (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : ""}`
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/stats"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : ""}`
                }
              >
                Statistiken
              </NavLink>
            </>
          )}
        </div>

        {/* rechts: Login/Register oder Einstellungen/Logout */}
        <div className="flex items-center gap-2">
          {!isAuth ? (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : ""}`
                }
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : ""}`
                }
              >
                Register
              </NavLink>
            </>
          ) : (
            <>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : ""}`
                }
              >
                Einstellungen
              </NavLink>
              <button
                onClick={handleLogout}
                className="px-3 py-2 bg-red-600 text-white rounded"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
);
}
