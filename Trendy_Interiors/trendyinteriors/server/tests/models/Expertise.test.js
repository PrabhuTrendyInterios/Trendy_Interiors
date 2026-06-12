const Expertise = require('../../models/Expertise');

describe('server/models/Expertise', () => {
  test('requires title, description, icon', () => {
    const doc = new Expertise({});
    const err = doc.validateSync();

    expect(err.errors.title).toBeDefined();
    expect(err.errors.description).toBeDefined();
    expect(err.errors.icon).toBeDefined();
  });
});
