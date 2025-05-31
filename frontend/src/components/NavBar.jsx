// NavBar.jsx  –  translucent brand bar
import React from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuth = Boolean(localStorage.getItem("token"));
  const isAdmin = isAuth && localStorage.getItem("currentEmail") === "admin@admin";

  // Seiten, auf denen nur Login/Register angezeigt werden soll
  const onlyAuthRoutes = ["/login", "/register", "/terms", "/privacypolicy", "/imprint"];
  const showOnlyAuth = onlyAuthRoutes.includes(location.pathname);

  /* — activeLink helper (works for both desktop & mobile) — */
  const linkClass = ({ isActive }) =>
    `relative px-6 py-3 rounded-lg transition-all duration-200 font-medium flex items-center justify-center min-h-[44px] whitespace-nowrap`;

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50">
      <nav className="backdrop-blur-lg bg-white/5 border-b border-white/10">
        <div className="container mx-auto flex items-center justify-between p-4 min-w-fit">
          {/* logo / brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <img src="/PlanPago-trans.png" alt="PlanPago" className="h-8 w-8" />
            <span className="text-2xl font-bold tracking-wide">PlanPago</span>
          </div>

          {/* desktop menu - always visible now */}
          <div className="flex items-center gap-2 mr-2">
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
        </div>
      </nav>
    </header>
  );
}
