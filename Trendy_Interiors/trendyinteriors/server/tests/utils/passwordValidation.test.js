const {
  validatePassword,
  getPasswordStrengthMessage,
} = require('../../utils/passwordValidation');

describe('server/utils/passwordValidation', () => {
  test('accepts a strong password', () => {
    const result = validatePassword('Strong@123');
    expect(result.isValid).toBe(true);
    expect(Object.values(result.errors).every((v) => v === '')).toBe(true);
  });

  test('rejects short password', () => {
    const result = validatePassword('A@123');
    expect(result.isValid).toBe(false);
    expect(result.errors.minLength).toMatch(/at least 8/i);
  });

  test('rejects password without uppercase and symbol', () => {
    const result = validatePassword('lowercase123');
    expect(result.isValid).toBe(false);
    expect(result.errors.uppercase).toMatch(/uppercase/i);
    expect(result.errors.symbol).toMatch(/symbol/i);
  });

  test('returns fixed strength guidance message', () => {
    expect(getPasswordStrengthMessage()).toMatch(/at least 8 characters/i);
  });
});
