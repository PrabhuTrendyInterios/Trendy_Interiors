const Estimator = require('../../models/Estimator');

describe('server/models/Estimator', () => {
  test('requires rooms map or valid structure', () => {
    const doc = new Estimator({ roomDimensionsByRoom: { 'Room-1': { length: -5 } } });
    const err = doc.validateSync();
    expect(err).toBeDefined();
    expect(err.errors).toBeDefined();
  });

  test('accepts valid estimator payload shape', () => {
    const doc = new Estimator({
      rooms: { Bedroom: 1 },
      selectedRoomForDimensions: 'Bedroom-1',
      roomDimensionsByRoom: {
        'Bedroom-1': {
          length: 10,
          width: 12,
          height: 9,
          selectedDesignIdea: { layout: 'Sliding Wardrobe', addons: ['Bed Storage'], room: 'Bedroom' },
        },
      },
      customerInfo: { name: 'Asha', email: 'asha@example.com' },
    });

    expect(doc.validateSync()).toBeUndefined();
    expect(doc.status).toBe('submitted');
    expect(doc.quoteSummary.currency).toBe('INR');
  });
});
