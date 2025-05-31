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
    `relative px-6 py-3 rounded-lg transition-all duration-200 font-medium overflow-hidden flex items-center justify-center min-h-[44px] w-full md:w-auto`;

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
            className="md:hidden p-3 rounded-lg hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            <motion.svg
              className="w-6 h-6"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 24 24"
              animate={{ rotate: menuOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />}
            </motion.svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Backdrop */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Slide-Down Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="md:hidden fixed top-[73px] left-0 right-0 z-50 backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl mx-2 mt-2 rounded-2xl"
          >
            <div className="container mx-auto px-6 py-6 max-h-[calc(100vh-100px)] overflow-y-auto">
              <div className="flex flex-col gap-2">
                {showOnlyAuth ? (
                  <>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1, duration: 0.3 }}
                    >
                      <NavLink to="/login" onClick={() => setMenuOpen(false)} className={linkClass}>
                        {({ isActive }) => (
                          <>
                            <span className="relative z-10 text-lg">Login</span>
                            <AnimatePresence>
                              {isActive && (
                                <motion.div
                                  layoutId="nav-underline-mobile"
                                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/30 to-purple-500/30"
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                />
                              )}
                            </AnimatePresence>
                          </>
                        )}
                      </NavLink>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15, duration: 0.3 }}
                    >
                      <NavLink to="/register" onClick={() => setMenuOpen(false)} className={linkClass}>
                        {({ isActive }) => (
                          <>
                            <span className="relative z-10 text-lg">Register</span>
                            <AnimatePresence>
                              {isActive && (
                                <motion.div
                                  layoutId="nav-underline-mobile"
                                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/30 to-purple-500/30"
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                />
                              )}
                            </AnimatePresence>
                          </>
                        )}
                      </NavLink>
                    </motion.div>
                  </>
                ) : isAuth ? (
                  <>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1, duration: 0.3 }}
                    >
                      <NavLink to="/dashboard" onClick={() => setMenuOpen(false)} className={linkClass}>
                        {({ isActive }) => (
                          <>
                            <span className="relative z-10 text-lg">Dashboard</span>
                            <AnimatePresence>
                              {isActive && (
                                <motion.div
                                  layoutId="nav-underline-mobile"
                                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/30 to-purple-500/30"
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                />
                              )}
                            </AnimatePresence>
                          </>
                        )}
                      </NavLink>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15, duration: 0.3 }}
                    >
                      <NavLink to="/stats" onClick={() => setMenuOpen(false)} className={linkClass}>
                        {({ isActive }) => (
                          <>
                            <span className="relative z-10 text-lg">Statistics</span>
                            <AnimatePresence>
                              {isActive && (
                                <motion.div
                                  layoutId="nav-underline-mobile"
                                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/30 to-purple-500/30"
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                />
                              )}
                            </AnimatePresence>
                          </>
                        )}
                      </NavLink>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2, duration: 0.3 }}
                    >
                      <NavLink to="/profile" onClick={() => setMenuOpen(false)} className={linkClass}>
                        {({ isActive }) => (
                          <>
                            <span className="relative z-10 text-lg">Settings</span>
                            <AnimatePresence>
                              {isActive && (
                                <motion.div
                                  layoutId="nav-underline-mobile"
                                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/30 to-purple-500/30"
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                />
                              )}
                            </AnimatePresence>
                          </>
                        )}
                      </NavLink>
                    </motion.div>
                    {isAdmin && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25, duration: 0.3 }}
                      >
                        <NavLink to="/adminpanel" onClick={() => setMenuOpen(false)} className={linkClass}>
                          {({ isActive }) => (
                            <>
                              <span className="relative z-10 text-lg">Adminpanel</span>
                              <AnimatePresence>
                                {isActive && (
                                  <motion.div
                                    layoutId="nav-underline-mobile"
                                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/30 to-purple-500/30"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                  />
                                )}
                              </AnimatePresence>
                            </>
                          )}
                        </NavLink>
                      </motion.div>
                    )}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3, duration: 0.3 }}
                      className="pt-4 border-t border-white/10 mt-4"
                    >
                      <button
                        onClick={() => {
                          handleLogout();
                          setMenuOpen(false);
                        }}
                        className="w-full py-3 px-6 text-lg font-semibold rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-200 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] min-h-[44px]"
                      >
                        Logout
                      </button>
                    </motion.div>
                  </>
                ) : (
                  <>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1, duration: 0.3 }}
                    >
                      <NavLink to="/login" onClick={() => setMenuOpen(false)} className={linkClass}>
                        {({ isActive }) => (
                          <>
                            <span className="relative z-10 text-lg">Login</span>
                            <AnimatePresence>
                              {isActive && (
                                <motion.div
                                  layoutId="nav-underline-mobile"
                                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/30 to-purple-500/30"
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                />
                              )}
                            </AnimatePresence>
                          </>
                        )}
                      </NavLink>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15, duration: 0.3 }}
                    >
                      <NavLink to="/register" onClick={() => setMenuOpen(false)} className={linkClass}>
                        {({ isActive }) => (
                          <>
                            <span className="relative z-10 text-lg">Register</span>
                            <AnimatePresence>
                              {isActive && (
                                <motion.div
                                  layoutId="nav-underline-mobile"
                                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/30 to-purple-500/30"
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                />
                              )}
                            </AnimatePresence>
                          </>
                        )}
                      </NavLink>
                    </motion.div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
