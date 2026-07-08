const mongoose = require('mongoose');
const Estimator = require('./models/Estimator');
const { calculateEstimate } = require('./utils/calculateEstimate');
const { generateQuotationPDF } = require('./utils/quotationPDF');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/trendydev');
  
  const Room = require('./models/Room');
  const roomsCatalog = await Room.find({});
  const bedroom = roomsCatalog.find(r => r.name === 'Bedroom');
  const midDimension = bedroom.dimensions.find(d => d.name === 'Mid');
  const comp1 = midDimension.packageComponents[0];
  const comp2 = midDimension.packageComponents[1];
  
  const mockPayload = {
    roomInstances: [{ id: 'room-1', roomName: 'Bedroom', label: 'Bedroom 1' }],
    normalizedDimensions: {
      'room-1': { length: 12, width: 14, height: 10, sizeCategory: midDimension._id.toString() }
    },
    extraAddons: [],
    selectedPackageComponents: {
      'room-1': [comp1._id.toString(), comp2._id.toString()]
    },
    selectedLayoutMaterials: {}
  };
  
  const quoteSummary = calculateEstimate({
    roomInstances: mockPayload.roomInstances,
    normalizedDimensions: mockPayload.normalizedDimensions,
    extraAddons: [],
    roomsCatalog,
    globalAddons: [],
    selectedPackageComponents: mockPayload.selectedPackageComponents,
    selectedLayoutMaterials: mockPayload.selectedLayoutMaterials,
  });
  
  console.log('Pre-save package components length:', quoteSummary.lineItems[0].packageComponents.length);
  console.log('Pre-save isSelected values:', quoteSummary.lineItems[0].packageComponents.map(c => c.isSelected));
  
  const estimatorPayload = {
    rooms: { 'Bedroom': 1 },
    selectedRoomForDimensions: 'room-1',
    roomDimensionsByRoom: mockPayload.normalizedDimensions,
    customerInfo: { name: 'Test User', email: 'test@example.com', phone: '1234567890', location: 'Test Loc' },
    extraAddons: [],
    quoteSummary
  };
  
  const estimator = await new Estimator(estimatorPayload).save();
  const savedEstimator = await Estimator.findById(estimator._id);
  const room1 = savedEstimator.quoteSummary.lineItems[0];
  
  console.log('Post-save package components length:', room1.packageComponents.length);
  console.log('Post-save isSelected values:', room1.packageComponents.map(c => c.isSelected));
  
  await mongoose.disconnect();
}
run().catch(console.error);
