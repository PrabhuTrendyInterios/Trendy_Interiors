const {
  resolveLayoutMaterials,
  validateRoomLayoutConfigurations,
} = require('../../utils/layoutMaterials');

describe('server/utils/layoutMaterials', () => {
  const roomDoc = {
    name: 'Bedroom',
    dimensions: [{ _id: 'dim-low', name: 'Low' }],
    layouts: [
      {
        name: 'Sliding Wardrobe',
        hasLayoutMaterials: true,
        configurations: [
          {
            dimensionId: 'dim-low',
            materials: [{ _id: 'mat-1', name: 'Laminate', price: 5000, mandatory: true }],
          },
        ],
      },
      {
        name: 'Standard',
        hasLayoutMaterials: false,
        configurations: [],
      },
    ],
  };

  test('resolveLayoutMaterials returns materials for valid layout and dimension', () => {
    const result = resolveLayoutMaterials(roomDoc, 'Sliding Wardrobe', 'dim-low');

    expect(result.skipped).toBe(false);
    expect(result.validationError).toBeNull();
    expect(result.materials).toHaveLength(1);
    expect(result.materials[0].name).toBe('Laminate');
  });

  test('resolveLayoutMaterials skips safely when layout is missing', () => {
    const result = resolveLayoutMaterials(roomDoc, 'Missing Layout', 'dim-low');

    expect(result.skipped).toBe(true);
    expect(result.validationError).toContain('was not found');
    expect(result.materials).toEqual([]);
  });

  test('resolveLayoutMaterials skips safely when dimension has no configuration', () => {
    const result = resolveLayoutMaterials(roomDoc, 'Sliding Wardrobe', 'dim-mid');

    expect(result.skipped).toBe(true);
    expect(result.validationError).toContain('No layout materials are configured');
    expect(result.materials).toEqual([]);
  });

  test('resolveLayoutMaterials handles missing room document without crashing', () => {
    const result = resolveLayoutMaterials(null, 'Sliding Wardrobe', 'dim-low');

    expect(result.skipped).toBe(true);
    expect(result.materials).toEqual([]);
  });

  test('validateRoomLayoutConfigurations rejects unknown dimension references', () => {
    const errors = validateRoomLayoutConfigurations(
      [{ _id: 'dim-low', name: 'Low' }],
      [
        {
          name: 'Sliding Wardrobe',
          hasLayoutMaterials: true,
          configurations: [{ dimensionId: 'missing-dim', materials: [] }],
        },
      ]
    );

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('unknown dimension');
  });

  test('validateRoomLayoutConfigurations passes for valid configurations', () => {
    const errors = validateRoomLayoutConfigurations(
      [{ _id: 'dim-low', name: 'Low' }],
      [
        {
          name: 'Sliding Wardrobe',
          hasLayoutMaterials: true,
          configurations: [{ dimensionId: 'dim-low', materials: [] }],
        },
      ]
    );

    expect(errors).toEqual([]);
  });
});
