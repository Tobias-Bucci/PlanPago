// NavBar.jsx  –  translucent brand bar
import React, { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuth = Boolean(localStorage.getItem("token"));
  const isAdmin = isAuth && localStorage.getItem("currentEmail") === "admin@admin";
  const [menuOpen, setMenuOpen] = useState(false);

  // Seiten, auf denen nur Login/Register angezeigt werden soll
  const onlyAuthRoutes = ["/login", "/register", "/terms", "/privacypolicy", "/imprint"];
  const showOnlyAuth = onlyAuthRoutes.includes(location.pathname);

  /* — activeLink helper (works for both desktop & mobile) — */
  const linkClass = ({ isActive }) =>
    `relative px-4 py-2 rounded-lg transition-colors duration-150 font-medium overflow-hidden flex items-center justify-center`;

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50">
      <nav className="backdrop-blur-lg bg-white/5 border-b border-white/10">
        <div className="container mx-auto flex items-center justify-between p-4">
          {/* logo / brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <img src="/PlanPago-trans.png" alt="PlanPago" className="h-8 w-8" />
            <span className="text-2xl font-bold tracking-wide">PlanPago</span>
          </div>

          {/* desktop menu */}
          <div className="hidden md:flex items-center gap-2 mr-2">
            {showOnlyAuth ? (
              <>
                <NavLink to="/login" className={linkClass}>
                  {({ isActive }) => (
                    <>
                      <span className="relative z-10">Login</span>
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            layoutId="nav-underline"
                            className="absolute inset-0 rounded-lg bg-white/20 shadow"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 350, damping: 30 }}
                          />
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </NavLink>
                <NavLink to="/register" className={linkClass}>
                  {({ isActive }) => (
                    <>
                      <span className="relative z-10">Register</span>
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            layoutId="nav-underline"
                            className="absolute inset-0 rounded-lg bg-white/20 shadow"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 350, damping: 30 }}
                          />
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </NavLink>
              </>
            ) : isAuth ? (
              <div className="flex items-center gap-2">
                <NavLink to="/dashboard" className={linkClass}>
                  {({ isActive }) => (
                    <>
                      <span className="relative z-10">Dashboard</span>
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            layoutId="nav-underline"
                            className="absolute inset-0 rounded-lg bg-white/20 shadow"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 350, damping: 30 }}
                          />
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </NavLink>
                <NavLink to="/stats" className={linkClass}>
                  {({ isActive }) => (
                    <>
                      <span className="relative z-10">Statistics</span>
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            layoutId="nav-underline"
                            className="absolute inset-0 rounded-lg bg-white/20 shadow"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 350, damping: 30 }}
                          />
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </NavLink>
                <NavLink to="/profile" className={linkClass}>
                  {({ isActive }) => (
                    <>
                      <span className="relative z-10">Settings</span>
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            layoutId="nav-underline"
                            className="absolute inset-0 rounded-lg bg-white/20 shadow"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 350, damping: 30 }}
                          />
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </NavLink>
                {isAdmin && (
                  <NavLink to="/adminpanel" className={linkClass}>
                    {({ isActive }) => (
                      <>
                        <span className="relative z-10">Adminpanel</span>
                        <AnimatePresence>
                          {isActive && (
                            <motion.div
                              layoutId="nav-underline"
                              className="absolute inset-0 rounded-lg bg-white/20 shadow"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ type: "spring", stiffness: 350, damping: 30 }}
                            />
                          )}
                        </AnimatePresence>
                      </>
                    )}
                  </NavLink>
                )}
                <button
                  onClick={handleLogout}
                  className="btn-accent ml-2 px-4 py-2 rounded-lg font-semibold text-white bg-purple-500 hover:bg-purple-600 transition"
                  style={{ height: '40px', display: 'flex', alignItems: 'center' }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <NavLink to="/login" className={linkClass}>
                  {({ isActive }) => (
                    <>
                      <span className="relative z-10">Login</span>
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            layoutId="nav-underline"
                            className="absolute inset-0 rounded-lg bg-white/20 shadow"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 350, damping: 30 }}
                          />
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </NavLink>
                <NavLink to="/register" className={linkClass}>
                  {({ isActive }) => (
                    <>
                      <span className="relative z-10">Register</span>
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            layoutId="nav-underline"
                            className="absolute inset-0 rounded-lg bg-white/20 shadow"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 350, damping: 30 }}
                          />
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </NavLink>
              </>
            )}
          </div>

          {/* mobile hamburger */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Open menu"
          >
            <svg className="w-7 h-7" stroke="currentColor" fill="none" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />}
            </svg>
          </button>
        </div>
      </nav>
      {/* Slide-Down Mobile Menu */}
      <div
        className={`md:hidden transition-all duration-400 overflow-hidden ${menuOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'} bg-white/10 backdrop-blur-lg border-b border-white/10`}
        style={{ transitionProperty: 'max-height,opacity' }}
      >
        <div className="container mx-auto flex flex-col items-center gap-2 py-4 animate-pop">
          {showOnlyAuth ? (
            <>
              <NavLink to="/login" onClick={() => setMenuOpen(false)} className={linkClass}>
                {({ isActive }) => (
                  <>
                    <span className="relative z-10">Login</span>
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          layoutId="nav-underline-mobile"
                          className="absolute inset-0 rounded-lg bg-white/20 shadow"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        />
                      )}
                    </AnimatePresence>
                  </>
                )}
              </NavLink>
              <NavLink to="/register" onClick={() => setMenuOpen(false)} className={linkClass}>
                {({ isActive }) => (
                  <>
                    <span className="relative z-10">Register</span>
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          layoutId="nav-underline-mobile"
                          className="absolute inset-0 rounded-lg bg-white/20 shadow"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        />
                      )}
                    </AnimatePresence>
                  </>
                )}
              </NavLink>
            </>
          ) : isAuth ? (
            <>
              <NavLink to="/dashboard" onClick={() => setMenuOpen(false)} className={linkClass}>
                {({ isActive }) => (
                  <>
                    <span className="relative z-10">Dashboard</span>
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          layoutId="nav-underline-mobile"
                          className="absolute inset-0 rounded-lg bg-white/20 shadow"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        />
                      )}
                    </AnimatePresence>
                  </>
                )}
              </NavLink>
              <NavLink to="/stats" onClick={() => setMenuOpen(false)} className={linkClass}>
                {({ isActive }) => (
                  <>
                    <span className="relative z-10">Statistics</span>
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          layoutId="nav-underline-mobile"
                          className="absolute inset-0 rounded-lg bg-white/20 shadow"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        />
                      )}
                    </AnimatePresence>
                  </>
                )}
              </NavLink>
              <NavLink to="/profile" onClick={() => setMenuOpen(false)} className={linkClass}>
                {({ isActive }) => (
                  <>
                    <span className="relative z-10">Settings</span>
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          layoutId="nav-underline-mobile"
                          className="absolute inset-0 rounded-lg bg-white/20 shadow"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        />
                      )}
                    </AnimatePresence>
                  </>
                )}
              </NavLink>
              {isAdmin && (
                <NavLink to="/adminpanel" onClick={() => setMenuOpen(false)} className={linkClass}>
                  {({ isActive }) => (
                    <>
                      <span className="relative z-10">Adminpanel</span>
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            layoutId="nav-underline-mobile"
                            className="absolute inset-0 rounded-lg bg-white/20 shadow"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 350, damping: 30 }}
                          />
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </NavLink>
              )}
              <button onClick={handleLogout} className="btn-accent w-full text-lg py-3 mt-2 bg-red-600 hover:bg-red-700">Logout</button>
            </>
          ) : (
            <>
              <NavLink to="/login" onClick={() => setMenuOpen(false)} className={linkClass}>
                {({ isActive }) => (
                  <>
                    <span className="relative z-10">Login</span>
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          layoutId="nav-underline-mobile"
                          className="absolute inset-0 rounded-lg bg-white/20 shadow"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        />
                      )}
                    </AnimatePresence>
                  </>
                )}
              </NavLink>
              <NavLink to="/register" onClick={() => setMenuOpen(false)} className={linkClass}>
                {({ isActive }) => (
                  <>
                    <span className="relative z-10">Register</span>
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          layoutId="nav-underline-mobile"
                          className="absolute inset-0 rounded-lg bg-white/20 shadow"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        />
                      )}
                    </AnimatePresence>
                  </>
                )}
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
