import { validatePassword, getPasswordStrengthMessage } from './passwordValidation';

describe('client/utils/passwordValidation', () => {
  test('valid password passes validation', () => {
    const result = validatePassword('Strong@123');
    expect(result.isValid).toBe(true);
  });

  test('invalid password returns detailed errors', () => {
    const result = validatePassword('weak');
    expect(result.isValid).toBe(false);
    expect(result.errors.minLength).toMatch(/at least 8/i);
    expect(result.errors.uppercase).toMatch(/uppercase/i);
    expect(result.errors.symbol).toMatch(/symbol/i);
  });

  test('returns guidance message', () => {
    expect(getPasswordStrengthMessage()).toMatch(/at least 8 characters/i);
  });
});
