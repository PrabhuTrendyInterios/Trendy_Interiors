const TeamMember = require('../../models/TeamMember');

describe('server/models/TeamMember', () => {
  test('requires name, role, image, mobilePhone', () => {
    const doc = new TeamMember({});
    const err = doc.validateSync();

    expect(err.errors.name).toBeDefined();
    expect(err.errors.role).toBeDefined();
    expect(err.errors.image).toBeDefined();
    expect(err.errors.mobilePhone).toBeDefined();
  });

  test('rejects invalid mobilePhone format', () => {
    const doc = new TeamMember({
      name: 'Asha',
      role: 'Designer',
      image: 'https://example.com/p.jpg',
      mobilePhone: '12345',
    });

    const err = doc.validateSync();
    expect(err.errors.mobilePhone).toBeDefined();
  });
});
