const dimension = (name, length, width, packageComponents = []) => ({
  name,
  length,
  width,
  height: 9,
  packageComponents,
});

const component = (name, description, price, displayOrder) => ({
  name,
  description,
  price,
  mandatory: false,
  displayOrder,
});

const material = (name, price) => ({ name, price, mandatory: false });

const kitchenSizes = [
  dimension('Small', 8, 10),
  dimension('Medium', 10, 11),
  dimension('Large', 10, 16),
];

const kitchenLayouts = [
  {
    name: 'Straight',
    description: 'Straight kitchen package from TS Web Quote.',
    fixedPrice: 0,
    hasLayoutMaterials: true,
    configurations: [
      {
        dimensionId: 'Small',
        materials: [
          material('Base Unit - 4 Modules (50 CFT, BWP)', 60000),
          material('Tandem Drawer Box - 3 Nos + 1 PVC Cutlery', 9600),
          material("Wall Unit - 4'W x 2'H x 1'D", 15600),
        ],
      },
      {
        dimensionId: 'Medium',
        materials: [
          material('Base Unit - 5 Modules (55 CFT, BWP)', 66000),
          material('Tandem Drawer Box - 5 Nos + 1 Cutlery + 1 Thali Rack', 16800),
          material("Wall Unit - 5'W x 2'H x 1'D", 19800),
        ],
      },
      {
        dimensionId: 'Large',
        materials: [
          material('Base Unit - 6 Modules (80 CFT, BWP)', 96000),
          material('Tandem Drawer Box - 7 Nos + 1 Cutlery + 1 Thali Rack', 23400),
          material("Wall Unit - 11'W x 2'H x 1'D", 43500),
        ],
      },
    ],
  },
  {
    name: 'L Shape',
    description: 'L Shape kitchen package from TS Web Quote.',
    fixedPrice: 0,
    hasLayoutMaterials: true,
    configurations: [
      {
        dimensionId: 'Small',
        materials: [
          material('Base Unit - 6 Modules (80 CFT, BWP)', 96000),
          material('Tandem Drawer Box - 3 Nos + 1 PVC Cutlery', 9600),
          material("Wall Unit - 6'W x 2'H x 1'D", 21600),
        ],
      },
      {
        dimensionId: 'Medium',
        materials: [
          material('Base Unit - 8 Modules (95 CFT, BWP)', 114000),
          material('Tandem Drawer Box - 5 Nos + 1 Cutlery + 1 Thali Rack', 16800),
          material("Wall Unit - 14'W x 2'H x 1'D", 50400),
        ],
      },
      {
        dimensionId: 'Large',
        materials: [
          material('Base Unit - 10 Modules (120 CFT, BWP)', 144000),
          material('Tandem Drawer Box - 7 Nos + 1 Cutlery + 1 Thali Rack', 23400),
          material("Wall Unit - 22'W x 2'H x 1'D", 79200),
        ],
      },
    ],
  },
  {
    name: 'U Shape',
    description: 'U Shape kitchen package from TS Web Quote.',
    fixedPrice: 0,
    hasLayoutMaterials: true,
    configurations: [
      {
        dimensionId: 'Small',
        materials: [
          material('Base Unit - 9 Modules (110 CFT, BWP)', 132000),
          material('Tandem Drawer Box - 3 Nos + 1 PVC Cutlery', 9600),
          material("Wall Unit - 11'W x 2'H x 1'D", 43500),
        ],
      },
      {
        dimensionId: 'Medium',
        materials: [
          material('Base Unit - 11 Modules (135 CFT, BWP)', 162000),
          material('Tandem Drawer Box - 5 Nos + 1 Cutlery + 1 Thali Rack', 16800),
          material("Wall Unit - 22'W x 2'H x 1'D", 79200),
        ],
      },
      {
        dimensionId: 'Large',
        materials: [
          material('Base Unit - 12 Modules (160 CFT, BWP)', 192000),
          material('Tandem Drawer Box - 7 Nos + 1 Cutlery + 1 Thali Rack', 23400),
          material("Wall Unit - 28'W x 2'H x 1'D", 99600),
        ],
      },
    ],
  },
];

