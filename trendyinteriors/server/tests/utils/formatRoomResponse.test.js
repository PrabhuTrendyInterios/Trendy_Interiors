const { formatRoomResponse } = require('../../utils/formatRoomResponse');

describe('formatRoomResponse', () => {
  test('includes layout material fields with defaults for legacy layouts', () => {
    const formatted = formatRoomResponse({
      _id: 'room1',
      name: 'Bedroom',
      layouts: [
        {
          _id: 'layout1',
          name: 'L Shape',
          fixedPrice: 15000,
        },
      ],
    });

    expect(formatted.layouts).toHaveLength(1);
    expect(formatted.layouts[0]).toMatchObject({
      name: 'L Shape',
      fixedPrice: 15000,
      hasLayoutMaterials: false,
      configurations: [],
    });
    expect(formatted.maxSelectableRooms).toBe(6);
  });

  test('preserves an admin-configured maximum room selection', () => {
    const formatted = formatRoomResponse({
      name: 'Pooja Room',
      maxSelectableRooms: 4,
      layouts: [],
    });

    expect(formatted.maxSelectableRooms).toBe(4);
  });

  test('preserves layout material configurations in the response', () => {
    const formatted = formatRoomResponse({
      name: 'Bedroom',
      layouts: [
        {
          name: 'Sliding Wardrobe',
          fixedPrice: 18000,
          hasLayoutMaterials: true,
          configurations: [
            {
              dimensionId: 'dim1',
              materials: [
                { name: 'Laminate', price: 5000, mandatory: true },
              ],
            },
          ],
        },
      ],
    });

    expect(formatted.layouts[0].hasLayoutMaterials).toBe(true);
    expect(formatted.layouts[0].configurations).toEqual([
      {
        dimensionId: 'dim1',
        materials: [
          { name: 'Laminate', price: 5000, mandatory: true },
        ],
      },
    ]);
  });
});
