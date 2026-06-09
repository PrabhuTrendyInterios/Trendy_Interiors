const Package = require('../../models/Package');
const { LAYOUT_TYPES, resolvePackageComponents } = require('../../models/Package');

describe('server/models/Package', () => {
  test('requires name and roomType', () => {
    const doc = new Package({});
    const err = doc.validateSync();

    expect(err.errors.name).toBeDefined();
    expect(err.errors.roomType).toBeDefined();
  });

  test('defaults layouts and legacy components to empty arrays', () => {
    const doc = new Package({
      name: 'Kitchen Standard',
      roomType: 'Kitchen',
    });

    expect(doc.validateSync()).toBeUndefined();
    expect(doc.layouts).toEqual([]);
    expect(doc.components).toEqual([]);
  });

  test('validates layout type enum', () => {
    const doc = new Package({
      name: 'Kitchen Standard',
      roomType: 'Kitchen',
      layouts: [{ type: 'INVALID', sizes: [] }],
    });

    const err = doc.validateSync();
    expect(err.errors['layouts.0.type']).toBeDefined();
  });

  test('accepts nested layouts, sizes, and components', () => {
    const doc = new Package({
      name: 'Kitchen Premium',
      roomType: 'Kitchen',
      layouts: [
        {
          type: 'L_SHAPE',
          sizes: [
            {
              label: 'S',
              dimensions: '8x10',
              components: [
                { name: 'Base Cabinets', price: 25000, mandatory: true },
                { name: 'Tall Unit', price: 12000, mandatory: false },
              ],
            },
          ],
        },
      ],
    });

    expect(doc.validateSync()).toBeUndefined();
    expect(doc.layouts[0].type).toBe('L_SHAPE');
    expect(doc.layouts[0].sizes[0].label).toBe('S');
    expect(doc.layouts[0].sizes[0].components).toHaveLength(2);
  });

  test('resolvePackageComponents falls back to legacy components when layouts is empty', () => {
    const legacyComponents = [
      { name: 'Wardrobe', price: 30000, mandatory: true },
      { name: 'Study Unit', price: 15000, mandatory: false },
    ];

    const result = resolvePackageComponents(
      { layouts: [], components: legacyComponents },
      'L_SHAPE',
      'M'
    );

    expect(result).toEqual(legacyComponents);
  });

  test('resolvePackageComponents returns layout+size components when configured', () => {
    const packageDoc = {
      components: [{ name: 'Legacy Item', price: 1000, mandatory: false }],
      layouts: [
        {
          type: 'U_SHAPE',
          sizes: [
            {
              label: 'M',
              dimensions: '12x14',
              components: [{ name: 'U-Shape Counter', price: 45000, mandatory: true }],
            },
          ],
        },
      ],
    };

    const result = resolvePackageComponents(packageDoc, 'U_SHAPE', 'M');

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('U-Shape Counter');
  });

  test('instance resolveComponents method uses same fallback rules', () => {
    const doc = new Package({
      name: 'Bedroom Basic',
      roomType: 'Bedroom',
      components: [{ name: 'Loft', price: 8000, mandatory: false }],
    });

    expect(doc.resolveComponents('STRAIGHT', 'L')).toHaveLength(1);
    expect(doc.resolveComponents('STRAIGHT', 'L')[0].name).toBe('Loft');
  });

  test('exports LAYOUT_TYPES constant', () => {
    expect(LAYOUT_TYPES).toEqual(['L_SHAPE', 'U_SHAPE', 'STRAIGHT']);
  });
});
