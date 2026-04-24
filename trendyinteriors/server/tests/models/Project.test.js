const Project = require('../../models/Project');

describe('server/models/Project', () => {
  test('requires title, description, image, category', () => {
    const doc = new Project({});
    const err = doc.validateSync();

    expect(err.errors.title).toBeDefined();
    expect(err.errors.description).toBeDefined();
    expect(err.errors.image).toBeDefined();
    expect(err.errors.category).toBeDefined();
  });

  test('normalizes category to lowercase', () => {
    const doc = new Project({
      title: 'Villa',
      description: 'Modern villa interior',
      image: 'https://example.com/img.jpg',
      category: 'LUXURY',
    });

    expect(doc.category).toBe('luxury');
  });
});
