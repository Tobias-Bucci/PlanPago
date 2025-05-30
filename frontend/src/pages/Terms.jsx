import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <div className="min-h-screen" style={{
      position: "relative",
      overflow: "hidden",
      background: "linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #2d3748 50%, #1a202c 75%, #0f1419 100%)"
    }}>
      <main className="container mx-auto pt-24 p-6 animate-fadeIn" style={{ position: "relative", zIndex: 10 }}>
        <div className="max-w-4xl mx-auto animate-pop">
          <div className="glass-card p-8">
            <h1 className="text-3xl font-bold mb-8 text-center text-white drop-shadow">Terms & Conditions</h1>

            <div className="prose prose-invert max-w-none text-white/90 space-y-6">
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
                <p>
                  By accessing and using PlanPago, you accept and agree to be bound by the terms and provision of this agreement.
                  If you do not agree to abide by the above, please do not use this service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
                <p>
                  PlanPago is a personal contract management application that allows users to track and manage their contracts,
                  subscriptions, and recurring payments. The service is provided for personal use only.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">3. User Responsibilities</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                  <li>You agree to provide accurate and complete information when creating your account</li>
                  <li>You are responsible for all activities that occur under your account</li>
                  <li>You must not use the service for any illegal or unauthorized purpose</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">4. Privacy and Data Protection</h2>
                <p>
                  Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service,
                  to understand our practices regarding the collection, use, and disclosure of your information.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">5. Service Availability</h2>
                <p>
                  While we strive to provide continuous service availability, we do not guarantee that the service will be
                  uninterrupted or error-free. We reserve the right to suspend or terminate the service for maintenance,
                  updates, or other operational reasons.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">6. Limitation of Liability</h2>
                <p>
                  PlanPago is provided on an "as is" basis. We make no warranties, expressed or implied, and hereby disclaim
                  and negate all other warranties including without limitation, implied warranties or conditions of merchantability,
                  fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">7. Changes to Terms</h2>
                <p>
                  We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting
                  on the website. Your continued use of the service after any such changes constitutes your acceptance of the new terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">8. Contact Information</h2>
                <p>
                  If you have any questions about these Terms & Conditions, please contact us at:{" "}
                  <a href="mailto:planpago.contact@gmail.com" className="text-blue-400 hover:text-blue-300 underline">
                    planpago.contact@gmail.com
                  </a>
                </p>
              </section>

              <div className="mt-8 pt-6 border-t border-white/20">
                <p className="text-sm text-white/60">
                  Last updated: {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8 mt-16">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <img src="/PlanPago-trans.png" alt="PlanPago" className="h-6 w-6" />
              <span className="text-lg font-semibold">PlanPago</span>
            </div>

            <div className="flex items-center gap-6 text-sm text-white/70">
              <span>&copy; {new Date().getFullYear()} PlanPago</span>
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
      </footer>
    </div>
  );
}
