const {
  resolveLayoutMaterials,
  validateRoomLayoutConfigurations,
  findLayoutConfiguration,
  getLayoutMaterialsTotal,
  formatLayoutMaterials,
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

  test('resolves a name-keyed configuration when the selected size is a dimension id', () => {
    const result = resolveLayoutMaterials(
      {
        name: 'Kitchen',
        dimensions: [{ _id: 'kitchen-low-id', name: 'Low' }],
        layouts: [{
          name: 'U Shape',
          hasLayoutMaterials: true,
          configurations: [{
            dimensionId: 'Low',
            materials: [{ _id: 'u-low-1', name: 'Laminate', price: 10000 }],
          }],
        }],
      },
      'U Shape',
      'kitchen-low-id'
    );

    expect(result.skipped).toBe(false);
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

  test('resolveLayoutMaterials returns default layout materials for dimensionless rooms', () => {
    const result = resolveLayoutMaterials(
      {
        name: 'Pooja Room',
        requiresDimensions: false,
        dimensions: [],
        layouts: [
          {
            name: 'Base Unit & Panelling',
            hasLayoutMaterials: true,
            configurations: [
              {
                dimensionId: '__dimensionless__',
                materials: [{ _id: 'pooja-base', name: 'Base Unit', price: 31500 }],
              },
            ],
          },
        ],
      },
      'Base Unit & Panelling'
    );

    expect(result.skipped).toBe(false);
    expect(result.materials).toHaveLength(1);
    expect(result.materials[0].name).toBe('Base Unit');
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

  test('validateRoomLayoutConfigurations accepts layout materials for dimensionless rooms', () => {
    const errors = validateRoomLayoutConfigurations(
      [],
      [
        {
          name: 'Base Unit & Panelling',
          hasLayoutMaterials: true,
          configurations: [{ dimensionId: '__dimensionless__', materials: [] }],
        },
      ]
    );

    expect(errors).toEqual([]);
  });

  test('validateRoomLayoutConfigurations errors when config missing dimensionId', () => {
    const errors = validateRoomLayoutConfigurations(
      [{ _id: 'dim-low', name: 'Low' }],
      [
        {
          name: 'Sliding',
          hasLayoutMaterials: true,
          configurations: [{ materials: [] }],
        },
      ]
    );
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toMatch(/missing dimensionId/i);
  });

  test('validateRoomLayoutConfigurations is a no-op for dimensionless rooms with configs', () => {
    const errors = validateRoomLayoutConfigurations(
      [],
      [
        {
          name: 'Panel',
          hasLayoutMaterials: true,
          configurations: [{ dimensionId: 'dim-1', materials: [] }],
        },
      ]
    );
    expect(errors).toEqual([]);
  });

  test('resolveLayoutMaterials returns skipped when dimensionless room layout has no configurations', () => {
    const room = {
      name: 'Kitchen',
      requiresDimensions: false,
      dimensions: [],
      layouts: [
        {
          name: 'Base Unit',
          hasLayoutMaterials: true,
          configurations: [],
        },
      ],
    };
    const result = resolveLayoutMaterials(room, 'Base Unit', '');
    expect(result.skipped).toBe(true);
    expect(result.validationError).toMatch(/No layout materials/i);
  });

  test('resolveLayoutMaterials returns skipped when dimension not found and no sizeCategory', () => {
    const room = {
      name: 'Bedroom',
      dimensions: [{ _id: 'dim-low', name: 'Low' }],
      layouts: [
        {
          name: 'Wardrobe',
          hasLayoutMaterials: true,
          configurations: [{ dimensionId: 'dim-low', materials: [] }],
        },
      ],
    };
    const result = resolveLayoutMaterials(room, 'Wardrobe', '');
    expect(result.skipped).toBe(true);
  });

  test('findLayoutConfiguration returns null when config has no dimensionId', () => {
    const layout = {
      configurations: [{ materials: [{ _id: 'mat1', name: 'Lam' }] }],
    };
    const result = findLayoutConfiguration(layout, { _id: 'dim1' }, 'dim1');
    expect(result).toBeNull();
  });

  test('findLayoutConfiguration returns null when configurations empty', () => {
    const result = findLayoutConfiguration({ configurations: [] }, { _id: 'dim1' }, '');
    expect(result).toBeNull();
  });

  test('getLayoutMaterialsTotal returns 0 for empty materials', () => {
    expect(getLayoutMaterialsTotal([], {})).toBe(0);
  });

  test('formatLayoutMaterials handles empty array', () => {
    expect(formatLayoutMaterials([])).toEqual([]);
  });
});
