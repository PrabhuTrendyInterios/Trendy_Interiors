const { calculateEstimate, calcArea } = require('../../utils/calculateEstimate');

describe('server/utils/calculateEstimate', () => {
  const roomsCatalog = [
    {
      name: 'Bedroom',
      pricePerSqFt: 1000,
      layouts: [{ name: 'Sliding Wardrobe', fixedPrice: 18000 }],
      addons: [
        { name: 'Bed Storage', price: 20000 },
        { name: 'Loft', price: 30000 },
      ],
    },
    {
      name: 'Kitchen',
      pricePerSqFt: 1500,
      layouts: [{ name: 'L Shape', fixedPrice: 15000 }],
      addons: [{ name: 'Chimney', price: 25000 }],
    },
  ];

  const globalAddons = [
    { _id: 'ga1', name: 'Lighting Package', price: 12000, active: true },
    { _id: 'ga2', name: 'False Ceiling', price: 40000, active: true },
  ];

  test('calculates area from length and width only', () => {
    expect(calcArea(12, 10)).toBe(120);
  });

  test('calculates room total using base cost + layout + room addons', () => {
    const quote = calculateEstimate({
      roomInstances: [{ id: 'Bedroom-1', roomName: 'Bedroom', label: 'Bedroom' }],
      normalizedDimensions: {
        'Bedroom-1': {
          length: 12,
          width: 10,
          height: 9,
          selectedDesignIdea: {
            layout: 'Sliding Wardrobe',
            addons: ['Bed Storage'],
          },
        },
      },
      roomsCatalog,
      extraAddons: [],
      globalAddons,
    });

    expect(quote.totalAreaSqFt).toBe(120);
    expect(quote.lineItems[0].baseCost).toBe(120000);
    expect(quote.lineItems[0].layoutCost).toBe(18000);
    expect(quote.lineItems[0].addonsCost).toBe(20000);
    expect(quote.lineItems[0].estimatedCost).toBe(158000);
    expect(quote.roomTotals).toBe(158000);
    expect(quote.estimatedAmount).toBe(158000);
  });

  test('adds global addons to grand total', () => {
    const quote = calculateEstimate({
      roomInstances: [{ id: 'Kitchen-1', roomName: 'Kitchen', label: 'Kitchen' }],
      normalizedDimensions: {
        'Kitchen-1': {
          length: 10,
          width: 10,
          height: 9,
          selectedDesignIdea: { layout: '', addons: [] },
        },
      },
      roomsCatalog,
      extraAddons: ['ga1', 'ga2'],
      globalAddons,
    });

    expect(quote.roomTotals).toBe(150000);
    expect(quote.globalAddonsTotal).toBe(52000);
    expect(quote.estimatedAmount).toBe(202000);
    expect(quote.lineItems[1].roomId).toBe('global-addons');
    expect(quote.lineItems[1].addonDetails).toHaveLength(2);
  });

  test('ignores height in pricing', () => {
    const withHeight = calculateEstimate({
      roomInstances: [{ id: 'Bedroom-1', roomName: 'Bedroom', label: 'Bedroom' }],
      normalizedDimensions: {
        'Bedroom-1': { length: 10, width: 10, height: 20, selectedDesignIdea: {} },
      },
      roomsCatalog,
      extraAddons: [],
      globalAddons,
    });

    const withoutHeight = calculateEstimate({
      roomInstances: [{ id: 'Bedroom-1', roomName: 'Bedroom', label: 'Bedroom' }],
      normalizedDimensions: {
        'Bedroom-1': { length: 10, width: 10, height: 0, selectedDesignIdea: {} },
      },
      roomsCatalog,
      extraAddons: [],
      globalAddons,
    });

    expect(withHeight.estimatedAmount).toBe(withoutHeight.estimatedAmount);
  });
});
