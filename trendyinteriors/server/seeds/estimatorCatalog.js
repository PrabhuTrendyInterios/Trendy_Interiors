// ─── BEDROOM DIMENSIONS ───────────────────────────────────────────────────────
const BEDROOM_DIMENSIONS = [
  {
    name: 'Low',
    length: 10,
    width: 10,
    height: 9,
    packageComponents: [
      { name: 'Wardrobe (4ft)',         price: 85000,  mandatory: false, displayOrder: 1 },
      { name: 'Storage Unit',           price: 18000,  mandatory: false, displayOrder: 2 },
      { name: 'Loft Shuttering',        price: 22000,  mandatory: false, displayOrder: 3 },
      { name: 'Bed Side Table',         price: 5500,   mandatory: false, displayOrder: 4 },
      { name: 'TV Ledge & Paneling',    price: 14000,  mandatory: false, displayOrder: 5 },
    ],
  },
  {
    name: 'Mid',
    length: 14,
    width: 12,
    height: 10,
    packageComponents: [
      { name: 'Wardrobe (6ft)',         price: 128998, mandatory: false, displayOrder: 1 },
      { name: 'Storage Unit',           price: 23400,  mandatory: false, displayOrder: 2 },
      { name: 'Loft Shuttering',        price: 31500,  mandatory: false, displayOrder: 3 },
      { name: 'Dressing Unit',          price: 22200,  mandatory: false, displayOrder: 4 },
      { name: 'King Size Cot',          price: 39000,  mandatory: false, displayOrder: 5 },
      { name: 'TV Ledge & Paneling',    price: 18599,  mandatory: false, displayOrder: 6 },
      { name: 'Bed Side Table',         price: 7200,   mandatory: false, displayOrder: 7 },
    ],
  },
  {
    name: 'Large',
    length: 18,
    width: 16,
    height: 11,
    packageComponents: [
      { name: 'Wardrobe (8ft)',         price: 165000, mandatory: false, displayOrder: 1 },
      { name: 'Storage Unit',           price: 28000,  mandatory: false, displayOrder: 2 },
      { name: 'Loft Shuttering',        price: 38000,  mandatory: false, displayOrder: 3 },
      { name: 'Dressing Unit',          price: 28500,  mandatory: false, displayOrder: 4 },
      { name: 'King Size Cot',          price: 45000,  mandatory: false, displayOrder: 5 },
      { name: 'TV Ledge & Paneling',    price: 22000,  mandatory: false, displayOrder: 6 },
      { name: 'Bed Side Table',         price: 9000,   mandatory: false, displayOrder: 7 },
      { name: 'Study Table & Shelf',    price: 18000,  mandatory: false, displayOrder: 8 },
    ],
  },
];

// ─── KITCHEN DIMENSIONS ───────────────────────────────────────────────────────
const KITCHEN_DIMENSIONS = [
  {
    name: 'Low',
    length: 10,
    width: 10,
    height: 9,
    packageComponents: [
      { name: 'Base Cabinets',          price: 45000,  mandatory: false, displayOrder: 1 },
      { name: 'Wall Cabinets',          price: 30000,  mandatory: false, displayOrder: 2 },
      { name: 'Counter Top (Granite)',  price: 18000,  mandatory: false, displayOrder: 3 },
      { name: 'Sink & Faucet',          price: 8000,   mandatory: false, displayOrder: 4 },
    ],
  },
  {
    name: 'Mid',
    length: 14,
    width: 12,
    height: 10,
    packageComponents: [
      { name: 'Base Cabinets',          price: 65000,  mandatory: false, displayOrder: 1 },
      { name: 'Wall Cabinets',          price: 42000,  mandatory: false, displayOrder: 2 },
      { name: 'Counter Top (Granite)',  price: 24000,  mandatory: false, displayOrder: 3 },
      { name: 'Sink & Faucet',          price: 10000,  mandatory: false, displayOrder: 4 },
      { name: 'Breakfast Counter',      price: 18000,  mandatory: false, displayOrder: 5 },
    ],
  },
  {
    name: 'Large',
    length: 18,
    width: 16,
    height: 11,
    packageComponents: [
      { name: 'Base Cabinets',          price: 90000,  mandatory: false, displayOrder: 1 },
      { name: 'Wall Cabinets',          price: 58000,  mandatory: false, displayOrder: 2 },
      { name: 'Counter Top (Granite)',  price: 32000,  mandatory: false, displayOrder: 3 },
      { name: 'Sink & Faucet',          price: 12000,  mandatory: false, displayOrder: 4 },
      { name: 'Breakfast Counter',      price: 22000,  mandatory: false, displayOrder: 5 },
      { name: 'Pantry Unit',            price: 28000,  mandatory: false, displayOrder: 6 },
    ],
  },
];

