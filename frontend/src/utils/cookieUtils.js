// Cookie utility functions for secure cookie management

export const cookieUtils = {
    // Set a cookie with optional expiration and security settings
    set: (name, value, days = 7, secure = true) => {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = `expires=${date.toUTCString()}`;
        const sameSite = 'SameSite=Strict';
        const secureFlag = secure && window.location.protocol === 'https:' ? 'Secure' : '';

        document.cookie = `${name}=${value}; ${expires}; path=/; ${sameSite}; ${secureFlag}`;
    },

    // Get a cookie value by name
    get: (name) => {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    },

    // Remove a cookie
    remove: (name) => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`;
    },

    // Clear all cookies
    clearAll: () => {
        const cookies = document.cookie.split(";");
        for (let cookie of cookies) {
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            if (name) {
                cookieUtils.remove(name);
            }
        }
    },

    // Check if cookies are accepted
    areCookiesAccepted: () => {
        return cookieUtils.get('cookieConsent') === 'accepted';
    },

    // Accept cookies
    acceptCookies: () => {
        cookieUtils.set('cookieConsent', 'accepted', 365); // Store consent for 1 year
    }
};

// Auth-specific cookie utilities
export const authCookies = {
    setToken: (token) => {
        if (cookieUtils.areCookiesAccepted()) {
            cookieUtils.set('authToken', token, 7); // 7 days expiration
        }
    },

    getToken: () => {
        return cookieUtils.areCookiesAccepted() ? cookieUtils.get('authToken') : null;
    },

    removeToken: () => {
        cookieUtils.remove('authToken');
    },

    setUserEmail: (email) => {
        if (cookieUtils.areCookiesAccepted()) {
            cookieUtils.set('currentEmail', email, 7);
        }
    },

    getUserEmail: () => {
        return cookieUtils.areCookiesAccepted() ? cookieUtils.get('currentEmail') : null;
    },

    removeUserEmail: () => {
        cookieUtils.remove('currentEmail');
    },

    setUserPreference: (key, value) => {
        if (cookieUtils.areCookiesAccepted()) {
            cookieUtils.set(key, value, 30); // 30 days for preferences
        }
    },

    getUserPreference: (key) => {
        return cookieUtils.areCookiesAccepted() ? cookieUtils.get(key) : null;
    },

    removeUserPreference: (key) => {
        cookieUtils.remove(key);
    }
};
