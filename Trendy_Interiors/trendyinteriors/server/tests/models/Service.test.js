const Service = require('../../models/Service');

describe('server/models/Service', () => {
  test('requires title, description, icon', () => {
    const doc = new Service({});
    const err = doc.validateSync();

    expect(err.errors.title).toBeDefined();
    expect(err.errors.description).toBeDefined();
    expect(err.errors.icon).toBeDefined();
  });

  test('defaults order to 0', () => {
    const doc = new Service({
      title: 'Modular Kitchen',
      description: 'High quality layout and installation',
      icon: 'kitchen',
    });

    expect(doc.order).toBe(0);
  });
});