// ─── HALL DIMENSIONS ──────────────────────────────────────────────────────────
const HALL_DIMENSIONS = [
  {
    name: 'Low',
    length: 10,
    width: 10,
    height: 9,
    packageComponents: [
      { name: 'TV Unit',                price: 22000,  mandatory: false, displayOrder: 1 },
      { name: 'Shoe Rack',              price: 8000,   mandatory: false, displayOrder: 2 },
    ],
  },
  {
    name: 'Mid',
    length: 14,
    width: 12,
    height: 10,
    packageComponents: [
      { name: 'TV Unit',                price: 30000,  mandatory: false, displayOrder: 1 },
      { name: 'Storage Cabinet',        price: 18000,  mandatory: false, displayOrder: 2 },
      { name: 'Shoe Rack',              price: 10000,  mandatory: false, displayOrder: 3 },
      { name: 'Display Shelves',        price: 12000,  mandatory: false, displayOrder: 4 },
    ],
  },
  {
    name: 'Large',
    length: 18,
    width: 16,
    height: 11,
    packageComponents: [
      { name: 'TV Unit',                price: 42000,  mandatory: false, displayOrder: 1 },
      { name: 'Storage Cabinet',        price: 24000,  mandatory: false, displayOrder: 2 },
      { name: 'Shoe Rack',              price: 12000,  mandatory: false, displayOrder: 3 },
      { name: 'Display Shelves',        price: 16000,  mandatory: false, displayOrder: 4 },
      { name: 'Bar Unit',               price: 35000,  mandatory: false, displayOrder: 5 },
    ],
  },
];

// ─── POOJA ROOM DIMENSIONS ────────────────────────────────────────────────────
const POOJA_DIMENSIONS = [
  {
    name: 'Low',
    length: 10,
    width: 10,
    height: 9,
    packageComponents: [
      { name: 'Pooja Cabinet',          price: 28000,  mandatory: false, displayOrder: 1 },
      { name: 'Marble Platform',        price: 12000,  mandatory: false, displayOrder: 2 },
    ],
  },
  {
    name: 'Mid',
    length: 14,
    width: 12,
    height: 10,
    packageComponents: [
      { name: 'Pooja Cabinet',          price: 38000,  mandatory: false, displayOrder: 1 },
      { name: 'Marble Platform',        price: 18000,  mandatory: false, displayOrder: 2 },
      { name: 'Jali Work (Decorative)', price: 15000,  mandatory: false, displayOrder: 3 },
    ],
  },
  {
    name: 'Large',
    length: 18,
    width: 16,
    height: 11,
    packageComponents: [
      { name: 'Pooja Cabinet',          price: 52000,  mandatory: false, displayOrder: 1 },
      { name: 'Marble Platform',        price: 24000,  mandatory: false, displayOrder: 2 },
      { name: 'Jali Work (Decorative)', price: 20000,  mandatory: false, displayOrder: 3 },
      { name: 'Storage Drawers',        price: 14000,  mandatory: false, displayOrder: 4 },
    ],
  },
];


