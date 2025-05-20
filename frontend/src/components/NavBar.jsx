import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function NavBar() {
  const navigate = useNavigate();
  const isAuth   = Boolean(localStorage.getItem("token"));
  const isAdmin  = isAuth && localStorage.getItem("currentEmail") === "admin@admin";
  const [open, setOpen] = useState(false);
  const path = window.location.pathname;

  // Show only login/register if on landing page ("/")
  const links = path === "/"
    ? [
        { to: "/login",    label: "Login" },
        { to: "/register", label: "Register" }
      ]
    : isAuth
      ? [
          { to: "/dashboard", label: "Dashboard" },
          { to: "/stats",     label: "Statistics" },
          { to: "/profile",   label: "Settings" },
          ...(isAdmin ? [{ to: "/adminpanel", label: "Adminpanel" }] : [])
        ]
      : [
          { to: "/login",    label: "Login" },
          { to: "/register", label: "Register" }
        ];

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50">
      <nav className="backdrop-blur-lg bg-white/5 border-b border-white/10">
        <div className="container mx-auto flex items-center justify-between p-4">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <img src="/PlanPago-trans.png" alt="PlanPago" className="h-8 w-8" />
            <span className="text-2xl font-bold tracking-wide">PlanPago</span>
          </div>

          {/* Desktop */}
          <div className="hidden md:flex relative items-center gap-2">
            {links.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className="relative px-4 py-2 rounded-lg text-white/70 hover:text-white"
              >
                {({ isActive }) => (
                  <>
                    <span className="relative z-10">{label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 mx-1 my-1 rounded-lg gradient-bg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 40,
                          duration: 0.4
                        }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}

            {isAuth && (
              <button onClick={logout} className="btn-accent ml-4">
                Logout
              </button>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setOpen(o => !o)}
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Open menu"
          >
            <svg className="w-7 h-7" stroke="currentColor" fill="none" viewBox="0 0 24 24">
              {open
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16"/>}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Slide-Down */}
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={open ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
        transition={{ type: "tween", duration: 0.3 }}
        className="md:hidden overflow-hidden bg-white/10 backdrop-blur-lg border-b border-white/10"
      >
        <div className="container mx-auto flex flex-col items-center gap-2 py-4">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className="btn-primary w-full text-lg py-3"
            >
              {label}
            </NavLink>
          ))}
          {isAuth && (
            <button onClick={logout} className="btn-accent w-full text-lg py-3 mt-2 bg-red-600 hover:bg-red-700">
              Logout
            </button>
          )}
        </div>
      </motion.div>
    </header>
  );
}
