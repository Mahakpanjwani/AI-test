import PDFDocument from 'pdfkit';

export function generateVisitorCard(data: {
  digitalCardId: string;
  visitorName: string;
  company: string;
  hostName: string;
  checkInTime: Date;
}) {
  return new Promise<Buffer>((resolve) => {
    const doc = new PDFDocument({ size: 'A6', margin: 20 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk as Buffer));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    doc.fontSize(16).text('VISITOR DIGITAL ID', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Card ID: ${data.digitalCardId}`);
    doc.text(`Name: ${data.visitorName}`);
    doc.text(`Company: ${data.company}`);
    doc.text(`Meeting: ${data.hostName}`);
    doc.text(`Check-In: ${data.checkInTime.toISOString()}`);
    doc.text('Status: ACTIVE (until checkout)');
    doc.end();
  });
}
