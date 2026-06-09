import {
  buildDefaultLayoutMaterialSelection,
  getLayoutMaterialsForRoom,
  getLayoutMaterialsTotal,
  isLayoutMaterialSelected,
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

  test('returns empty materials when layout material mode is disabled', () => {
    const result = getLayoutMaterialsForRoom({
      room,
      layoutName: 'Standard',
      sizeCategory: 'dim-low',
    });

    expect(result.hasLayoutMaterials).toBe(false);
    expect(result.materials).toEqual([]);
  });

  test('buildDefaultLayoutMaterialSelection sets all materials to true', () => {
    const selection = buildDefaultLayoutMaterialSelection([
      { id: 'mat-1' },
      { id: 'mat-2' },
    ]);

    expect(selection).toEqual({ 'mat-1': true, 'mat-2': true });
  });

  test('toggleLayoutMaterialSelection flips boolean state', () => {
    const toggled = toggleLayoutMaterialSelection({ 'mat-1': true }, 'mat-1');
    expect(toggled).toEqual({ 'mat-1': false });

    const restored = toggleLayoutMaterialSelection(toggled, 'mat-1');
    expect(restored).toEqual({ 'mat-1': true });
  });

  test('isLayoutMaterialSelected keeps mandatory materials selected', () => {
    expect(isLayoutMaterialSelected({ 'mat-1': false }, 'mat-1', true)).toBe(true);
    expect(isLayoutMaterialSelected({}, 'mat-1', false)).toBe(true);
    expect(isLayoutMaterialSelected({ 'mat-1': false }, 'mat-1', false)).toBe(false);
  });

  test('reloadLayoutMaterialSelection returns all materials checked for layout and dimension', () => {
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

    expect(getLayoutMaterialsTotal(materials, {})).toBe(6200);
    expect(getLayoutMaterialsTotal(materials, { 'mat-2': false })).toBe(5000);
  });
});
