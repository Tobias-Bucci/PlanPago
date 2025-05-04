// NavBar.jsx  –  translucent brand bar
import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

export default function NavBar() {
  const navigate   = useNavigate();
  const isAuth     = Boolean(localStorage.getItem("token"));
  const [menuOpen, setMenuOpen] = useState(false);

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
    <header className="fixed top-0 left-0 w-full z-50">
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
            onClick={()=>setMenuOpen((o)=>!o)}
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Open menu"
          >
            <svg className="w-7 h-7" stroke="currentColor" fill="none" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/> 
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16"/>}
            </svg>
          </button>
        </div>
      </nav>
      {/* Slide-Down Mobile Menu */}
      <div
        className={`md:hidden transition-all duration-400 overflow-hidden ${menuOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'} bg-white/10 backdrop-blur-lg border-b border-white/10`}
        style={{transitionProperty:'max-height,opacity'}}
      >
        <div className="container mx-auto flex flex-col items-center gap-2 py-4 animate-pop">
          {isAuth ? (
            <>
              <NavLink to="/dashboard" onClick={()=>setMenuOpen(false)} className="btn-primary w-full text-lg py-3">Dashboard</NavLink>
              <NavLink to="/stats" onClick={()=>setMenuOpen(false)} className="btn-primary w-full text-lg py-3">Statistics</NavLink>
              <NavLink to="/profile" onClick={()=>setMenuOpen(false)} className="btn-primary w-full text-lg py-3">Settings</NavLink>
              <button onClick={handleLogout} className="btn-accent w-full text-lg py-3 mt-2 bg-red-600 hover:bg-red-700">Logout</button>
            </>
          ) : (
            <>
              <NavLink to="/login" onClick={()=>setMenuOpen(false)}    className="btn-primary w-full text-lg py-3">Login</NavLink>
              <NavLink to="/register" onClick={()=>setMenuOpen(false)} className="btn-primary w-full text-lg py-3">Register</NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