const bedroomDimensions = [
  dimension('Small', 10, 11, [
    component('Wardrobe', "7'W x 7'H x 1'8\"D", 82500, 1),
    component('Storage Unit', "4'W x 2'8\"H x 1'8\"D", 18600, 2),
    component('Loft Shuttering', "11'W x 3'H x 5\"D", 21600, 3),
  ]),
  dimension('Medium', 16, 17, [
    component('Wardrobe', "11'W x 7'H x 1'8\"D", 129000, 1),
    component('Storage Unit', "5'W x 2'8\"H x 1'8\"D", 23400, 2),
    component('Loft Shuttering', "16'W x 3'H x 5\"D", 31500, 3),
    component('Dressing Unit', "3'6\"W x 7'H x 1\"/1'4\"D", 22200, 4),
    component('King Size Cot', "6'W x 6'6\"L x 1'2\"/4\"H", 39000, 5),
    component('Bed Side Table', "1'6\"W x 1'6\"H x 1'4\"D", 7200, 6),
    component('TV Ledge & Panelling', "6'W x 4'H x 3\"/1'2\"D", 18600, 7),
  ]),
  dimension('Large', 21, 16, [
    component('Wardrobe', "15'W x 7'H x 1'8\"D", 175200, 1),
    component('Storage Unit', "6'W x 2'8\"H x 1'8\"D", 27900, 2),
    component('Loft Shuttering', "16'W x 3'H x 5\"D", 41400, 3),
    component('Dressing Unit', "4'W x 7'H x 1\"/1'4\"D", 24600, 4),
    component('King Size Cot', "6'W x 6'6\"L x 1'2\"/4\"H", 39000, 5),
    component('Bed Side Table', "1'6\"W x 1'6\"H x 1'4\"D", 7200, 6),
    component('TV Ledge & Panelling', "6'W x 4'H x 3\"/1'2\"D", 18600, 7),
  ]),
];

const hallDimensions = [
  dimension('Small', 16, 11, [
    component('TV Unit', "8'W x 7'H x 3\"/1'4\"D", 48300, 1),
    component('Hall Architrave', "1'3\"W x 18 RFT", 9600, 2),
  ]),
  dimension('Medium', 17, 21, [
    component('TV Unit', "12'W x 7'H x 3\"/1'4\"D", 72000, 1),
    component('Hall Architrave', "1'3\"W x 21 RFT", 11400, 2),
    component('Design Panelling', "3'W x 7'H x 1'D", 23100, 3),
  ]),
  dimension('Large', 21, 21, [
    component('TV Unit', "12'W x 7'H x 3\"/1'4\"D", 72000, 1),
    component('Hall Architrave', "1'3\"W x 22 RFT", 12300, 2),
    component('Design Panelling', "4'W x 7'H x 1'D", 30900, 3),
  ]),
];

const roomsCatalog = [
  {
    name: 'Kitchen',
    displayOrder: 1,
    maxSelectableRooms: 2,
    description: 'Modular kitchen design with smart storage and premium finishes.',
    imageUrl: 'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=800',
    pricePerSqFt: 1350,
    status: 'active',
    requiresDimensions: true,
    dimensions: kitchenSizes,
    layouts: kitchenLayouts,
    addons: [],
  },
  {
    name: 'Pooja Room',
    displayOrder: 2,
    maxSelectableRooms: 2,
    description: 'Traditional and contemporary prayer room designs.',
    imageUrl: '/images/estimator/poojaroom.png',
    pricePerSqFt: 1200,
    status: 'active',
    requiresDimensions: false,
    allowCustomDimensions: false,
    dimensions: [],
    layouts: [],
    addons: [],
  },
  {
    name: 'Hall',
    displayOrder: 3,
    maxSelectableRooms: 2,
    description: 'Modern living spaces designed for comfort and elegance.',
    imageUrl: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800',
    pricePerSqFt: 1150,
    status: 'active',
    requiresDimensions: true,
    dimensions: hallDimensions,
    layouts: [],
    addons: [],
  },
  {
    name: 'Bedroom',
    displayOrder: 4,
    maxSelectableRooms: 6,
    description: 'Relaxing bedrooms with warm lighting and sophisticated design.',
    imageUrl: 'https://images.pexels.com/photos/1454806/pexels-photo-1454806.jpeg?auto=compress&cs=tinysrgb&w=800',
    pricePerSqFt: 1000,
    status: 'active',
    requiresDimensions: true,
    dimensions: bedroomDimensions,
    layouts: [],
    addons: [],
  },
];

const globalAddonsCatalog = [
  { name: 'Wardrobe', size: "3'3\"W x 7'H x 1'8\"D", price: 39300 },
  { name: 'Study Table', size: "4'W x 2'6\"H x 2'D", price: 16500 },
  { name: 'Folding Ledge', size: "4'L x 1'6\"D x 20 mm", price: 3600 },
  { name: 'Cot King Size', size: "6'W x 6'6\"L x 1'2\"/4\"H", price: 39000 },
  { name: 'Bed Side Table', size: "1'6\"W x 1'6\"H x 1'4\"D", price: 7200 },
  { name: 'Vanity Unit', size: "4'W x 2'H x 1'8\"D", price: 9300 },
  { name: 'Kitchen Island Counter', size: "4'W x 2'8\"H x 2'D", price: 23100 },
  { name: 'Shoe Rack', size: "4'W x 3'H x 1'4\"D", price: 15300 },
  { name: 'Window Pelmet Box', size: "5'W x 8\"H x 8\"D", price: 3000 },
  { name: 'TV Ledge & Panelling', size: "6'W x 4'H x 3\"/1'2\"D", price: 18600 },
].map((addon, index) => ({
  ...addon,
  description: 'TS Web Quote additional item.',
  active: true,
  order: index + 1,
}));

module.exports = { roomsCatalog, globalAddonsCatalog };
