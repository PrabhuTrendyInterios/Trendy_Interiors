/**
 * Direct PDF generation test
 * Creates sample estimator data and generates a PDF to test the new implementation
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const { generateQuotationPDF } = require('./utils/quotationPDF');

// Sample estimator data matching the Estimator schema
const sampleEstimator = {
  _id: '507f1f77bcf86cd799439011',
  quotationNumber: 'QT-20250608-001',
  createdAt: new Date('2025-06-08'),
  customerInfo: {
    name: 'Rajesh Kumar',
    email: 'rajesh@example.com',
    phone: '+91-9876543210',
    location: 'Mumbai, Maharashtra'
  },
  rooms: {
    'Bedroom': 2,
    'Living Room': 1,
    'Kitchen': 1
  },
  quoteSummary: {
    totalAreaSqFt: 1500,
    globalAddonsTotal: 15000,
    estimatedAmount: 560000,
    lineItems: [
      {
        roomName: 'Bedroom',
        label: 'False Ceiling',
        areaSqFt: 200,
        ratePerSqFt: 250,
        baseCost: 50000,
        layout: 'Cove Lighting',
        layoutCost: 8000,
        addons: ['LED Strips', 'Acoustic Tiles'],
        addonDetails: [
          { id: 'addon-1', name: 'LED Strips', price: 5000 },
          { id: 'addon-2', name: 'Acoustic Tiles', price: 3000 }
        ],
        estimatedCost: 66000
      },
      {
        roomName: 'Bedroom',
        label: 'Wall Painting',
        areaSqFt: 300,
        ratePerSqFt: 50,
        baseCost: 15000,
        layout: '',
        layoutCost: 0,
        addons: [],
        addonDetails: [],
        estimatedCost: 15000
      },
      {
        roomName: 'Living Room',
        label: 'False Ceiling',
        areaSqFt: 400,
        ratePerSqFt: 300,
        baseCost: 120000,
        layout: 'Multi-Level',
        layoutCost: 20000,
        addons: ['Custom Lights'],
        addonDetails: [
          { id: 'addon-3', name: 'Custom Lights', price: 25000 }
        ],
        estimatedCost: 165000
      },
      {
        roomName: 'Kitchen',
        label: 'Modular Kitchen',
        areaSqFt: 100,
        ratePerSqFt: 800,
        baseCost: 80000,
        layout: '',
        layoutCost: 0,
        addons: [],
        addonDetails: [],
        estimatedCost: 80000
      }
    ]
  },
  extraAddons: ['Warranty Extended', 'Installation Support']
};

// Create a mock response object that implements WritableStream interface
const createMockResponse = () => {
  const chunks = [];
  const emitter = new EventEmitter();
  
  const stream = Object.assign(emitter, {
    chunks: chunks,
    write: function(chunk) {
      chunks.push(chunk);
      return true;
    },
    end: function(chunk) {
      if (chunk) chunks.push(chunk);
      // Write chunks to file
      const pdfPath = path.join(__dirname, 'test-output.pdf');
      const buffer = Buffer.concat(chunks);
      fs.writeFileSync(pdfPath, buffer);
      console.log(`✅ PDF saved to: ${pdfPath}`);
      console.log(`📊 PDF size: ${buffer.length} bytes`);
      process.exit(0);
    },
    destroy: function() {
      return this;
    }
  });

  return Object.assign(stream, {
    setHeader: (key, value) => {
      console.log(`Header: ${key} = ${value}`);
    },
    headersSent: false,
    statusCode: 200,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      console.error('ERROR:', JSON.stringify(data));
      process.exit(1);
    }
  });
};

// Generate the PDF
console.log('🔄 Generating PDF with sample estimator data...\n');
const mockRes = createMockResponse();

generateQuotationPDF(sampleEstimator, mockRes, (err) => {
  if (err) {
    console.error('❌ PDF generation error:', err);
    process.exit(1);
  }
});

// Set timeout to ensure we don't hang
setTimeout(() => {
  console.error('❌ PDF generation timed out');
  process.exit(1);
}, 5000);
