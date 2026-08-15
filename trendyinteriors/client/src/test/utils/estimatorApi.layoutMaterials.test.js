import {
  buildDefaultLayoutMaterialSelection,
  getLayoutMaterialsForRoom,
  getLayoutMaterialsTotal,
  isLayoutMaterialSelected,
  normalizeLayoutMaterialSelection,
  normalizeEstimatorRoom,
  reloadLayoutMaterialSelection,
  toggleLayoutMaterialSelection,
} from '../../utils/estimatorApi';

describe('getLayoutMaterialsForRoom', () => {
  const room = {
    name: 'Bedroom',
    dimensions: [
      { _id: 'dim-low', id: 'dim-low', name: 'Low' },
      { _id: 'dim-mid', id: 'dim-mid', name: 'Mid' },
    ],
    layouts: [
      {
        name: 'Sliding Wardrobe',
        hasLayoutMaterials: true,
        configurations: [
          {
            dimensionId: 'dim-low',
            materials: [
              { _id: 'mat-1', name: 'Laminate', price: 5000, mandatory: true },
              { _id: 'mat-2', name: 'Handles', price: 1200, mandatory: false },
            ],
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

  test('returns materials for matching layout and dimension', () => {
    const result = getLayoutMaterialsForRoom({
      room,
      layoutName: 'Sliding Wardrobe',
      sizeCategory: 'dim-low',
    });

    expect(result.hasLayoutMaterials).toBe(true);
    expect(result.materials).toHaveLength(2);
    expect(result.materials[0].name).toBe('Laminate');
  });

  test('matches a name-keyed configuration when sizeCategory contains a dimension id', () => {
    const result = getLayoutMaterialsForRoom({
      room: {
        name: 'Kitchen',
        dimensions: [{ _id: 'kitchen-low-id', id: 'kitchen-low-id', name: 'Low' }],
        layouts: [{
          name: 'U Shape',
          hasLayoutMaterials: true,
          configurations: [{
            dimensionId: 'Low',
            materials: [{ _id: 'u-low-1', name: 'Laminate', price: 10000 }],
          }],
        }],
      },
      layoutName: 'U Shape',
      sizeCategory: 'kitchen-low-id',
    });

    expect(result.materials).toHaveLength(1);
    expect(result.materials[0].name).toBe('Laminate');
  });

  test('returns empty materials when layout material mode is disabled', () => {
    const result = getLayoutMaterialsForRoom({
      room,
      layoutName: 'Standard',
      sizeCategory: 'dim-low',
    });

    expect(result.hasLayoutMaterials).toBe(false);
    expect(result.materials).toEqual([]);
  });

  test('returns default layout materials for dimensionless rooms', () => {
    const result = getLayoutMaterialsForRoom({
      room: {
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
      layoutName: 'Base Unit & Panelling',
    });

    expect(result.hasLayoutMaterials).toBe(true);
    expect(result.materials).toEqual([
      expect.objectContaining({ id: 'pooja-base', name: 'Base Unit', price: 31500 }),
    ]);
  });

  test('buildDefaultLayoutMaterialSelection selects every available material', () => {
    const selection = buildDefaultLayoutMaterialSelection([
      { id: 'mat-1', mandatory: true },
      { id: 'mat-2', mandatory: false },
    ]);

    expect(selection).toEqual({ 'mat-1': true, 'mat-2': true });
  });

  test('toggleLayoutMaterialSelection flips boolean state', () => {
    const toggled = toggleLayoutMaterialSelection({ 'mat-1': true }, 'mat-1');
    expect(toggled).toEqual({ 'mat-1': false });

    const restored = toggleLayoutMaterialSelection(toggled, 'mat-1');
    expect(restored).toEqual({ 'mat-1': true });
  });

  test('normalizes nested room selections without dropping deselected materials', () => {
    const selection = normalizeLayoutMaterialSelection({
      'Kitchen-1': {
        'base-unit': true,
        'tandem-drawer': false,
        'wall-unit': true,
      },
      'Kitchen-2': {
        'base-unit': true,
        'tandem-drawer': true,
        'wall-unit': false,
      },
    });

    expect(selection).toEqual({
      'Kitchen-1': {
        'base-unit': true,
        'tandem-drawer': false,
        'wall-unit': true,
      },
      'Kitchen-2': {
        'base-unit': true,
        'tandem-drawer': true,
        'wall-unit': false,
      },
    });
  });

  test('isLayoutMaterialSelected keeps mandatory materials selected', () => {
    expect(isLayoutMaterialSelected({ 'mat-1': false }, 'mat-1', true)).toBe(true);
    expect(isLayoutMaterialSelected({}, 'mat-1', false)).toBe(false);
    expect(isLayoutMaterialSelected({ 'mat-1': false }, 'mat-1', false)).toBe(false);
  });

  test('reloadLayoutMaterialSelection returns all materials checked', () => {
    const selection = reloadLayoutMaterialSelection({
      roomsCatalog: [room],
      roomName: 'Bedroom',
      layoutName: 'Sliding Wardrobe',
      sizeCategory: 'dim-low',
    });

    expect(selection).toEqual({
      'mat-1': true,
      'mat-2': true,
    });
  });

  test('reloadLayoutMaterialSelection returns null when layout has no materials', () => {
    const selection = reloadLayoutMaterialSelection({
      roomsCatalog: [room],
      roomName: 'Bedroom',
      layoutName: 'Standard',
      sizeCategory: 'dim-low',
    });

    expect(selection).toBeNull();
  });

  test('getLayoutMaterialsTotal sums selected materials and always includes mandatory', () => {
    const materials = [
      { id: 'mat-1', price: 5000, mandatory: true },
      { id: 'mat-2', price: 1200, mandatory: false },
    ];

    expect(getLayoutMaterialsTotal(materials, {})).toBe(5000);
    expect(getLayoutMaterialsTotal(materials, { 'mat-2': false })).toBe(5000);
  });
});

describe('normalizeEstimatorRoom package components', () => {
  test('preserves and normalizes package components returned by the rooms API', () => {
    const room = normalizeEstimatorRoom({
      _id: 'room-1',
      name: 'Bedroom',
      dimensions: [
        {
          _id: 'dim-1',
          name: 'Low',
          packageComponents: [
            { _id: 'component-2', name: 'Handles', price: '1500', displayOrder: 2 },
            { _id: 'component-1', name: 'Hinges', price: '2000', mandatory: true, displayOrder: 1 },
          ],
        },
      ],
    });

    expect(room.dimensions[0].packageComponents).toEqual([
      expect.objectContaining({ id: 'component-1', name: 'Hinges', price: 2000, mandatory: true }),
      expect.objectContaining({ id: 'component-2', name: 'Handles', price: 1500, mandatory: false }),
    ]);
  });
});
