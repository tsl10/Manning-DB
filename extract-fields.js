
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function extractFields() {
  const pdfPath = path.join(__dirname, 'public', 'uploads', 'Crew CV blank form.pdf');
  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  console.log('Form Fields Found:');
  fields.forEach((field, index) => {
    const name = field.getName();
    const type = field.constructor.name;
    console.log(`${index + 1}. Name: "${name}", Type: ${type}`);
  });
}

extractFields().catch(console.error);
