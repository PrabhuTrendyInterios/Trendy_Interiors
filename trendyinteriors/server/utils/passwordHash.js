const bcrypt = require('bcryptjs');

/**
 * Hash a password
 * @param {string} password - Plain text password to hash
 * @param {number} saltRounds - Number of salt rounds (default: 10)
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password, saltRounds = 10) => {
    try {
        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(password, salt);
        return hashedPassword;
    } catch (error) {
        throw new Error(`Password hashing failed: ${error.message}`);
    }
};

/**
 * Compare plain text password with hashed password
 * @param {string} enteredPassword - Plain text password entered by user
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} True if passwords match, false otherwise
 */
const comparePassword = async (enteredPassword, hashedPassword) => {
    try {
        return await bcrypt.compare(enteredPassword, hashedPassword);
    } catch (error) {
        throw new Error(`Password comparison failed: ${error.message}`);
    }
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result with isValid flag and message
 */
const validatePasswordStrength = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    const errors = [];

    if (password.length < minLength) {
        errors.push(`Password must be at least ${minLength} characters long`);
    }
    if (!hasUpperCase) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!hasLowerCase) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!hasNumbers) {
        errors.push('Password must contain at least one number');
    }
    if (!hasSpecialChar) {
        errors.push('Password must contain at least one special character (!@#$%^&*)');
    }

    return {
        isValid: errors.length === 0,
        score: Object.values({ hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar }).filter(Boolean).length,
        errors,
        strength: errors.length === 0 ? 'Strong' : errors.length <= 2 ? 'Medium' : 'Weak'
    };
};

module.exports = {
    hashPassword,
    comparePassword,
    validatePasswordStrength
};
