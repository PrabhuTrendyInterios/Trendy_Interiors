/**
 * Local Storage Constants
 * Centralized definitions for all localStorage keys used in the application
 * Ensures consistent token naming across all components
 */

// Authentication tokens
export const STORAGE_KEYS = {
    // Primary auth token - used for API requests
    AUTH_TOKEN: 'authToken',
    
    // User data - stored when logged in
    USER: 'user',
    
    // User role - cached for quick access
    USER_ROLE: 'userRole',
    
    // Password reset token - temporary, single-use
    RESET_TOKEN: 'resetToken',
};

// Utility functions for consistent token management
export const AuthStorage = {
    /**
     * Store authentication token
     * @param {string} token - JWT token from server
     */
    setAuthToken: (token) => {
        if (token) {
            localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        }
    },

    /**
     * Retrieve authentication token
     * @returns {string|null} - JWT token or null if not found
     */
    getAuthToken: () => {
        return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    },

    /**
     * Check if user is authenticated
     * @returns {boolean} - True if token exists
     */
    hasAuthToken: () => {
        return !!localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    },

    /**
     * Store user data
     * @param {object} userData - User object from server
     */
    setUser: (userData) => {
        if (userData) {
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
        }
    },

    /**
     * Retrieve user data
     * @returns {object|null} - Parsed user object or null
     */
    getUser: () => {
        try {
            const user = localStorage.getItem(STORAGE_KEYS.USER);
            return user && user !== 'undefined' ? JSON.parse(user) : null;
        } catch (error) {
            console.error('Error parsing stored user:', error);
            return null;
        }
    },

    /**
     * Store user role
     * @param {string} role - User role (admin, user, etc)
     */
    setUserRole: (role) => {
        if (role) {
            localStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
        }
    },

    /**
     * Retrieve user role
     * @returns {string|null} - User role or null
     */
    getUserRole: () => {
        return localStorage.getItem(STORAGE_KEYS.USER_ROLE);
    },

    /**
     * Store reset token (temporary)
     * @param {string} token - Reset token from server
     */
    setResetToken: (token) => {
        if (token) {
            localStorage.setItem(STORAGE_KEYS.RESET_TOKEN, token);
        }
    },

    /**
     * Retrieve reset token
     * @returns {string|null} - Reset token or null
     */
    getResetToken: () => {
        return localStorage.getItem(STORAGE_KEYS.RESET_TOKEN);
    },

    /**
     * Clear all authentication data
     * Called on logout
     */
    clearAll: () => {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
        localStorage.removeItem(STORAGE_KEYS.RESET_TOKEN);
    },

    /**
     * Clear auth token only (for logout or token expiry)
     */
    clearAuthToken: () => {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    },
};

export default AuthStorage;
