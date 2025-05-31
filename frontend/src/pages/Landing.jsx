import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "../App.css";
import AnimatedParticlesParallax from "../components/AnimatedParticlesParallax";
import { ArrowRight, Shield, BarChart3, Calendar, Github } from "lucide-react";

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
        background: "linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #2d3748 50%, #1a202c 75%, #0f1419 100%)",
        paddingTop: "4.5rem"
      }}
    >
      <AnimatedParticlesParallax />

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* GitHub Link */}
          <div className="flex justify-center mb-8">
            <a
              href="https://github.com/Tobias-Bucci/PlanPago"
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card px-4 py-2 rounded-lg hover:bg-white/10 transition-all duration-300 flex items-center gap-2 text-white/80 hover:text-white"
              title="View on GitHub"
            >
              <Github size={20} />
              <span className="text-sm font-medium">Open Source on GitHub</span>
            </a>
          </div>

          {/* Main Headline */}
          <motion.h1
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-4xl sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6"
            style={{
              background: "linear-gradient(135deg, #61dafb 0%, #ff61d9 50%, #61dafb 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}
          >
            PlanPago
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-lg sm:text-xl md:text-2xl text-white/80 mb-6 sm:mb-8 leading-relaxed px-2"
          >
            Your intelligent contract management platform
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.7 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-12 sm:mb-16 px-4"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl"
              style={{
                background: "linear-gradient(135deg, #61dafb 0%, #ff61d9 100%)",
                boxShadow: "0 8px 32px rgba(97, 218, 251, 0.3)",
                border: "none",
                color: "white"
              }}
              onClick={() => navigate("/register")}
            >
              Get Started Free
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all duration-300"
              onClick={() => navigate("/login")}
            >
              Sign In
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 container mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="max-w-6xl mx-auto"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-16 px-2">
            Everything you need to manage contracts
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature 1 - Management */}
            <motion.div
              whileHover={{ y: -10, scale: 1.02 }}
              className="relative group"
            >
              <div className="glass-card p-6 sm:p-8 h-full text-center">
                <div className="w-14 sm:w-16 h-14 sm:h-16 mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="10" y="10" width="44" height="44" rx="10" fill="white" fillOpacity="0.9" />
                    <rect x="18" y="18" width="28" height="7" rx="3.5" fill="#1a202c" />
                    <rect x="18" y="30" width="20" height="5" rx="2.5" fill="#4299e1" />
                    <rect x="18" y="40" width="16" height="5" rx="2.5" fill="#63b3ed" />
                    <circle cx="44" cy="44" r="7" fill="#4299e1" />
                    <path d="M42.5 44.5l2.5 2.5 3.5-3.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-blue-300">Smart Management</h3>
                <p className="text-sm sm:text-base text-white/70">
                  Organize all your contracts in one secure place. Dynamic forms, automated categorization, and intelligent reminders.
                </p>
              </div>
            </motion.div>

            {/* Feature 2 - Reminders */}
            <motion.div
              whileHover={{ y: -10, scale: 1.02 }}
              className="relative group"
            >
              <div className="glass-card p-6 sm:p-8 h-full text-center">
                <div className="w-14 sm:w-16 h-14 sm:h-16 mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="32" cy="32" r="28" fill="white" fillOpacity="0.9" />
                    <path d="M32 20v14l10 6" stroke="#1a202c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="32" cy="32" r="16" stroke="#8b5cf6" strokeWidth="2.5" fill="none" />
                    <rect x="28" y="48" width="8" height="5" rx="2.5" fill="#a855f7" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-purple-300">Never Miss a Date</h3>
                <p className="text-sm sm:text-base text-white/70">
                  Automated email reminders for payments, renewals, and cancellation deadlines. Stay ahead of every important date.
                </p>
              </div>
            </motion.div>

            {/* Feature 3 - Analytics */}
            <motion.div
              whileHover={{ y: -10, scale: 1.02 }}
              className="relative group"
            >
              <div className="glass-card p-6 sm:p-8 h-full text-center">
                <div className="w-14 sm:w-16 h-14 sm:h-16 mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="8" y="12" width="48" height="40" rx="8" fill="white" fillOpacity="0.9" />
                    <rect x="16" y="36" width="6" height="14" rx="3" fill="#10b981" />
                    <rect x="26" y="26" width="6" height="24" rx="3" fill="#059669" />
                    <rect x="36" y="18" width="6" height="32" rx="3" fill="#047857" />
                    <rect x="46" y="28" width="6" height="22" rx="3" fill="#065f46" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-emerald-300">Financial Insights</h3>
                <p className="text-sm sm:text-base text-white/70">
                  Visualize your spending patterns, track contract costs, and understand your financial commitments at a glance.
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Benefits Section */}
      <section className="relative z-10 container mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 sm:mb-12 px-2">
            Why choose PlanPago?
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 text-left">
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-5 sm:w-6 h-5 sm:h-6 rounded-full bg-green-500 flex items-center justify-center mt-1 flex-shrink-0">
                  <span className="text-white text-xs sm:text-sm">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">100% GDPR Compliant</h4>
                  <p className="text-sm sm:text-base text-white/70">Your data is encrypted and stored securely on EU servers in South Tyrol, Italy.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-5 sm:w-6 h-5 sm:h-6 rounded-full bg-green-500 flex items-center justify-center mt-1 flex-shrink-0">
                  <span className="text-white text-xs sm:text-sm">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">Secure Document Storage</h4>
                  <p className="text-sm sm:text-base text-white/70">Upload and store your contracts with military-grade encryption and HTTPS protection.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-5 sm:w-6 h-5 sm:h-6 rounded-full bg-green-500 flex items-center justify-center mt-1 flex-shrink-0">
                  <span className="text-white text-xs sm:text-sm">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">Easy Export & Backup</h4>
                  <p className="text-sm sm:text-base text-white/70">Export your data anytime in CSV or PDF format. Your data, your control.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-5 sm:w-6 h-5 sm:h-6 rounded-full bg-green-500 flex items-center justify-center mt-1 flex-shrink-0">
                  <span className="text-white text-xs sm:text-sm">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">Multi-Device Access</h4>
                  <p className="text-sm sm:text-base text-white/70">Access your contracts from any device with our responsive web application.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-5 sm:w-6 h-5 sm:h-6 rounded-full bg-green-500 flex items-center justify-center mt-1 flex-shrink-0">
                  <span className="text-white text-xs sm:text-sm">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">Smart Analytics</h4>
                  <p className="text-sm sm:text-base text-white/70">Understand your spending with interactive charts and financial insights.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-5 sm:w-6 h-5 sm:h-6 rounded-full bg-green-500 flex items-center justify-center mt-1 flex-shrink-0">
                  <span className="text-white text-xs sm:text-sm">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">Two-Factor Authentication</h4>
                  <p className="text-sm sm:text-base text-white/70">Enhanced security with email codes or authenticator app support.</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 container mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.8 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="glass-card p-8 sm:p-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
              Ready to take control of your contracts?
            </h2>
            <p className="text-lg sm:text-xl text-white/80 mb-6 sm:mb-8">
              Join thousands of users who trust PlanPago to manage their financial commitments.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 text-lg sm:text-xl font-semibold rounded-xl"
              style={{
                background: "linear-gradient(135deg, #61dafb 0%, #ff61d9 100%)",
                boxShadow: "0 8px 32px rgba(97, 218, 251, 0.3)",
                border: "none",
                color: "white"
              }}
              onClick={() => navigate("/register")}
            >
              Start Free Today
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-6 sm:py-8">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <img src="/PlanPago-trans.png" alt="PlanPago" className="h-5 sm:h-6 w-5 sm:w-6" />
              <span className="text-base sm:text-lg font-semibold">PlanPago</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-xs sm:text-sm text-white/70 text-center">
              <span>&copy; {new Date().getFullYear()} PlanPago</span>
              <div className="flex flex-wrap justify-center gap-3 sm:gap-6">
                <a href="/imprint" className="hover:text-white transition-colors">
                  Imprint & Contact
                </a>
                <a href="/privacypolicy" className="hover:text-white transition-colors">
                  Privacy Policy
                </a>
                <a href="/terms" className="hover:text-white transition-colors">
                  Terms & Conditions
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}
