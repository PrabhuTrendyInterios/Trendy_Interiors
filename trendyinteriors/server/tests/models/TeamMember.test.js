const TeamMember = require('../../models/TeamMember');

describe('server/models/TeamMember', () => {
  test('requires name, role, contact, imageUrl', () => {
    const doc = new TeamMember({});
    const err = doc.validateSync();

    expect(err.errors.name).toBeDefined();
    expect(err.errors.role).toBeDefined();
    expect(err.errors.contact).toBeDefined();
    expect(err.errors.imageUrl).toBeDefined();
  });

  test('defaults status to active and displayOrder to 0', () => {
    const doc = new TeamMember({
      name: 'Asha',
      role: 'Designer',
      contact: '+91 9876543210',
      imageUrl: 'https://example.com/p.jpg',
    });

    expect(doc.status).toBe('active');
    expect(doc.displayOrder).toBe(0);
  });
});
