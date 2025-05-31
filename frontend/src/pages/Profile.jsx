import { API_BASE } from "../config";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Globe, DollarSign, Settings, Shield, Trash2, Bell } from "lucide-react";
import ConfirmModal from "../components/ConfirmModal";
import Notification from "../components/Notification";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import CountryAutoComplete, { isValidCountry } from "../utils/CountryAutoComplete";

const passwordValid = pw =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(pw);

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("success");
  const [err, setErr] = useState("");

  // Profile data
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Add password validation states
  const [pwError, setPwError] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Settings data
  const [emailReminders, setEmailReminders] = useState(true);
  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState("EUR");

  // Confirmation modal
  const [deleteModal, setDeleteModal] = useState({ open: false });

  // 2FA verification
  const [verificationStep, setVerificationStep] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [twofaMethod, setTwofaMethod] = useState("email");

  const navigate = useNavigate();
  const API = API_BASE;

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetchWithAuth(`${API}/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        }, navigate);

        if (!response.ok) {
          throw new Error("Failed to load user data");
        }

        const userData = await response.json();
        setUser(userData);
        setEmail(userData.email);
        setEmailReminders(userData.email_reminders_enabled ?? true);
        setCountry(userData.country || "");
        setCurrency(userData.currency || "EUR");
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [API, navigate]);

  // Update profile (email/password)
  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    if (!oldPassword) {
      setErr("Current password is required");
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setErr("New passwords don't match");
      return;
    }

    if (newPassword && !passwordValid(newPassword)) {
      setErr("New password does not meet requirements");
      return;
    }

    if (!email && !newPassword) {
      setErr("Nothing to update");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const updateData = { old_password: oldPassword };

      if (email !== user.email) updateData.email = email;
      if (newPassword) updateData.password = newPassword;

      const response = await fetchWithAuth(`${API}/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      }, navigate);

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const result = await response.json();

      if (result.temp_token) {
        setTempToken(result.temp_token);
        setTwofaMethod(result.twofa_method);
        setVerificationStep(true);
        setMsg("Verification code sent. Please check your email or authenticator app.");
        setMsgType("info");
      } else {
        setUser(result);
        setMsg("Profile updated successfully");
        setMsgType("success");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  // Confirm profile update with 2FA
  const handleProfileConfirm = async (e) => {
    e.preventDefault();

    if (!verificationCode) {
      setErr("Verification code is required");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetchWithAuth(`${API}/users/me/confirm`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          temp_token: tempToken,
          code: verificationCode
        })
      }, navigate);

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const result = await response.json();
      setUser(result);
      setEmail(result.email);
      localStorage.setItem("currentEmail", result.email);

      setMsg("Profile updated successfully");
      setMsgType("success");
      setVerificationStep(false);
      setVerificationCode("");
      setTempToken("");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  // Update settings
  const handleSettingsUpdate = async (e) => {
    e.preventDefault();

    // Validate country before saving
    if (!isValidCountry(country)) {
      setErr("Please select a valid country from the suggestions");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetchWithAuth(`${API}/users/me/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          email_reminders_enabled: emailReminders,
          country: country,
          currency: currency
        })
      }, navigate);

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const result = await response.json();
      setUser(result);

      // Update local storage
      localStorage.setItem(`country_${result.email}`, result.country || "");
      localStorage.setItem(`currency_${result.email}`, result.currency || "EUR");

      setMsg("Settings updated successfully");
      setMsgType("success");
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetchWithAuth(`${API}/users/me`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      }, navigate);

      if (!response.ok) {
        throw new Error(await response.text());
      }

      localStorage.clear();
      navigate("/", { replace: true });
    } catch (e) {
      setErr(e.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: "linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #2d3748 50%, #1a202c 75%, #0f1419 100%)"
      }}>
        <div className="glass-card p-12 text-center animate-pop">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white/70 mb-4"></div>
          <p className="text-white/70">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{
      background: "linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #2d3748 50%, #1a202c 75%, #0f1419 100%)"
    }}>

      {/* Notifications */}
      <div className="fixed top-4 right-4 z-[9999]">
        {msg && <Notification message={msg} type={msgType} onDone={() => setMsg("")} />}
        {err && <Notification message={err} type="error" onDone={() => setErr("")} />}
      </div>

      <main className="container mx-auto pt-24 p-6 animate-fadeIn">

        {/* Header */}
        <div className="mb-8 animate-pop">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <User size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-white mb-2">Profile & Settings</h1>
              <p className="text-white/70 text-lg">
                Manage your account and preferences
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 animate-pop">
          <div className="flex border-b border-white/20">
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-6 py-3 font-medium transition-colors ${activeTab === "profile"
                ? "text-white border-b-2 border-blue-500"
                : "text-white/70 hover:text-white"
                }`}
            >
              <User size={20} className="inline mr-2" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-6 py-3 font-medium transition-colors ${activeTab === "settings"
                ? "text-white border-b-2 border-blue-500"
                : "text-white/70 hover:text-white"
                }`}
            >
              <Settings size={20} className="inline mr-2" />
              Settings
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`px-6 py-3 font-medium transition-colors ${activeTab === "security"
                ? "text-white border-b-2 border-blue-500"
                : "text-white/70 hover:text-white"
                }`}
            >
              <Shield size={20} className="inline mr-2" />
              Security
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="glass-card p-8 animate-pop">

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                <Mail size={24} />
                Account Information
              </h2>

              {!verificationStep ? (
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div>
                    <label className="block text-white/80 mb-2">Email Address</label>
                    <input
                      type="email"
                      className="frosted-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 mb-2">Current Password *</label>
                    <input
                      type="password"
                      className="frosted-input"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Enter current password"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 mb-2">New Password (optional)</label>
                    <div className="relative">
                      <input
                        type={showNewPw ? "text" : "password"}
                        className="frosted-input pr-10"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setPwError(e.target.value && !passwordValid(e.target.value)
                            ? "Password must be at least 8 characters, include upper/lowercase, number, and special character."
                            : "");
                        }}
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70"
                        onClick={() => setShowNewPw(v => !v)}
                        aria-label={showNewPw ? "Hide password" : "Show password"}
                      >
                        {showNewPw ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.956 9.956 0 012.223-3.592m3.31-2.687A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.956 9.956 0 01-4.043 5.306M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>
                        )}
                      </button>
                    </div>
                    {pwError && <div className="text-red-400 text-sm mt-1">{pwError}</div>}
                  </div>

                  {newPassword && (
                    <div>
                      <label className="block text-white/80 mb-2">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPw ? "text" : "password"}
                          className="frosted-input pr-10"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70"
                          onClick={() => setShowConfirmPw(v => !v)}
                          aria-label={showConfirmPw ? "Hide password" : "Show password"}
                        >
                          {showConfirmPw ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.956 9.956 0 012.223-3.592m3.31-2.687A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.956 9.956 0 01-4.043 5.306M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>
                          )}
                        </button>
                      </div>
                      {newPassword !== confirmPassword && confirmPassword && (
                        <div className="text-red-400 text-sm mt-1">Passwords don't match</div>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn-primary px-8 py-3"
                    disabled={saving || (newPassword && (!passwordValid(newPassword) || newPassword !== confirmPassword))}
                  >
                    {saving ? "Updating..." : "Update Profile"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleProfileConfirm} className="space-y-6">
                  <div className="p-4 bg-blue-600/20 text-blue-300 rounded-lg">
                    <p className="mb-2">
                      {twofaMethod === "totp"
                        ? "Enter the 6-digit code from your authenticator app:"
                        : "Enter the 6-digit code sent to your email:"
                      }
                    </p>
                  </div>

                  <div>
                    <label className="block text-white/80 mb-2">Verification Code</label>
                    <input
                      type="text"
                      className="frosted-input"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="000000"
                      maxLength={6}
                      required
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className="btn-primary px-8 py-3"
                      disabled={saving}
                    >
                      {saving ? "Confirming..." : "Confirm Changes"}
                    </button>
                    <button
                      type="button"
                      className="btn-accent px-8 py-3"
                      onClick={() => {
                        setVerificationStep(false);
                        setVerificationCode("");
                        setTempToken("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                <Settings size={24} />
                Preferences
              </h2>

              <form onSubmit={handleSettingsUpdate} className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                  <Bell size={20} className="text-white/70" />
                  <div className="flex-1">
                    <label className="block text-white/80 font-medium">Email Reminders</label>
                    <p className="text-white/60 text-sm">Receive email notifications for contract renewals and payments</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={emailReminders}
                      onChange={(e) => setEmailReminders(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-white/80 mb-2 flex items-center gap-2">
                      <Globe size={20} />
                      Country
                    </label>
                    <CountryAutoComplete
                      value={country}
                      onChange={setCountry}
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-white/80 mb-2 flex items-center gap-2">
                      <DollarSign size={20} />
                      Currency
                    </label>
                    <select
                      className="frosted-input"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                    >
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CHF">CHF</option>
                      <option value="JPY">JPY (¥)</option>
                      <option value="CAD">CAD</option>
                      <option value="AUD">AUD</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary px-8 py-3"
                  disabled={saving || !isValidCountry(country)}
                >
                  {saving ? "Saving..." : "Save Settings"}
                </button>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                <Shield size={24} />
                Security & Privacy
              </h2>

              <div className="space-y-6">
                <div className="p-4 bg-white/5 rounded-lg">
                  <h3 className="text-lg font-medium text-white mb-2">Two-Factor Authentication</h3>
                  <p className="text-white/70 mb-4">
                    Your account is secured with {user?.twofa_method === "totp" ? "Authenticator App (TOTP)" : "Email Codes"}
                  </p>
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-600/20 text-green-300 text-sm">
                    <Shield size={16} className="mr-2" />
                    2FA Enabled ({user?.twofa_method === "totp" ? "TOTP" : "Email"})
                  </div>
                </div>

                <div className="p-4 bg-red-600/10 border border-red-500/30 rounded-lg">
                  <h3 className="text-lg font-medium text-red-300 mb-2 flex items-center gap-2">
                    <Trash2 size={20} />
                    Delete Account
                  </h3>
                  <p className="text-white/70 mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <button
                    onClick={() => setDeleteModal({ open: true })}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 mt-16">
        <div className="container mx-auto px-6">
          <div className="flex flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <img src="/PlanPago-trans.png" alt="PlanPago" className="h-6 w-6" />
              <span className="text-lg font-semibold text-white">PlanPago</span>
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

      {/* Delete Account Confirmation Modal */}
      <ConfirmModal
        open={deleteModal.open}
        title="Delete Account"
        message="Are you sure you want to delete your account? This will permanently remove all your contracts, files, and personal data. This action cannot be undone."
        onConfirm={() => {
          setDeleteModal({ open: false });
          handleDeleteAccount();
        }}
        onClose={() => setDeleteModal({ open: false })}
        confirmText="Delete Forever"
        cancelText="Keep Account"
      />
    </div>
  );
}
