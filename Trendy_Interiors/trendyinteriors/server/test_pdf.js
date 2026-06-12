const { generateQuotationPDF } = require('./utils/quotationPDF.js');

const estimator = {
  _id: "1234567890abcdef12345678",
  customerInfo: {
    name: "Rajesh Kumar",
    phone: "+91 98765 43210",
    email: "rajesh.kumar@gmail.com",
    location: "42, Avinashi Road, Coimbatore"
  },
  quoteSummary: {
    totalAreaSqFt: 1850,
    roomTotals: 485000,
    gstAmount: 97200,
    grandTotal: 618200,
    lineItems: [
      {
        roomId: "r1",
        roomName: "Master Bedroom",
        label: "Master Bedroom",
        areaSqFt: 350,
        layout: "Premium",
        addons: ["Walk-in Wardrobe", "TV Unit"],
        estimatedCost: 145000
      },
      {
        roomId: "global-addons",
        roomName: "Global Add-ons",
        label: "Global Add-ons",
        areaSqFt: 0,
        layout: "",
        addons: [],
        estimatedCost: 36000,
        addonDetails: [
          { name: "False Ceiling (Full Home)", price: 22000 },
          { name: "Electrical Upgrades", price: 8000 },
          { name: "Smart Home Basic Package", price: 6000 }
        ]
      }
    ]
  }
};

generateQuotationPDF(estimator, null, (err) => {
  if (err) {
    console.error("Error generating PDF:", err);
  } else {
    console.log("PDF generated successfully!");
  }
});
