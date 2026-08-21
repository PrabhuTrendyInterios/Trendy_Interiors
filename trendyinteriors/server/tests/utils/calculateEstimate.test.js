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

  test('uses layout.price when fixedPrice is unavailable', () => {
    const quote = calculateEstimate({
      roomInstances: [{ id: 'Bedroom-1', roomName: 'Bedroom', label: 'Bedroom' }],
      normalizedDimensions: {
        'Bedroom-1': {
          length: 10,
          width: 10,
          height: 9,
          selectedDesignIdea: {
            layout: 'Sliding Wardrobe',
            addons: [],
          },
        },
      },
      roomsCatalog: [
        {
          name: 'Bedroom',
          pricePerSqFt: 1000,
          layouts: [{ name: 'Sliding Wardrobe', price: 18000 }],
          addons: [],
        },
      ],
      extraAddons: [],
      globalAddons: [],
    });

    expect(quote.lineItems[0].layoutCost).toBe(18000);
    expect(quote.lineItems[0].estimatedCost).toBe(118000);
  });

  test('includes non-required room layout cost even when no dimensions are provided', () => {
    const quote = calculateEstimate({
      roomInstances: [{ id: 'Pooja-1', roomName: 'Pooja Room', label: 'Pooja Room' }],
      normalizedDimensions: {
        'Pooja-1': {
          length: 0,
          width: 0,
          height: 0,
          selectedDesignIdea: { layout: 'Pooja Unit', addons: [] },
        },
      },
      roomsCatalog: [
        {
          name: 'Pooja Room',
          pricePerSqFt: 1200,
          requiresDimensions: false,
          layouts: [{ name: 'Pooja Unit', fixedPrice: 45000 }],
          addons: [],
        },
      ],
      extraAddons: [],
      globalAddons: [],
    });

    expect(quote.totalAreaSqFt).toBe(0);
    expect(quote.lineItems[0].layoutCost).toBe(45000);
    expect(quote.lineItems[0].estimatedCost).toBe(45000);
    expect(quote.estimatedAmount).toBe(45000);
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

  test('adds layoutMaterialsCost for selected layout materials', () => {
    const roomsWithLayoutMaterials = [
      {
        name: 'Bedroom',
        pricePerSqFt: 1000,
        dimensions: [
          {
            _id: 'dim-low',
            name: 'Low',
            packageComponents: [],
          },
        ],
        layouts: [
          {
            name: 'Sliding Wardrobe',
            fixedPrice: 18000,
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
        ],
        addons: [],
      },
    ];

    const quoteAllSelected = calculateEstimate({
      roomInstances: [{ id: 'Bedroom-1', roomName: 'Bedroom', label: 'Bedroom' }],
      normalizedDimensions: {
        'Bedroom-1': {
          length: 10,
          width: 10,
          height: 9,
          sizeCategory: 'dim-low',
          selectedDesignIdea: {
            layout: 'Sliding Wardrobe',
            addons: [],
          },
        },
      },
      roomsCatalog: roomsWithLayoutMaterials,
      extraAddons: [],
      globalAddons: [],
    });

    expect(quoteAllSelected.lineItems[0].layoutMaterialsCost).toBe(6200);
    expect(quoteAllSelected.lineItems[0].estimatedCost).toBe(124200);

    const quotePartialSelection = calculateEstimate({
      roomInstances: [{ id: 'Bedroom-1', roomName: 'Bedroom', label: 'Bedroom' }],
      normalizedDimensions: {
        'Bedroom-1': {
          length: 10,
          width: 10,
          height: 9,
          sizeCategory: 'dim-low',
          selectedDesignIdea: {
            layout: 'Sliding Wardrobe',
            addons: [],
          },
        },
      },
      roomsCatalog: roomsWithLayoutMaterials,
      extraAddons: [],
      globalAddons: [],
      selectedLayoutMaterials: {
        'Bedroom-1': {
          'mat-1': true,
          'mat-2': false,
        },
      },
    });

    expect(quotePartialSelection.lineItems[0].layoutMaterialsCost).toBe(5000);
    expect(quotePartialSelection.lineItems[0].estimatedCost).toBe(123000);
  });

  test('skips layout materials safely when dimension configuration is missing', () => {
    const quote = calculateEstimate({
      roomInstances: [{ id: 'Bedroom-1', roomName: 'Bedroom', label: 'Bedroom' }],
      normalizedDimensions: {
        'Bedroom-1': {
          length: 10,
          width: 10,
          height: 9,
          sizeCategory: 'dim-mid',
          selectedDesignIdea: {
            layout: 'Sliding Wardrobe',
            addons: [],
          },
        },
      },
      roomsCatalog: [
        {
          name: 'Bedroom',
          pricePerSqFt: 1000,
          dimensions: [{ _id: 'dim-low', name: 'Low' }],
          layouts: [
            {
              name: 'Sliding Wardrobe',
              fixedPrice: 0,
              hasLayoutMaterials: true,
              configurations: [
                {
                  dimensionId: 'dim-low',
                  materials: [{ _id: 'mat-1', name: 'Laminate', price: 5000, mandatory: true }],
                },
              ],
            },
          ],
          addons: [],
        },
      ],
      extraAddons: [],
      globalAddons: [],
    });

    expect(quote.lineItems[0].layoutMaterialsCost).toBe(0);
    expect(quote.lineItems[0].layoutMaterials).toEqual([]);
    expect(quote.lineItems[0].estimatedCost).toBe(100000);
  });

  test.each([
    ['Kitchen', 'L Shape', 'Low', 23000, 'Mid', 28000],
    ['Bedroom', 'Sliding Wardrobe', 'Low', 16000, 'Large', 24000],
  ])(
    '%s resolves package materials from the selected layout and size',
    (roomName, layoutName, firstSize, firstTotal, secondSize, secondTotal) => {
      const materialSets = {
        Kitchen: {
          Low: [{ _id: 'k-low-1', name: 'Laminate' }, { _id: 'k-low-2', name: 'Granite' }],
          Mid: [{ _id: 'k-mid-1', name: 'Laminate' }, { _id: 'k-mid-2', name: 'Granite' }],
        },
        Bedroom: {
          Low: [{ _id: 'b-low-1', name: 'Particle Board' }, { _id: 'b-low-2', name: 'Plywood' }],
          Large: [{ _id: 'b-large-1', name: 'Particle Board' }, { _id: 'b-large-2', name: 'Plywood' }],
        },
      };
      const materialPrices = {
        Kitchen: { Low: [8000, 15000], Mid: [10000, 18000] },
        Bedroom: { Low: [6000, 10000], Large: [9000, 15000] },
      };
      const sizes = [firstSize, secondSize];
      const room = {
        name: roomName,
        pricePerSqFt: 0,
        dimensions: sizes.map((name) => ({
          _id: `${roomName}-${name}`,
          name,
          packageComponents: [{ _id: `wrong-${name}`, name: 'Dimension-only material', price: 99999 }],
        })),
        layouts: [{
          name: layoutName,
          fixedPrice: 0,
          hasLayoutMaterials: true,
          configurations: sizes.map((size) => ({
            dimensionId: `${roomName}-${size}`,
            materials: materialSets[roomName][size].map((material, index) => ({
              ...material,
              price: materialPrices[roomName][size][index],
              mandatory: index === 0,
            })),
          })),
        }],
        addons: [],
      };

      const calculateForSize = (size) => calculateEstimate({
        roomInstances: [{ id: `${roomName}-1`, roomName, label: roomName }],
        normalizedDimensions: {
          [`${roomName}-1`]: {
            length: 1,
            width: 1,
            height: 1,
            sizeCategory: `${roomName}-${size}`,
            selectedDesignIdea: { layout: layoutName, addons: [] },
          },
        },
        roomsCatalog: [room],
        extraAddons: [],
        globalAddons: [],
      }).lineItems[0];

      const firstQuote = calculateForSize(firstSize);
      const secondQuote = calculateForSize(secondSize);

      expect(firstQuote.packageComponents).toEqual([]);
      expect(secondQuote.packageComponents).toEqual([]);
      expect(firstQuote.layoutMaterialsCost).toBe(firstTotal);
      expect(secondQuote.layoutMaterialsCost).toBe(secondTotal);
      expect(firstQuote.layoutMaterials.map((material) => material.id)).not.toEqual(
        secondQuote.layoutMaterials.map((material) => material.id)
      );
    }
  );

  test('Hall resolves package materials directly from the selected dimension', () => {
    const quote = calculateEstimate({
      roomInstances: [{ id: 'Hall-1', roomName: 'Hall', label: 'Hall' }],
      normalizedDimensions: {
        'Hall-1': {
          length: 10,
          width: 10,
          height: 9,
          sizeCategory: 'hall-low',
          selectedDesignIdea: { layout: '', addons: [] },
        },
      },
      roomsCatalog: [{
        name: 'Hall',
        pricePerSqFt: 0,
        dimensions: [{
          _id: 'hall-low',
          name: 'Low',
          packageComponents: [
            { _id: 'hall-hinges', name: 'Hinges', price: 2000, mandatory: true },
            { _id: 'hall-handles', name: 'Handles', price: 1500, mandatory: true },
          ],
        }],
        layouts: [],
        addons: [],
      }],
      extraAddons: [],
      globalAddons: [],
    });

    expect(quote.lineItems[0].packageComponents.map((component) => component.name)).toEqual([
      'Hinges',
      'Handles',
    ]);
    expect(quote.lineItems[0].packageComponentsTotal).toBe(3500);
    expect(quote.lineItems[0].layoutMaterials).toEqual([]);
  });
});
