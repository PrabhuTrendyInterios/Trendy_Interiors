const User = require('../../models/User');

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

  test('defaults role to user', () => {
    const doc = new User({
      name: 'Asha',
      email: 'asha@example.com',
      password: 'secret123',
    });
    expect(doc.role).toBe('user');
  });
});
