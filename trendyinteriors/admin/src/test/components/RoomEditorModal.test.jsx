import { normalizeRoomForSave } from '../../components/RoomEditorModal';

describe('admin/components/RoomEditorModal', () => {
  test('preserves a zero layout fixed price in the save payload', () => {
    const payload = normalizeRoomForSave({
      name: 'Kitchen',
      description: '',
      imageUrl: '',
      pricePerSqFt: '0',
      status: 'active',
      allowCustomDimensions: true,
      requiresDimensions: true,
      maxSelectableRooms: '2',
      dimensions: [],
      layouts: [
        {
          name: 'Straight',
          imageUrl: '',
          description: 'Compact linear kitchen',
          fixedPrice: '0',
          hasLayoutMaterials: false,
          configurations: [],
        },
      ],
      addons: [],
    });

    expect(payload.pricePerSqFt).toBe(0);
    expect(payload.layouts[0].fixedPrice).toBe(0);
  });
});
