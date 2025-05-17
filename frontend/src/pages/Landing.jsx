import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "../App.css";

export default function Landing() {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="landing-container"
      style={{
        minHeight: "100vh",
        color: "white",
        position: "relative",
        overflow: "hidden",
        background: "#181c2f",
        paddingTop: "4.5rem" // minimal nach unten versetzt für Abstand zur Navbar
      }}
    >
      {/* Modern animated background with blurred gradients (now: top left blue, bottom right pink) */}
      <motion.div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "-10%",
          left: "-10%",
          width: "60vw",
          height: "60vw",
          background: "radial-gradient(circle at 30% 30%, #61dafb 0%, transparent 70%)",
          filter: "blur(80px)",
          opacity: 0.5,
          zIndex: 0
        }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.5 }}
        transition={{ duration: 1.2 }}
      />
      <motion.div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "-15%",
          right: "-10%",
          width: "55vw",
          height: "55vw",
          background: "radial-gradient(circle at 70% 70%, #ff61d9 0%, transparent 70%)",
          filter: "blur(80px)",
          opacity: 0.5,
          zIndex: 0
        }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.5 }}
        transition={{ duration: 1.2, delay: 0.2 }}
      />
      <div className="landing-content" style={{ maxWidth: 900, margin: "0 auto", padding: "4rem 1rem", textAlign: "center", position: "relative", zIndex: 1 }}>
        {/* Removed logo at the top */}
        <motion.h1
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          style={{ fontSize: "2.8rem", fontWeight: 700, background: "linear-gradient(90deg, #ff61d9 30%, #61dafb 70%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
        >
          Welcome to PlanPago
        </motion.h1>
        <motion.p
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.7 }}
          style={{ fontSize: "1.3rem", margin: "1.5rem 0 2.5rem 0" }}
        >
          PlanPago is your all-in-one digital assistant for managing contracts, recurring payments, and important deadlines. Designed for individuals and households, PlanPago provides a clear, structured platform to organize all your contracts—such as rent, insurance, subscriptions, and salary agreements—in one secure place.<br /><br />
          Easily add new contracts using dynamic forms tailored to each contract type. Upload your documents securely, set payment intervals and amounts, and receive automatic reminders for upcoming payments or cancellation deadlines directly via email. Never miss a due date again!<br /><br />
          The intuitive dashboard gives you a real-time overview of all your active contracts, upcoming payments, and deadlines. Interactive charts visualize your monthly fixed costs, contract types, and show you exactly how much of your income remains after all obligations. PlanPago helps you understand your financial situation at a glance and supports better financial planning.<br /><br />
          <b>Key features:</b> Smart contract management · Automatic email reminders · Visual analytics · Secure authentication · GDPR-compliant · Responsive design · Data export · Optional shared accounts & calendar integration
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.7 }}
          style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 40 }}
        >
          <motion.button
            whileHover={{ scale: 1.08, backgroundColor: "#ff61d9", color: "#fff" }}
            whileTap={{ scale: 0.97 }}
            className="landing-btn"
            style={{
              background: "linear-gradient(90deg, #ff61d9 0%, #61dafb 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "0.9rem 2.2rem",
              fontSize: "1.1rem",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 16px 0 rgba(97,218,251,0.15)",
              transition: "background 0.2s, color 0.2s"
            }}
            onClick={() => navigate("/register")}
          >
            Get Started
          </motion.button>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.7 }}
          style={{ display: "flex", justifyContent: "center", gap: 48, flexWrap: "wrap", marginBottom: 24 }}
        >
          {/* Management Icon */}
          <motion.div
            whileHover={{
              scale: 1.09,
              boxShadow: "0 12px 36px 0 #ff61d9cc",
              y: -10,
              rotate: [0, 2, -2, 0],
              transition: { duration: 0.5, type: "spring" }
            }}
            whileTap={{ scale: 0.97 }}
            style={{
              background: "linear-gradient(135deg, #181c2f 60%, #ff61d9 100%)",
              borderRadius: 20,
              padding: 32,
              boxShadow: "0 2px 16px 0 #ff61d933",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              minWidth: 170,
              minHeight: 170,
              width: 170,
              height: 170,
              justifyContent: "center",
              transition: "box-shadow 0.18s, transform 0.18s"
            }}
          >
            <motion.svg
              width="64" height="64" viewBox="0 0 64 64" fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ display: "block" }}
            >
              <rect x="10" y="10" width="44" height="44" rx="10" fill="#fff" fillOpacity="0.08" />
              <rect x="18" y="18" width="28" height="7" rx="3.5" fill="#ff61d9" />
              <rect x="18" y="30" width="20" height="5" rx="2.5" fill="#61dafb" />
              <rect x="18" y="40" width="16" height="5" rx="2.5" fill="#fff" fillOpacity="0.18" />
              <circle cx="44" cy="44" r="7" fill="#61dafb" />
              <path d="M42.5 44.5l2.5 2.5 3.5-3.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>
            <span style={{ color: "#ff61d9", fontWeight: 600, fontSize: 20, marginTop: 18, letterSpacing: 0.5 }}>
              Management
            </span>
          </motion.div>

          {/* Reminders Icon */}
          <motion.div
            whileHover={{
              scale: 1.09,
              boxShadow: "0 12px 36px 0 #61dafbcc",
              y: -10,
              rotate: [0, -2, 2, 0],
              transition: { duration: 0.5, type: "spring" }
            }}
            whileTap={{ scale: 0.97 }}
            style={{
              background: "linear-gradient(135deg, #181c2f 60%, #61dafb 100%)",
              borderRadius: 20,
              padding: 32,
              boxShadow: "0 2px 16px 0 #61dafb33",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              minWidth: 170,
              minHeight: 170,
              width: 170,
              height: 170,
              justifyContent: "center",
              transition: "box-shadow 0.18s, transform 0.18s"
            }}
          >
            <motion.svg
              width="64" height="64" viewBox="0 0 64 64" fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ display: "block" }}
            >
              <circle cx="32" cy="32" r="28" fill="#fff" fillOpacity="0.08" />
              <path d="M32 20v14l10 6" stroke="#61dafb" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="32" cy="32" r="18" stroke="#ff61d9" strokeWidth="3" fill="none" />
              <circle cx="32" cy="32" r="8" fill="#ff61d9" fillOpacity="0.18" />
              <rect x="28" y="48" width="8" height="5" rx="2.5" fill="#61dafb" />
            </motion.svg>
            <span style={{ color: "#61dafb", fontWeight: 600, fontSize: 20, marginTop: 18, letterSpacing: 0.5 }}>
              Reminders
            </span>
          </motion.div>

          {/* Analytics Icon (custom, modern, not blurry) */}
          <motion.div
            whileHover={{
              scale: 1.09,
              boxShadow: "0 12px 36px 0 #ff61d9cc",
              y: -10,
              rotate: [0, 2, -2, 0],
              transition: { duration: 0.5, type: "spring" }
            }}
            whileTap={{ scale: 0.97 }}
            style={{
              background: "linear-gradient(135deg, #181c2f 60%, #ff61d9 100%)",
              borderRadius: 20,
              padding: 32,
              boxShadow: "0 2px 16px 0 #ff61d933",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              minWidth: 170,
              minHeight: 170,
              width: 170,
              height: 170,
              justifyContent: "center",
              transition: "box-shadow 0.18s, transform 0.18s"
            }}
          >
            <motion.svg
              width="64" height="64" viewBox="0 0 64 64" fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ display: "block" }}
            >
              <rect x="8" y="12" width="48" height="40" rx="10" fill="#fff" fillOpacity="0.08" />
              {/* Modern analytics bars */}
              <rect x="18" y="38" width="6" height="14" rx="3" fill="#61dafb" />
              <rect x="28" y="28" width="6" height="24" rx="3" fill="#ff61d9" />
              <rect x="38" y="20" width="6" height="32" rx="3" fill="#fff" fillOpacity="0.18" />
              {/* Dots for data points */}
              <circle cx="21" cy="36" r="2.5" fill="#61dafb" />
              <circle cx="31" cy="26" r="2.5" fill="#ff61d9" />
              <circle cx="41" cy="18" r="2.5" fill="#fff" fillOpacity="0.5" />
              {/* Connecting line */}
              <polyline points="21,36 31,26 41,18" fill="none" stroke="#ff61d9" strokeWidth="2" strokeLinecap="round" />
            </motion.svg>
            <span style={{ color: "#ff61d9", fontWeight: 600, fontSize: 20, marginTop: 18, letterSpacing: 0.5 }}>
              Analytics
            </span>
          </motion.div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.7 }}
          style={{ marginTop: 48, fontSize: "1.1rem", color: "#e1b7e9" }}
        >
          <span>100% GDPR-compliant · Secure · Free trial</span>
        </motion.div>
        {/* Decorative animated divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 1.7, duration: 0.7, type: "spring" }}
          style={{
            margin: "3rem auto 0 auto",
            width: "60%",
            height: 4,
            background: "linear-gradient(90deg, #ff61d9 0%, #61dafb 100%)",
            borderRadius: 2,
            transformOrigin: "left"
          }}
        />
      </div>
    </motion.div>
  );
}