const roomsCatalog = [
  {
    name: 'Kitchen',
    description: 'Modular kitchen design with smart storage and premium finishes.',
    imageUrl:
      'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=800',
    pricePerSqFt: 1350,
    status: 'active',
    dimensions: KITCHEN_DIMENSIONS,
    layouts: [
      {
        name: 'L Shape',
        imageUrl:
          'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?auto=format&fit=crop&w=700&q=80',
        description: 'Efficient corner kitchen layout',
        fixedPrice: 15000,
        hasLayoutMaterials: true,
        configurations: [
          {
            dimensionId: 'Low',
            materials: [
              { name: 'Laminate', price: 8000, mandatory: true },
              { name: 'Granite', price: 15000, mandatory: false },
            ],
          },
          {
            dimensionId: 'Mid',
            materials: [
              { name: 'Laminate', price: 10000, mandatory: true },
              { name: 'Granite', price: 18000, mandatory: false },
            ],
          },
          {
            dimensionId: 'Large',
            materials: [
              { name: 'Laminate', price: 12000, mandatory: true },
              { name: 'Granite', price: 22000, mandatory: false },
            ],
          },
        ],
      },
      {
        name: 'U Shape',
        imageUrl:
          'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=700&q=80',
        description: 'Maximum counter and storage space',
        fixedPrice: 20000,
        hasLayoutMaterials: true,
        configurations: [
          {
            dimensionId: 'Low',
            materials: [
              { name: 'Laminate', price: 10000, mandatory: true },
              { name: 'Granite', price: 18000, mandatory: false },
            ],
          },
          {
            dimensionId: 'Mid',
            materials: [
              { name: 'Laminate', price: 12000, mandatory: true },
              { name: 'Granite', price: 21000, mandatory: false },
            ],
          },
          {
            dimensionId: 'Large',
            materials: [
              { name: 'Laminate', price: 15000, mandatory: true },
              { name: 'Granite', price: 25000, mandatory: false },
            ],
          },
        ],
      },
      {
        name: 'Straight',
        imageUrl:
          'https://images.unsplash.com/photo-1556909172-8c2f041fca1e?auto=format&fit=crop&w=700&q=80',
        description: 'Compact linear kitchen',
        fixedPrice: 12000,
        hasLayoutMaterials: false,
        configurations: [],
      },
      {
        name: 'Island',
        imageUrl:
          'https://images.unsplash.com/photo-1600489000022-c2086d79f9d4?auto=format&fit=crop&w=700&q=80',
        description: 'Island kitchen with open planning',
        fixedPrice: 25000,
        hasLayoutMaterials: true,
        configurations: [
          {
            dimensionId: 'Mid',
            materials: [
              { name: 'Laminate', price: 14000, mandatory: true },
              { name: 'Granite', price: 24000, mandatory: false },
            ],
          },
          {
            dimensionId: 'Large',
            materials: [
              { name: 'Laminate', price: 18000, mandatory: true },
              { name: 'Granite', price: 30000, mandatory: false },
            ],
          },
        ],
      },
    ],
    addons: [
      {
        name: 'Chimney',
        imageUrl:
          'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=700&q=80',
        description: 'Premium chimney unit',
        price: 25000,
      },
      {
        name: 'Tall Unit',
        imageUrl:
          'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=700&q=80',
        description: 'Full-height storage unit',
        price: 22000,
      },
    ],
  },
  {
    name: 'Bedroom',
    description: 'Relaxing bedrooms with warm lighting and sophisticated design.',
    imageUrl:
      'https://images.pexels.com/photos/1454806/pexels-photo-1454806.jpeg?auto=compress&cs=tinysrgb&w=800',
    pricePerSqFt: 1000,
    status: 'active',
    dimensions: BEDROOM_DIMENSIONS,
    layouts: [
      {
        name: 'Sliding Wardrobe',
        imageUrl:
          'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=700&q=80',
        description: 'Space-saving sliding wardrobe',
        fixedPrice: 18000,
        hasLayoutMaterials: true,
        configurations: [
          {
            dimensionId: 'Low',
            materials: [
              { name: 'Particle Board', price: 6000, mandatory: true },
              { name: 'Plywood', price: 10000, mandatory: false },
            ],
          },
          {
            dimensionId: 'Mid',
            materials: [
              { name: 'Particle Board', price: 7500, mandatory: true },
              { name: 'Plywood', price: 12000, mandatory: false },
            ],
          },
          {
            dimensionId: 'Large',
            materials: [
              { name: 'Particle Board', price: 9000, mandatory: true },
              { name: 'Plywood', price: 15000, mandatory: false },
            ],
          },
        ],
      },
      {
        name: 'Hinged Wardrobe',
        imageUrl:
          'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&w=700&q=80',
        description: 'Classic hinged wardrobe',
        fixedPrice: 15000,
        hasLayoutMaterials: true,
        configurations: [
          {
            dimensionId: 'Low',
            materials: [
              { name: 'Particle Board', price: 5500, mandatory: true },
              { name: 'Plywood', price: 9000, mandatory: false },
            ],
          },
          {
            dimensionId: 'Mid',
            materials: [
              { name: 'Particle Board', price: 7000, mandatory: true },
              { name: 'Plywood', price: 11000, mandatory: false },
            ],
          },
          {
            dimensionId: 'Large',
            materials: [
              { name: 'Particle Board', price: 8500, mandatory: true },
              { name: 'Plywood', price: 14000, mandatory: false },
            ],
          },
        ],
      },
    ],
    addons: [
      {
        name: 'Bed Storage',
        imageUrl:
          'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=700&q=80',
        description: 'Hydraulic bed with storage',
        price: 20000,
      },
      {
        name: 'Dressing Unit',
        imageUrl:
          'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=700&q=80',
        description: 'Dedicated dressing area',
        price: 25000,
      },
      {
        name: 'Study Unit',
        imageUrl:
          'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=700&q=80',
        description: 'Integrated study desk',
        price: 18000,
      },
      {
        name: 'Loft',
        imageUrl:
          'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=700&q=80',
        description: 'Overhead loft storage',
        price: 30000,
      },
    ],
  },
  {
    name: 'Hall',
    description: 'Modern living spaces designed for comfort and elegance.',
    imageUrl:
      'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800',
    pricePerSqFt: 1150,
    status: 'active',
    dimensions: HALL_DIMENSIONS,
    layouts: [],
    addons: [
      {
        name: 'TV Unit',
        imageUrl:
          'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=700&q=80',
        description: 'Designer TV wall unit',
        price: 28000,
      },
      {
        name: 'Sofa Setup',
        imageUrl:
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=700&q=80',
        description: 'Curated sofa arrangement',
        price: 35000,
      },
      {
        name: 'False Ceiling',
        imageUrl:
          'https://images.unsplash.com/photo-1600210491369-e753d80a41f3?auto=format&fit=crop&w=700&q=80',
        description: 'POP ceiling with cove lighting',
        price: 40000,
      },
    ],
  },
  {
    name: 'Pooja Room',
    description: 'Traditional and contemporary prayer room designs.',
    imageUrl: '/images/estimator/poojaroom.png',
    pricePerSqFt: 1200,
    status: 'active',
    dimensions: POOJA_DIMENSIONS,
    layouts: [],
    addons: [],
  },
];

const globalAddonsCatalog = [
  {
    name: 'Lighting Package',
    price: 35000,
    description: 'Ambient, task, and accent lighting solutions for your home.',
    active: true,
    order: 1,
  },
  {
    name: 'Wallpaper / Panels',
    price: 28000,
    description: 'Designer textures and elegant wall panels.',
    active: true,
    order: 2,
  },
  {
    name: 'Pooja Unit',
    price: 45000,
    description: 'Custom traditional or modern prayer unit.',
    active: true,
    order: 3,
  },
  {
    name: 'False Ceiling',
    price: 55000,
    description: 'Premium POP ceiling with integrated LED lighting.',
    active: true,
    order: 4,
  },
  {
    name: 'Luxury Flooring',
    price: 75000,
    description: 'High-end marble, hardwood, or designer tiling.',
    active: true,
    order: 5,
  },
  {
    name: 'Curtains & Blinds',
    price: 32000,
    description: 'Designer curtains and motorized window blinds.',
    active: true,
    order: 6,
  },
];

module.exports = {
  roomsCatalog,
  globalAddonsCatalog,
};
