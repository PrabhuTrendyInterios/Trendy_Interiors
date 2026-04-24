const Estimator = require('../../models/Estimator');

describe('server/models/Estimator', () => {
  test('requires budgetPlan and rooms map', () => {
    const doc = new Estimator({});
    const err = doc.validateSync();
    expect(err.errors.budgetPlan).toBeDefined();
  });

  test('accepts valid estimator payload shape', () => {
    const doc = new Estimator({
      rooms: { Bedroom: 1 },
      budgetPlan: 'premium',
      selectedRoomForDimensions: 'Bedroom-1',
      roomDimensionsByRoom: {
        'Bedroom-1': {
          length: 10,
          width: 12,
          height: 9,
          selectedDesignIdea: { id: 'x1', planTier: 'premium' },
        },
      },
      customerInfo: { name: 'Asha', email: 'asha@example.com' },
    });

    expect(doc.validateSync()).toBeUndefined();
    expect(doc.status).toBe('submitted');
    expect(doc.quoteSummary.currency).toBe('USD');
  });

  test('rejects invalid budget plan enum', () => {
    const doc = new Estimator({ rooms: { Bedroom: 1 }, budgetPlan: 'invalid' });
    const err = doc.validateSync();
    expect(err.errors.budgetPlan).toBeDefined();
  });
});
