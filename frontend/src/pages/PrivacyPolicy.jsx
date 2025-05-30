import React from "react";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen" style={{
            position: "relative",
            overflow: "hidden",
            background: "linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #2d3748 50%, #1a202c 75%, #0f1419 100%)"
        }}>
            <main className="container mx-auto pt-24 p-6 animate-fadeIn" style={{ position: "relative", zIndex: 10 }}>
                <div className="max-w-4xl mx-auto animate-pop">
                    <div className="glass-card p-8">
                        <h1 className="text-3xl font-bold mb-8 text-center text-white drop-shadow">Privacy Policy</h1>

                        <div className="prose prose-invert max-w-none text-white/90 space-y-6">
                            <section>
                                <h2 className="text-2xl font-semibold text-white mb-4">1. Data Controller</h2>
                                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                    <p>
                                        The data controller for this website is Tobias Bucci, Mühlenweg 51, 39030 St. Sigmund,
                                        Municipality of Kiens, South Tyrol (BZ), Italy. Contact: planpago.contact@gmail.com
                                    </p>
                                </div>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-white mb-4">2. Data We Collect</h2>
                                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                    <h3 className="text-lg font-semibold text-white mb-3">Personal Information</h3>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>Email address (for account creation and communication)</li>
                                        <li>Password (encrypted and stored securely)</li>
                                        <li>Country and currency preferences</li>
                                        <li>Contract and subscription data you enter</li>
                                        <li>File attachments you upload</li>
                                    </ul>

                                    <h3 className="text-lg font-semibold text-white mb-3 mt-6">Technical Information</h3>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>IP address and browser information</li>
                                        <li>Usage patterns and access logs</li>
                                        <li>Device and system information</li>
                                    </ul>
                                </div>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Data</h2>
                                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>To provide and maintain the contract management service</li>
                                        <li>To authenticate users and secure accounts</li>
                                        <li>To send email reminders and notifications (if enabled)</li>
                                        <li>To provide customer support and respond to inquiries</li>
                                        <li>To improve our service and fix technical issues</li>
                                        <li>To ensure security and prevent unauthorized access</li>
                                    </ul>
                                </div>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-white mb-4">4. Legal Basis for Processing</h2>
                                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                    <p>
                                        We process your personal data based on:
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2 mt-3">
                                        <li><strong>Contract fulfillment:</strong> To provide the services you've requested</li>
                                        <li><strong>Legitimate interest:</strong> To improve our service and ensure security</li>
                                        <li><strong>Consent:</strong> For optional features like email reminders</li>
                                    </ul>
                                </div>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-white mb-4">5. Data Sharing and Disclosure</h2>
                                <div className="bg-emerald-900/20 rounded-xl p-6 border border-emerald-500/30">
                                    <p className="text-emerald-200">
                                        <strong>We do not sell, trade, or share your personal data with third parties</strong> except in the following limited circumstances:
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2 mt-3 text-emerald-200">
                                        <li>When required by law or legal process</li>
                                        <li>To protect our rights, property, or safety</li>
                                        <li>With your explicit consent</li>
                                    </ul>
                                </div>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-white mb-4">6. Data Security</h2>
                                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                    <p className="mb-3">We implement comprehensive security measures to protect your data:</p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>All passwords are encrypted using industry-standard methods</li>
                                        <li>Data transmission is secured with HTTPS encryption</li>
                                        <li>Regular security updates and monitoring</li>
                                        <li>Access controls and authentication systems</li>
                                        <li>Secure server infrastructure in European data centers</li>
                                    </ul>
                                </div>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-white mb-4">7. Your Rights (GDPR)</h2>
                                <div className="bg-blue-900/20 rounded-xl p-6 border border-blue-500/30">
                                    <p className="text-blue-200 mb-3">Under GDPR, you have the following rights:</p>
                                    <ul className="list-disc pl-6 space-y-2 text-blue-200">
                                        <li><strong>Access:</strong> Request a copy of your personal data</li>
                                        <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
                                        <li><strong>Erasure:</strong> Request deletion of your data</li>
                                        <li><strong>Portability:</strong> Export your data in a structured format</li>
                                        <li><strong>Objection:</strong> Object to processing of your data</li>
                                        <li><strong>Restriction:</strong> Limit how we process your data</li>
                                    </ul>
                                    <p className="text-blue-200 mt-3">
                                        To exercise these rights, contact us at planpago.contact@gmail.com
                                    </p>
                                </div>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-white mb-4">8. Data Retention</h2>
                                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                    <p>
                                        We retain your data only as long as necessary to provide our services and comply with legal obligations:
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2 mt-3">
                                        <li>Account data: Until account deletion</li>
                                        <li>Contract data: Until you delete the contracts or your account</li>
                                        <li>Log files: Maximum 12 months for security purposes</li>
                                        <li>Email communications: Until account deletion</li>
                                    </ul>
                                </div>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-white mb-4">9. Cookies and Tracking</h2>
                                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                    <p>
                                        We use minimal tracking to ensure functionality:
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2 mt-3">
                                        <li><strong>Essential cookies:</strong> For authentication and basic functionality</li>
                                        <li><strong>Local storage:</strong> To save your preferences and settings</li>
                                        <li><strong>No third-party analytics:</strong> We do not use Google Analytics or similar services</li>
                                    </ul>
                                </div>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-white mb-4">10. Changes to This Policy</h2>
                                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                    <p>
                                        We may update this privacy policy from time to time. Any changes will be posted on this page
                                        with an updated "last modified" date. We encourage you to review this policy periodically.
                                    </p>
                                </div>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-white mb-4">11. Contact Us</h2>
                                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                    <p className="mb-4">
                                        If you have any questions about this privacy policy or our data practices, please contact us:
                                    </p>
                                    <a href="mailto:planpago.contact@gmail.com"
                                        className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-lg">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        Contact us
                                    </a>
                                </div>
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
