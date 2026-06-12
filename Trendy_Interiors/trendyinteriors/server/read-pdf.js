const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const pdfPath = "C:\\Users\\D E L L\\.gemini\\antigravity-ide\\brain\\5e7ed6b9-4920-40ff-a7ab-37d20932f089\\preview.pdf";
let dataBuffer = fs.readFileSync(pdfPath);

pdf(dataBuffer).then(function(data) {
    console.log("Number of pages:", data.numpages);
    console.log("Text snippet:", data.text.substring(0, 500));
}).catch(err => {
    console.error("Error parsing PDF:", err);
});
