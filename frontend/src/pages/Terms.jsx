import React from "react";
import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 pt-24">
      <div className="glass-card w-full max-w-2xl p-8 animate-pop">
        <h1 className="text-3xl font-bold mb-8 text-center text-white drop-shadow">Terms and Conditions (AGB)</h1>
        <div className="prose prose-invert max-w-none text-white/90">
          <ol className="list-decimal pl-6 space-y-6">
            <li>
              <h2 className="text-xl font-semibold mb-2">Scope</h2>
              <p>
                These Terms and Conditions ("Terms") govern the use of the PlanPago web application ("Service"), provided by the operator. By registering or using the Service, you agree to these Terms.
              </p>
            </li>
            <li>
              <h2 className="text-xl font-semibold mb-2">Registration & Account</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>You must provide a valid email address and a secure password to register.</li>
                <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
                <li>Accounts are personal and may not be shared or transferred.</li>
                <li>You must be at least 18 years old or have the consent of a legal guardian.</li>
              </ul>
            </li>
            <li>
              <h2 className="text-xl font-semibold mb-2">Features & Usage</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>PlanPago allows you to manage contracts, recurring payments, and receive reminders.</li>
                <li>All contract data is visible only to the account owner and the operator.</li>
                <li>Automated email reminders are sent based on your settings.</li>
                <li>Uploaded documents (PDFs, images) are stored on the server, are <b>securely encrypted server-side using strong encryption methods</b>, and may be accessed by the operator for support purposes. <b>The physical storage location of all uploaded files is in Italy/South Tyrol.</b></li>
                <li>All data transfers, including file uploads and downloads, are strictly enforced via HTTPS connections only.</li>
                <li>It is your responsibility to keep your profile data (email, country, currency) up to date.</li>
              </ul>
            </li>
            <li>
              <h2 className="text-xl font-semibold mb-2">Data Protection & Security</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Your data is stored securely <b>on servers located in Italy/South Tyrol</b>.</li>
                <li>Passwords are stored using strong encryption.</li>
                <li>Access to your data is protected by JWT-based authentication and 2-Factor Authentication (2FA).</li>
                <li>All connections to the Service are encrypted and enforced via HTTPS.</li>
                <li>We do not share your data with third parties except as required by law.</li>
              </ul>
            </li>
            <li>
              <h2 className="text-xl font-semibold mb-2">User Obligations</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>You must not use the Service for unlawful purposes.</li>
                <li>You are responsible for the accuracy of the data you enter.</li>
                <li>Abuse, hacking attempts, or unauthorized access will result in account termination.</li>
              </ul>
            </li>
            <li>
              <h2 className="text-xl font-semibold mb-2">Account Deletion</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>You may delete your account at any time. All your contracts and uploaded files will be permanently removed.</li>
                <li>Deleted data cannot be restored.</li>
              </ul>
            </li>
            <li>
              <h2 className="text-xl font-semibold mb-2">Limitation of Liability</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>The Service is provided "as is" without warranty of any kind.</li>
                <li>We are not liable for missed reminders, data loss, or damages resulting from the use of the Service.</li>
                <li>It is your responsibility to verify the correctness of all data and reminders.</li>
              </ul>
            </li>
            <li>
              <h2 className="text-xl font-semibold mb-2">Changes to the Terms</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>We reserve the right to update these Terms at any time. You will be notified of significant changes.</li>
                <li>Continued use of the Service after changes constitutes acceptance of the new Terms.</li>
              </ul>
            </li>
            <li>
              <h2 className="text-xl font-semibold mb-2">Contact</h2>
              <p>
                For questions regarding these Terms, please contact the operator at <a href="mailto:planpago.contact@gmail.com" className="underline">planpago.contact@gmail.com</a>.
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
