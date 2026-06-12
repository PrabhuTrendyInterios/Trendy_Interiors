const fs = require('fs');
const pdf = require('pdf-parse');

const pdfPath = "C:\\Users\\D E L L\\.gemini\\antigravity-ide\\brain\\5e7ed6b9-4920-40ff-a7ab-37d20932f089\\preview.pdf";
let dataBuffer = fs.readFileSync(pdfPath);

pdf(dataBuffer, {
    pagerender: function(pageData) {
        return pageData.getTextContent().then(function(textContent) {
            let lastY, text = '';
            for (let item of textContent.items) {
                if (lastY == item.transform[5] || !lastY){
                    text += item.str;
                }  
                else{
                    text += '\n' + item.str;
                }    
                lastY = item.transform[5];
            }
            return text;
        });
    }
}).then(function(data) {
    // data.text is now custom rendered
    const pages = data.text.split('\n\n\n'); // roughly separates pages
    console.log("Pages count from library:", data.numpages);
    // Let's just print a short preview of each page
    // Since default text has multiple newlines
});

// alternative: pdf2json or just print string length
