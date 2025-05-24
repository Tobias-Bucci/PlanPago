import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 pt-24">
      <div className="glass-card w-full max-w-2xl p-8 animate-pop">
        <h1 className="text-3xl font-bold mb-8 text-center text-white drop-shadow">Terms and Conditions</h1>
        <div className="prose prose-invert max-w-none text-white/90">
          <ol className="list-decimal pl-6 space-y-6">
            <li>
              <h2 className="text-xl font-semibold mb-2">Scope</h2>
              <p>
                These Terms and Conditions ("Terms") govern the use of the PlanPago web application ("Service"), provided by the operator based in Italy. By registering or using the Service, you confirm your agreement to these Terms.
              </p>
            </li>
            <li>
              <h2 className="text-xl font-semibold mb-2">Registration & Account</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>You must provide a valid email address and a secure password to register.</li>
                <li>You are responsible for keeping your login credentials confidential.</li>
                <li>Accounts are personal and may not be shared or transferred.</li>
                <li>You must be at least 18 years old or have permission from a legal guardian.</li>
              </ul>
            </li>
            <li>
              <h2 className="text-xl font-semibold mb-2">Features & Usage</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>PlanPago allows you to manage contracts, set reminders, and track recurring payments.</li>
                <li>Uploaded documents (PDFs, images) are encrypted and stored securely on servers located in South Tyrol, Italy.</li>
                <li>Only the account owner and, for technical support, the operator have access to the data.</li>
                <li>All file uploads and communications are strictly encrypted via HTTPS.</li>
                <li>Email reminders are sent based on your personal settings.</li>
              </ul>
            </li>
            <li>
              <h2 className="text-xl font-semibold mb-2">Data Protection & Security</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Data is stored securely in compliance with the EU General Data Protection Regulation (GDPR).</li>
                <li>Passwords are hashed using industry-standard algorithms.</li>
                <li>Access to data is protected through JWT-based authentication and optional 2-Factor Authentication (2FA).</li>
                <li>We do not share your data with third parties, unless required by law.</li>
              </ul>
            </li>
            <li>
              <h2 className="text-xl font-semibold mb-2">User Obligations</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>You must not use the Service for illegal purposes.</li>
                <li>You are responsible for the accuracy of the information you submit.</li>
                <li>Any abuse or unauthorized access may lead to account termination.</li>
              </ul>
            </li>
            <li>
              <h2 className="text-xl font-semibold mb-2">Account Deletion</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>You may delete your account at any time. All your data and uploaded documents will be permanently removed.</li>
                <li>Deleted data cannot be recovered.</li>
              </ul>
            </li>
            <li>
              <h2 className="text-xl font-semibold mb-2">Limitation of Liability</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>The Service is provided "as is", without any warranty of availability, accuracy, or suitability.</li>
                <li>We are not liable for missed reminders, data loss, or damage resulting from use of the Service.</li>
              </ul>
            </li>
            <li>
              <h2 className="text-xl font-semibold mb-2">Changes to the Terms</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>We reserve the right to update these Terms. You will be notified of any major changes.</li>
                <li>Continued use of the Service after changes implies your acceptance.</li>
              </ul>
            </li>
            <li>
              <h2 className="text-xl font-semibold mb-2">Contact</h2>
              <p>
                For questions about these Terms, please contact the operator at <a href="mailto:planpago.contact@gmail.com" className="underline">planpago.contact@gmail.com</a>.
              </p>
            </li>
          </ol>
          <p className="mt-10 text-xs text-white/60 text-center">Last updated: May 2025</p>
        </div>
        <div className="mt-8 text-center">
          <Link to="/register" className="btn-primary">Back to Registration</Link>
        </div>
      </div>
    </div>
  );
}
