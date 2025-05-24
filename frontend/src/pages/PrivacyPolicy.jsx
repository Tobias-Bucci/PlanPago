import React from "react";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 pt-24">
            <div className="glass-card w-full max-w-2xl p-8 animate-pop">
                <h1 className="text-3xl font-bold mb-8 text-center text-white drop-shadow">Privacy Policy</h1>
                <div className="prose prose-invert max-w-none text-white/90 space-y-4">
                    <p><strong>Responsible entity (Data Controller):</strong></p>
                    <p>
                        Tobias Bucci<br />
                        Muehlenweg 51<br />
                        39030 St. Sigmund, Municipality of Kiens<br />
                        South Tyrol, Italy<br />
                        E-Mail: <a href="mailto:planpago.contact@gmail.com" className="underline">planpago.contact@gmail.com</a>
                    </p>

                    <h2 className="text-xl font-semibold mt-6 mb-2">1. Purpose and Scope</h2>
                    <p>
                        This Privacy Policy explains how personal data is collected, processed, and stored when using the PlanPago web application.
                    </p>

                    <h2 className="text-xl font-semibold mt-6 mb-2">2. Legal Basis</h2>
                    <p>
                        We process your personal data in accordance with Art. 6(1)(b) GDPR (performance of a contract) and Art. 6(1)(a) GDPR (consent), where applicable.
                    </p>

                    <h2 className="text-xl font-semibold mt-6 mb-2">3. Data We Collect</h2>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Email address (required for registration and login)</li>
                        <li>Country and currency settings</li>
                        <li>Contract and payment-related data you enter</li>
                        <li>Uploaded documents (PDFs, images)</li>
                        <li>Technical information (e.g., IP address, browser type)</li>
                        <li>Authentication tokens (JWT) stored in your browser</li>
                        <li>LocalStorage entries for user preferences</li>
                    </ul>

                    <h2 className="text-xl font-semibold mt-6 mb-2">4. Data Storage and Security</h2>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>All data is stored on self-hosted servers located in South Tyrol, Italy.</li>
                        <li>Uploaded documents are encrypted server-side using strong encryption standards.</li>
                        <li>Passwords are hashed using secure algorithms and never stored in plain text.</li>
                        <li>Access is protected by secure authentication mechanisms, including optional 2FA.</li>
                        <li>All data transfers are enforced via HTTPS.</li>
                    </ul>

                    <h2 className="text-xl font-semibold mt-6 mb-2">5. Cookies & LocalStorage</h2>
                    <p>
                        PlanPago does not use tracking cookies or third-party analytics tools.
                        We use LocalStorage and JWT cookies only for essential functionality, such as:
                    </p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Storing session and authentication tokens</li>
                        <li>Saving your selected preferences (e.g., country or currency)</li>
                    </ul>
                    <p>
                        No data is shared with third parties via cookies or tracking.
                    </p>

                    <h2 className="text-xl font-semibold mt-6 mb-2">6. User Rights (GDPR Articles 15–21)</h2>
                    <p>You have the right to:</p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Access the data we store about you</li>
                        <li>Correct incorrect or outdated information</li>
                        <li>Delete your data ("right to be forgotten")</li>
                        <li>Withdraw your consent at any time (where applicable)</li>
                        <li>Request data portability</li>
                        <li>Object to processing under certain conditions</li>
                    </ul>
                    <p>
                        You can manage or delete your data through the profile section. You may also contact us directly for requests.
                    </p>

                    <h2 className="text-xl font-semibold mt-6 mb-2">7. Data Retention</h2>
                    <p>
                        Data is stored for as long as your account is active. Upon account deletion, all related data and documents are permanently removed and cannot be recovered.
                    </p>

                    <h2 className="text-xl font-semibold mt-6 mb-2">8. Changes to This Policy</h2>
                    <p>
                        We may update this Privacy Policy from time to time. Users will be notified of any significant changes via email or through the app.
                    </p>

                    <h2 className="text-xl font-semibold mt-6 mb-2">9. Contact</h2>
                    <p>
                        If you have questions or concerns about this policy, please contact us at <a href="mailto:planpago.contact@gmail.com" className="underline">planpago.contact@gmail.com</a>.
                    </p>

                    <p className="text-xs text-white/60 mt-8">Last updated: May 2025</p>
                </div>
            </div>
        </div>
    );
}
