export default function Impressum() {
    return (
        <div className="min-h-screen" style={{
            position: "relative",
            overflow: "hidden",
            background: "linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #2d3748 50%, #1a202c 75%, #0f1419 100%)"
        }}>
            <main className="container mx-auto pt-24 p-6 animate-fadeIn" style={{ position: "relative", zIndex: 10 }}>
                <div className="max-w-4xl mx-auto animate-pop">
                    <div className="glass-card p-8">
                        <h1 className="text-3xl font-bold mb-8 text-center text-white drop-shadow">Legal Notice & Contact</h1>

                        <div className="prose prose-invert max-w-none text-white/90 space-y-6">
                            <section>
                                <h2 className="text-2xl font-semibold text-white mb-4">Website Operator</h2>
                                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                    <p className="mb-2"><strong>Private Individual:</strong></p>
                                    <div className="space-y-1">
                                        <p>Tobias Bucci</p>
                                        <p>Mühlenweg 51</p>
                                        <p>39030 St. Sigmund, Municipality of Kiens</p>
                                        <p>South Tyrol (BZ), Italy</p>
                                        <p>
                                            Email: <a href="mailto:planpago.contact@gmail.com"
                                                className="text-blue-400 hover:text-blue-300 underline transition-colors">
                                                planpago.contact@gmail.com
                                            </a>
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-white mb-4">Purpose & Nature</h2>
                                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                    <p>
                                        This privately maintained website is intended exclusively for personal contract management purposes.
                                        It does not pursue any commercial objectives and is not a registered business activity under Italian law.
                                    </p>
                                </div>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-white mb-4">Contact & Support</h2>
                                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                    <p className="mb-4">
                                        For any legal inquiries, support questions, or feedback, please contact us via email.
                                        We are happy to help and respond to your concerns.
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

                            <section>
                                <h2 className="text-2xl font-semibold text-white mb-4">Disclaimer</h2>
                                <div className="bg-amber-900/20 rounded-xl p-6 border border-amber-500/30">
                                    <p className="text-amber-200">
                                        <strong>Important:</strong> Despite careful content control, we assume no liability for the content of external links.
                                        The responsibility for the content of linked pages lies solely with their respective operators.
                                    </p>
                                </div>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-white mb-4">Additional Information</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                        <h3 className="text-lg font-semibold text-white mb-2">Technical Information</h3>
                                        <ul className="space-y-1 text-sm">
                                            <li>Server Location: Europe</li>
                                            <li>Data Processing: GDPR Compliant</li>
                                            <li>Hosting: Secure Infrastructure</li>
                                        </ul>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                        <h3 className="text-lg font-semibold text-white mb-2">Legal Framework</h3>
                                        <ul className="space-y-1 text-sm">
                                            <li>Jurisdiction: Italy</li>
                                            <li>Privacy: EU Regulations</li>
                                            <li>Terms: Available on website</li>
                                        </ul>
                                    </div>
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
