const fs = require('fs');
const path = require('path');
const { generateQuotationPDF } = require('./utils/quotationPDF');

const sampleEstimator = {
  _id: "647f2a11b8a531001f3e79d1",
  createdAt: new Date(),
  customerInfo: {
    name: "BHARATHKUMAR J",
    phone: "9363751268",
    email: "bharathkumarj.24aid@kongu.edu",
    address: "Salem"
  },
  quoteSummary: {
    totalAreaSqFt: 336,
    roomTotals: 534200,
    globalAddonsTotal: 107000,
    subtotal: 641200,
    gstAmount: 96156,
    grandTotal: 630356,
    lineItems: [
      {
        roomId: "Bedroom-1",
        roomName: "Bedroom",
        label: "Bedroom",
        areaSqFt: 168,
        layout: "Sliding Wardrobe",
        addons: ["Bed Storage"],
        estimatedCost: 206000
      },
      {
        roomId: "Hall-1",
        roomName: "Hall",
        label: "Hall",
        areaSqFt: 168,
        layout: "Standard",
        addons: ["TV Unit"],
        estimatedCost: 221200
      },
      {
        roomId: "global-addons",
        roomName: "Global Add-ons",
        label: "Premium Add-ons",
        estimatedCost: 107000,
        addonDetails: [
          { id: "1", name: "Curtains & Blinds", price: 53500 },
          { id: "2", name: "Luxury Flooring", price: 53500 }
        ]
      }
    ]
  }
};

const resMock = {
  setHeader: () => {},
  pipe: (stream) => stream,
  on: (event, cb) => {
    if (event === 'finish') setTimeout(cb, 100);
  }
};

const outputPath = path.join(
  "C:\\Users\\D E L L\\.gemini\\antigravity-ide\\brain\\5e7ed6b9-4920-40ff-a7ab-37d20932f089",
  "preview.pdf"
);

generateQuotationPDF(sampleEstimator, null, (err) => {
  if (err) {
    console.error("Error generating PDF:", err);
  } else {
    console.log("PDF generated at:", outputPath);
  }
});

// Since we passed `null` for `res`, the script inside `generateQuotationPDF`
// should be modified to pipe to outputPath if `res` is null or if a path is provided.
