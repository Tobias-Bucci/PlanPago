// NavBar.jsx  –  translucent brand bar
import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

export default function NavBar() {
  const navigate   = useNavigate();
  const isAuth     = Boolean(localStorage.getItem("token"));
  const [open,setOpen]=useState(false);

  /* — activeLink helper (works for both desktop & mobile) — */
  const linkClass = ({isActive}) =>
    `px-4 py-2 rounded-lg transition-colors duration-150 ${
      isActive ? "bg-white/20 shadow text-white" : "hover:bg-white/10"
    }`;

  const handleLogout = ()=>{
    localStorage.clear();
    navigate("/login");
  };

  return (
    <header className="fixed top-0 w-full z-40 text-white">
      <nav className="backdrop-blur-lg bg-white/5 border-b border-white/10">
        <div className="container mx-auto flex items-center justify-between p-4">
          {/* logo / brand */}
          <div className="flex items-center gap-3">
            <img src="/PlanPago-trans.png" alt="PlanPago" className="h-8 w-8" />
            <span className="text-2xl font-bold tracking-wide">PlanPago</span>
          </div>

          {/* desktop menu */}
          <div className="hidden md:flex items-center gap-2">
            {isAuth ? (
              <>
                <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
                <NavLink to="/stats"      className={linkClass}>Statistics</NavLink>
                <NavLink to="/profile"    className={linkClass}>Settings</NavLink>
                <button
                  onClick={handleLogout}
                  className="btn-accent ml-2"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login"    className={linkClass}>Login</NavLink>
                <NavLink to="/register" className={linkClass}>Register</NavLink>
              </>
            )}
          </div>

          {/* mobile hamburger */}
          <button
            onClick={()=>setOpen(o=>!o)}
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition"
          >
            <svg className="w-6 h-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
              {open
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/> 
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16"/>}
            </svg>
          </button>
        </div>

        {/* mobile panel */}
        {open && (
          <div className="md:hidden backdrop-blur-lg bg-white/5 border-t border-white/10">
            <div className="flex flex-col items-center gap-1 py-4">
              {isAuth ? (
                <>
                  <NavLink to="/dashboard" onClick={()=>setOpen(false)} className={linkClass}>
                    Dashboard
                  </NavLink>
                  <NavLink to="/stats" onClick={()=>setOpen(false)} className={linkClass}>
                    Statistics
                  </NavLink>
                  <NavLink to="/profile" onClick={()=>setOpen(false)} className={linkClass}>
                    Settings
                  </NavLink>
                  <button onClick={handleLogout} className="btn-accent mt-1">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <NavLink to="/login" onClick={()=>setOpen(false)}    className={linkClass}>Login</NavLink>
                  <NavLink to="/register" onClick={()=>setOpen(false)} className={linkClass}>Register</NavLink>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
