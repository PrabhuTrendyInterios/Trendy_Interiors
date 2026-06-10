const Contact = require('../../models/Contact');

describe('server/models/Contact', () => {
  test('requires mandatory fields', () => {
    const doc = new Contact({});
    const err = doc.validateSync();

    expect(err.errors.name).toBeDefined();
    expect(err.errors.email).toBeDefined();
    expect(err.errors.mobileNumber).toBeDefined();
    expect(err.errors.message).toBeDefined();
  });

  test('rejects invalid mobile number', () => {
    const doc = new Contact({
      name: 'Asha',
      email: 'asha@example.com',
      mobileNumber: '1234',
      message: 'This is enough content for validation',
    });
    const err = doc.validateSync();
    expect(err.errors.mobileNumber).toBeDefined();
  });

  test('defaults status to new', () => {
    const doc = new Contact({
      name: 'Asha',
      email: 'asha@example.com',
      mobileNumber: '9876543210',
      message: 'This is enough content for validation',
    });

    expect(doc.status).toBe('new');
  });
});
