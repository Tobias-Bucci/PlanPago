import React, { useState, useEffect } from 'react';
import { cookieUtils } from '../utils/cookieUtils';

export default function CookieConsent() {
    const [showConsent, setShowConsent] = useState(false);

    useEffect(() => {
        // Check if user has already given consent
        if (!cookieUtils.areCookiesAccepted()) {
            setShowConsent(true);
        }
    }, []);

    const handleAccept = () => {
        cookieUtils.acceptCookies();
        setShowConsent(false);
    };

    const handleDecline = () => {
        // If declined, clear any existing cookies and redirect to homepage
        cookieUtils.clearAll();
        setShowConsent(false);
        window.location.href = '/';
    };

    if (!showConsent) return null;

    return (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="glass-card p-8 w-full max-w-md mx-4 animate-pop">
                <div className="text-center mb-6">
                    <div className="text-4xl mb-4">🍪</div>
                    <h3 className="text-xl font-semibold text-white mb-4">Cookie Consent</h3>
                </div>

                <div className="space-y-4 mb-6">
                    <p className="text-white/90">
                        We use cookies to enhance your experience and provide essential functionality including:
                    </p>
                    <ul className="text-white/80 text-sm space-y-2 list-disc list-inside ml-4">
                        <li>Authentication and security</li>
                        <li>Saving your preferences and settings</li>
                        <li>Ensuring proper application functionality</li>
                    </ul>
                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                        <p className="text-blue-200 text-sm">
                            By clicking "Accept", you agree to our use of cookies. You can manage your cookie preferences in your browser settings.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleAccept}
                        className="btn-primary w-full py-3 text-lg font-semibold"
                    >
                        Accept Cookies
                    </button>
                    <button
                        onClick={handleDecline}
                        className="btn-accent w-full py-3"
                    >
                        Decline
                    </button>
                </div>

                <div className="mt-4 text-center">
                    <p className="text-white/60 text-xs">
                        For more information, see our{' '}
                        <a href="/privacypolicy" className="underline text-white/80 hover:text-white">
                            Privacy Policy
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
