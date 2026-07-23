/**
 * Quick PDF preview generator — run with: node generatePreviewPDF.js
 */
require('dotenv').config({ path: __dirname + '/.env', override: true });

// Temporarily patch the output path inside quotationPDF by overriding fs.createWriteStream
const fs = require('fs');
const path = require('path');

const outPath = path.join(__dirname, 'preview_quotation.pdf');
const origCreateWriteStream = fs.createWriteStream.bind(fs);

let capturedStream = null;
fs.createWriteStream = function(filePath, opts) {
  const stream = origCreateWriteStream(filePath, opts);
  capturedStream = stream;
  return stream;
};

const { generateQuotationPDF } = require('./utils/quotationPDF');
fs.createWriteStream = origCreateWriteStream;

const sampleEstimator = {
  _id: 'preview123456789',
  customerInfo: {
    name: 'Ashwath Nagarajan', phone: '+91 99652 99777', email: 'ashwath@example.com', location: 'Erode, Tamil Nadu',
  },
  rooms: { 'Bedroom': 1 },
  quoteSummary: {
    totalAreaSqFt: 168, roomTotals: 206000, globalAddonsTotal: 0, estimatedAmount: 206000, gstAmount: 0, grandTotal: 206000, currency: 'INR',
    lineItems: [
      {
        roomId: 'Bedroom-1', roomName: 'Bedroom', label: 'Bedroom 1',
        length: 14, width: 12, height: 10, areaSqFt: 168, ratePerSqFt: 550,
        baseCost: 92400, layout: 'Sliding Wardrobe', layoutCost: 50000,
        addons: ['Bed Storage', 'Study Table'], addonsCost: 63600,
        addonDetails: [
          { id: 'a1', name: 'Bed Storage', price: 45000 },
          { id: 'a2', name: 'Study Table', price: 18600 }
        ],
        packageComponents: [], packageComponentsTotal: 0,
        layoutMaterials: [], layoutMaterialsCost: 0, estimatedCost: 206000,
      }
    ],
  },
};

console.log('🔄 Generating PDF...');
generateQuotationPDF(sampleEstimator, null, (err) => {
  if (err) {
    console.error('❌ PDF generation failed:', err.message);
    process.exit(1);
  }
  const generated = path.join(__dirname, 'Trendy_Interios._Quotation_QT-PREVIEW.pdf');
  const candidates = fs.readdirSync(__dirname).filter(f => f.startsWith('Trendy_Interios._Quotation_') && f.endsWith('.pdf'));
  if (candidates.length > 0) {
    const latest = candidates[candidates.length - 1];
    const from = path.join(__dirname, latest);
    fs.renameSync(from, outPath);
    console.log('✅ PDF generated successfully! Saved to:', outPath);
  }
});
