const Design = require('../../models/Design');

describe('server/models/Design', () => {
  test('requires title and imageUrl', () => {
    const doc = new Design({});
    const err = doc.validateSync();
    expect(err.errors.title).toBeDefined();
    expect(err.errors.imageUrl).toBeDefined();
  });

  test('defaults order to 0', () => {
    const doc = new Design({ title: 'Neo classic', imageUrl: 'https://example.com/a.jpg' });
    expect(doc.order).toBe(0);
  });
});
