const { calculateEstimate } = require('../utils/calculateEstimate');

const roomDoc = {
  name: 'Pooja Room',
  pricePerSqFt: 0,
  requiresDimensions: false,
  layouts: [
    {
      _id: 'lay1',
      name: 'basic_unit_panelling',
      label: 'Basic Unit & Panelling',
      price: 31500,
    },
  ],
  addons: [],
  dimensions: [],
};

const roomInstances = [{ id: 'Pooja-1', roomName: 'Pooja Room', label: 'Pooja Room' }];

function runTest(selectedLayoutValue) {
  const normalizedDimensions = {
    'Pooja-1': {
      length: 0,
      width: 0,
      height: 0,
      sizeCategory: '',
      selectedDesignIdea: { layout: selectedLayoutValue, addons: [] },
    },
  };

  const quote = calculateEstimate({
    roomInstances,
    normalizedDimensions,
    extraAddons: [],
    roomsCatalog: [roomDoc],
    globalAddons: [],
    selectedPackageComponents: {},
    selectedLayoutMaterials: {},
  });

  console.log('\n---- Test for selectedLayout =', selectedLayoutValue);
  console.log('Total Area:', quote.totalAreaSqFt);
  console.log('Estimated Amount:', quote.estimatedAmount);
  console.log('LineItems:', JSON.stringify(quote.lineItems, null, 2));
}

runTest('Basic Unit & Panelling');
runTest('basic_unit_panelling');
runTest('lay1');
