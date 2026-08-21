const { globalAddonsCatalog, roomsCatalog } = require('../../seeds/estimatorCatalog');

const findRoom = (name) => roomsCatalog.find((room) => room.name === name);
const sumPrices = (items = []) => items.reduce((sum, item) => sum + Number(item.price || 0), 0);

describe('TS Web Quote estimator catalog', () => {
  test('rooms use the requested display order and only Kitchen and Pooja Room have layouts', () => {
    expect(roomsCatalog.map(({ name, displayOrder }) => ({ name, displayOrder }))).toEqual([
      { name: 'Kitchen', displayOrder: 1 },
      { name: 'Pooja Room', displayOrder: 2 },
      { name: 'Hall', displayOrder: 3 },
      { name: 'Bedroom', displayOrder: 4 },
    ]);
    expect(roomsCatalog.filter((room) => room.layouts.length > 0).map((room) => room.name)).toEqual([
      'Kitchen',
      'Pooja Room',
    ]);
  });

  test('Kitchen defines the PDF dimensions and layout-size package totals', () => {
    const kitchen = findRoom('Kitchen');
    const expectedTotals = {
      Straight: { Small: 85200, Medium: 102600, Large: 162900 },
      'L Shape': { Small: 127200, Medium: 181200, Large: 246600 },
      'U Shape': { Small: 185100, Medium: 258000, Large: 315000 },
    };

    expect(kitchen.dimensions.map(({ name, length, width }) => ({ name, length, width }))).toEqual([
      { name: 'Small', length: 8, width: 10 },
      { name: 'Medium', length: 10, width: 11 },
      { name: 'Large', length: 10, width: 16 },
    ]);
    expect(kitchen.layouts.map((layout) => layout.name)).toEqual(['Straight', 'L Shape', 'U Shape']);

    kitchen.layouts.forEach((layout) => {
      expect(layout.fixedPrice).toBe(0);
      expect(layout.hasLayoutMaterials).toBe(true);
      expect(layout.configurations).toHaveLength(3);
      layout.configurations.forEach((configuration) => {
        expect(sumPrices(configuration.materials)).toBe(
          expectedTotals[layout.name][configuration.dimensionId]
        );
        expect(configuration.materials.every((item) => !item.mandatory)).toBe(true);
      });
    });
  });

  test.each([
    ['Bedroom', [[10, 11], [16, 17], [20, 16]], [122700, 270900, 333900]],
    ['Hall', [[16, 11], [17, 20], [20, 20]], [57900, 106500, 115200]],
  ])('%s defines PDF packages directly by dimension', (roomName, measurements, totals) => {
    const room = findRoom(roomName);

    expect(room.layouts).toEqual([]);
    expect(room.dimensions.map((item) => [item.length, item.width])).toEqual(measurements);
    expect(room.dimensions.map((item) => sumPrices(item.packageComponents))).toEqual(totals);
    expect(
      room.dimensions.every((item) => item.packageComponents.every((entry) => !entry.mandatory))
    ).toBe(true);
  });

  test('Pooja Room defines fixed-price layouts without requiring dimensions', () => {
    const pooja = findRoom('Pooja Room');

    expect(pooja.requiresDimensions).toBe(false);
    expect(pooja.layouts.map(({ name, fixedPrice }) => ({ name, fixedPrice }))).toEqual([
      { name: 'Base Unit Only', fixedPrice: 12000 },
      { name: 'Base Unit & Panelling', fixedPrice: 31500 },
      { name: 'Stand Alone Unit', fixedPrice: 34500 },
    ]);
  });

  test('Additionals contain the ten unique PDF items and prices', () => {
    expect(globalAddonsCatalog.map(({ name, price }) => ({ name, price }))).toEqual([
      { name: 'Wardrobe', price: 39300 },
      { name: 'Study Table', price: 16500 },
      { name: 'Folding Ledge', price: 3600 },
      { name: 'Cot King Size', price: 39000 },
      { name: 'Bed Side Table', price: 7200 },
      { name: 'Vanity Unit', price: 9300 },
      { name: 'Kitchen Island Counter', price: 23100 },
      { name: 'Shoe Rack', price: 15300 },
      { name: 'Window Pelmet Box', price: 3000 },
      { name: 'TV Ledge & Panelling', price: 18600 },
    ]);
  });
});
