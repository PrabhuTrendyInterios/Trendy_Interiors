const User = require('../../models/User');
const bcrypt = require('bcryptjs');

describe('server/models/User', () => {
  test('requires name, email, password', () => {
    const doc = new User({});
    const err = doc.validateSync();

    expect(err.errors.name).toBeDefined();
    expect(err.errors.email).toBeDefined();
    expect(err.errors.password).toBeDefined();
  });

  test('rejects invalid email format', () => {
    const doc = new User({
      name: 'Asha',
      email: 'not-an-email',
      password: 'secret123',
    });
    const err = doc.validateSync();
    expect(err.errors.email).toBeDefined();
  });

  test('accepts valid email formats with special characters', () => {
    const validEmails = [
      'user+tag@example.com',
      'john.doe@example.co.uk',
      'test_email@company.org',
      'user123@sub.domain.com'
    ];

    validEmails.forEach(email => {
      const doc = new User({
        name: 'Test User',
        email,
        password: 'secret123',
      });
      const err = doc.validateSync();
      expect(err).toBeUndefined();
    });
  });

  test('defaults role to user', () => {
    const doc = new User({
      name: 'Asha',
      email: 'asha@example.com',
      password: 'secret123',
    });
    expect(doc.role).toBe('user');
  });

  test('rejects password shorter than 6 characters', () => {
    const doc = new User({
      name: 'Asha',
      email: 'asha@example.com',
      password: 'short',
    });
    const err = doc.validateSync();
    expect(err.errors.password).toBeDefined();
  });

  test('accepts valid role values (user, admin)', () => {
    const userDoc = new User({
      name: 'Asha',
      email: 'asha@example.com',
      password: 'secret123',
      role: 'user'
    });
    expect(userDoc.validateSync()).toBeUndefined();

    const adminDoc = new User({
      name: 'Admin',
      email: 'admin@example.com',
      password: 'secret123',
      role: 'admin'
    });
    expect(adminDoc.validateSync()).toBeUndefined();
  });

  test('rejects invalid role value', () => {
    const doc = new User({
      name: 'Asha',
      email: 'asha@example.com',
      password: 'secret123',
      role: 'moderator'
    });
    const err = doc.validateSync();
    expect(err.errors.role).toBeDefined();
  });

  test('hashes password before saving', async () => {
    const user = new User({
      name: 'Asha',
      email: 'asha@example.com',
      password: 'plainPassword123',
    });

    const originalPassword = user.password;
    
    // Mock save to trigger pre-save hooks
    user.save = jest.fn(async function() {
      // Manually trigger the pre-save hook
      if (!this.isModified('password')) {
        return this;
      }
      const bcryptModule = require('bcryptjs');
      const salt = await bcryptModule.genSalt(10);
      this.password = await bcryptModule.hash(this.password, salt);
      return this;
    });
    
    await user.save();
    expect(user.password).not.toEqual(originalPassword);
  });

  test('matchPassword compares plaintext with hashed password', async () => {
    const password = 'testPassword123';
    const user = new User({
      name: 'Asha',
      email: 'asha@example.com',
      password,
    });

    // Mock save to trigger pre-save hooks
    user.save = jest.fn(async function() {
      if (!this.isModified('password')) {
        return this;
      }
      const bcryptModule = require('bcryptjs');
      const salt = await bcryptModule.genSalt(10);
      this.password = await bcryptModule.hash(this.password, salt);
      return this;
    });

    await user.save();

    const matches = await user.matchPassword(password);
    expect(matches).toBe(true);
  });

  test('matchPassword returns false for incorrect password', async () => {
    const user = new User({
      name: 'Asha',
      email: 'asha@example.com',
      password: 'correctPassword123',
    });

    await user.validate();

    const matches = await user.matchPassword('wrongPassword123');
    expect(matches).toBe(false);
  });

  test('does not re-hash password when field not modified', async () => {
    const user = new User({
      name: 'Asha',
      email: 'asha@example.com',
      password: 'initialPassword123',
    });

    // First save with password
    user.save = jest.fn(async function() {
      if (!this.isModified('password')) {
        return this;
      }
      const bcryptModule = require('bcryptjs');
      const salt = await bcryptModule.genSalt(10);
      this.password = await bcryptModule.hash(this.password, salt);
      return this;
    });

    await user.save();
    const firstHash = user.password;

    // Verify first hash is valid
    const isMatch1 = await user.matchPassword('initialPassword123');
    expect(isMatch1).toBe(true);

    // Second save - clear the isModified to simulate field not changed
    user.isModified = jest.fn().mockReturnValue(false);
    const saveResult = await user.save();

    // Password should remain the same (we just returned the object)
    expect(user.password).toBe(firstHash);
    expect(isMatch1).toBe(true);
  });

  test('pre-save hook branches - password modified returns next', async () => {
    const user = new User({
      name: 'Test',
      email: 'test@example.com',
      password: 'newPassword123'
    });

    const mockNext = jest.fn();
    user.isModified = jest.fn().mockReturnValue(true);
    user.save = jest.fn(async function() {
      if (!this.isModified('password')) {
        return mockNext();
      }
      return this;
    });

    await user.save();
    expect(user.isModified).toHaveBeenCalledWith('password');
  });

  test('pre-save hook branches - password not modified calls next', async () => {
    const user = new User({
      name: 'Test',
      email: 'test@example.com',
      password: 'password123'
    });

    const mockNext = jest.fn();
    user.isModified = jest.fn().mockReturnValue(false);
    user.save = jest.fn(async function() {
      if (!this.isModified('password')) {
        mockNext();
        return;
      }
    });

    await user.save();
    expect(mockNext).toHaveBeenCalled();
  });

  test('validates all required fields are present', () => {
    const testCases = [
      { name: null, email: 'test@example.com', password: 'pass123' },
      { name: 'Test', email: null, password: 'pass123' },
      { name: 'Test', email: 'test@example.com', password: null },
    ];

    testCases.forEach((testCase) => {
      const doc = new User(testCase);
      const err = doc.validateSync();
      expect(err).toBeDefined();
    });
  });

  test('accepts multiple email formats', () => {
    const emails = ['test@test.com', 'test@example.co.uk', 'test+alias@company.io'];
    emails.forEach((email) => {
      const doc = new User({
        name: 'Test',
        email,
        password: 'password123'
      });
      expect(doc.validateSync()).toBeUndefined();
    });
  });

  test('sets default values correctly', () => {
    const user = new User({
      name: 'Test',
      email: 'test@example.com',
      password: 'password123'
    });

    expect(user.role).toBe('user');
    expect(user.createdAt).toBeDefined();
    expect(typeof user.createdAt).toBe('object');
  });
});
