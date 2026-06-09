import {
  buildLayoutSizeStateForRooms,
  buildRoomInstances,
  getDefaultLayoutTypeForRoom,
  getDefaultSizeLabelForRoom,
  mapDimensionToSizeLabel,
  mapLayoutNameToType,
} from '../../utils/estimatorApi';

describe('estimatorApi layout/size helpers', () => {
  const kitchenRoom = {
    name: 'Kitchen',
    layouts: [{ name: 'L Shape' }, { name: 'U Shape' }],
    dimensions: [
      { id: 'low', name: 'Low' },
      { id: 'mid', name: 'Mid' },
      { id: 'large', name: 'Large' },
    ],
  };

  test('mapLayoutNameToType normalizes display names', () => {
    expect(mapLayoutNameToType('L Shape')).toBe('L_SHAPE');
    expect(mapLayoutNameToType('U Shape')).toBe('U_SHAPE');
    expect(mapLayoutNameToType('Straight')).toBe('STRAIGHT');
  });

  test('mapDimensionToSizeLabel maps preset names to S/M/L', () => {
    expect(mapDimensionToSizeLabel('Low')).toBe('S');
    expect(mapDimensionToSizeLabel('Mid')).toBe('M');
    expect(mapDimensionToSizeLabel('Large')).toBe('L');
    expect(mapDimensionToSizeLabel('M')).toBe('M');
  });

  test('getDefaultLayoutTypeForRoom uses first layout', () => {
    expect(getDefaultLayoutTypeForRoom(kitchenRoom)).toBe('L_SHAPE');
    expect(getDefaultLayoutTypeForRoom({ layouts: [] })).toBe('');
  });

  test('getDefaultSizeLabelForRoom prefers Mid preset', () => {
    expect(getDefaultSizeLabelForRoom(kitchenRoom)).toBe('M');
  });

  test('buildLayoutSizeStateForRooms initializes each room instance', () => {
    const roomInstances = buildRoomInstances({ Kitchen: 2 });
    const { selectedLayoutPerRoom, selectedSizePerRoom } = buildLayoutSizeStateForRooms(
      roomInstances,
      [kitchenRoom],
      {},
    );

    expect(selectedLayoutPerRoom['Kitchen-1']).toBe('L_SHAPE');
    expect(selectedLayoutPerRoom['Kitchen-2']).toBe('L_SHAPE');
    expect(selectedSizePerRoom['Kitchen-1']).toBe('M');
    expect(selectedSizePerRoom['Kitchen-2']).toBe('M');
  });

  test('buildLayoutSizeStateForRooms respects existing dimension selections', () => {
    const roomInstances = buildRoomInstances({ Kitchen: 1 });
    const { selectedLayoutPerRoom, selectedSizePerRoom } = buildLayoutSizeStateForRooms(
      roomInstances,
      [kitchenRoom],
      {
        'Kitchen-1': {
          sizeCategory: 'Large',
          selectedDesignIdea: { layout: 'U Shape' },
        },
      },
    );

    expect(selectedLayoutPerRoom['Kitchen-1']).toBe('U_SHAPE');
    expect(selectedSizePerRoom['Kitchen-1']).toBe('L');
  });
});
