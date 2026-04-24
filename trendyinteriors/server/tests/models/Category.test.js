const Category = require('../../models/Category');

describe('server/models/Category', () => {
  test('requires name and displayName', () => {
    const doc = new Category({});
    const err = doc.validateSync();
    expect(err.errors.name).toBeDefined();
    expect(err.errors.displayName).toBeDefined();
  });

  test('defaults isActive true', () => {
    const doc = new Category({ name: 'kitchen', displayName: 'Kitchen' });
    expect(doc.isActive).toBe(true);
  });
});
