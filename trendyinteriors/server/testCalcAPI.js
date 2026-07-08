const axios = require('axios');

async function testCalc() {
  try {
    const payload = {
      rooms: { 'Bedroom': 1 },
      selectedRoomForDimensions: 'room_bedroom_0',
      roomDimensionsByRoom: {
        'room_bedroom_0': {
          length: 14,
          width: 12,
          height: 10,
          sizeCategory: 'Mid',
          selectedDesignIdea: {
            layout: 'Sliding Wardrobe',
            addons: ['Bed Storage', 'Loft']
          }
        }
      },
      customerInfo: { name: 'Test', email: 'test@example.com' },
      extraAddons: [],
      selectedPackageComponents: {},
      selectedLayoutMaterials: {}
    };

    const res = await axios.post('http://localhost:5000/api/estimators/calculate', payload);
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}

testCalc();
