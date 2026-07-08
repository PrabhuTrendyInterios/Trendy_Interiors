const { calculateEstimate } = require('./utils/calculateEstimate');
const Room = require('./models/Room');
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/trendydev');

  const roomsCatalog = await Room.find({});
  const globalAddonsCatalog = [
    { name: 'Luxury Flooring', price: 75000, active: true },
    { name: 'Curtains & Blinds', price: 32000, active: true }
  ];

  const kitchen = roomsCatalog.find(r => r.name === 'Kitchen');
  const bedroom = roomsCatalog.find(r => r.name === 'Bedroom');

  const mockPayload = {
    roomInstances: [
      { id: 'k1', roomName: 'Kitchen', label: 'Kitchen 1' },
      { id: 'b1', roomName: 'Bedroom', label: 'Bedroom 1' }
    ],
    normalizedDimensions: {
      'k1': { length: 10, width: 10, height: 9, sizeCategory: 'Low', selectedDesignIdea: { layout: 'Island', addons: ['Chimney'] } },
      'b1': { length: 14, width: 12, height: 10, sizeCategory: 'Mid', selectedDesignIdea: { layout: 'Sliding Wardrobe', addons: ['Study Unit', 'Bed Storage', 'Dressing Unit', 'Loft'] } }
    },
    extraAddons: ['Luxury Flooring', 'Curtains & Blinds'],
    selectedPackageComponents: {
      'k1': [], // assuming some IDs if needed
      'b1': []
    },
    selectedLayoutMaterials: {}
  };

  const quoteSummary = calculateEstimate({
    roomInstances: mockPayload.roomInstances,
    normalizedDimensions: mockPayload.normalizedDimensions,
    extraAddons: mockPayload.extraAddons,
    roomsCatalog,
    globalAddons: globalAddonsCatalog,
    selectedPackageComponents: mockPayload.selectedPackageComponents,
    selectedLayoutMaterials: mockPayload.selectedLayoutMaterials,
  });

  console.log('--- CALCULATION VERIFICATION ---');
  let manualRoomSum = 0;
  quoteSummary.lineItems.forEach(item => {
    if(item.roomId === 'global-addons') return;
    console.log(`\nRoom: ${item.label}`);
    console.log(`Base Cost: ${item.baseCost}`);
    console.log(`Layout Cost: ${item.layoutCost}`);
    console.log(`Addons Cost: ${item.addonsCost}`);
    console.log(`Package Components Cost: ${item.packageComponentsTotal}`);
    const sum = item.baseCost + item.layoutCost + item.addonsCost + item.packageComponentsTotal + (item.layoutMaterialsCost || 0);
    console.log(`Math Check (Base + Layout + Addons + Pkg): ${sum} | Output estimatedCost: ${item.estimatedCost}`);
    manualRoomSum += item.estimatedCost;
  });

  console.log('\n--- TOTALS VERIFICATION ---');
  console.log(`Manual Room Sum: ${manualRoomSum} | Output roomTotals: ${quoteSummary.roomTotals}`);
  console.log(`Global Addons Total: ${quoteSummary.globalAddonsTotal}`);
  
  const expectedPreTax = manualRoomSum + quoteSummary.globalAddonsTotal;
  console.log(`Expected Pre-Tax Total: ${expectedPreTax} | Output estimatedAmount: ${quoteSummary.estimatedAmount}`);

  const expectedGst = Math.round(expectedPreTax * 0.18);
  console.log(`Expected 18% GST: ${expectedGst}`);
  
  const expectedGrandTotal = expectedPreTax + expectedGst;
  console.log(`Expected Grand Total (with GST): ${expectedGrandTotal}`);

  await mongoose.disconnect();
}

run().catch(console.error);
