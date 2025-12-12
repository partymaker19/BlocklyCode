// Minimal PDF generation script using pdfkit
// Usage: node scripts/create-pdf.js [outPath] [title] [body...]

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const outPath = process.argv[2] || path.join('out', 'report.pdf');
const title = process.argv[3] || 'Отчёт';
const body = process.argv.slice(4).join(' ') || 'Пример PDF, созданный автоматически.';

fs.mkdirSync(path.dirname(outPath), { recursive: true });

const doc = new PDFDocument({ size: 'A4', margin: 50, info: { Title: title } });
const stream = fs.createWriteStream(outPath);
doc.pipe(stream);

doc.fontSize(20).text(title, { align: 'center' });
doc.moveDown();

doc.fontSize(12).text(body, { align: 'left' });
doc.moveDown();

const footer = `Generated at ${new Date().toLocaleString('ru-RU')} by BlocklyCode`;
doc.fontSize(10).fillColor('#666').text(footer, { align: 'right' });

doc.end();

stream.on('finish', () => {
  console.log(`PDF created: ${path.resolve(outPath)}`);
});

