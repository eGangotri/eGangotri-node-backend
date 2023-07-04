import { google } from 'googleapis';
import { PDFDocument } from 'pdf-lib';
import readlineSync from 'readline-sync';
import fs from 'fs';

async function readFirstPageFromPDF(fileId: string): Promise<string | null> {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: 'credentials.json',
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    const drive = google.drive({ version: 'v3', auth });

    const response = await drive.files.get({
      fileId,
      alt: 'media',
    }, { responseType: 'stream' });

    const pdfBuffer: Buffer[] = [];

    response.data.on('data', (chunk: Buffer) => {
      pdfBuffer.push(chunk);
    });

    await new Promise<void>((resolve, reject) => {
      response.data.on('end', () => {
        resolve();
      });

      response.data.on('error', (error: any) => {
        reject(error);
      });
    });

    const pdfBytes = Buffer.concat(pdfBuffer);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const firstPage = pdfDoc.getPages()[0];
    const firstPageText = await firstPage.getText();

    return firstPageText;
  } catch (error) {
    console.error('Error reading PDF:', error);
    return null;
  }
}

async function main() {
  const fileId = readlineSync.question('Enter Google Drive PDF file ID: ');
  const firstPageText = await readFirstPageFromPDF(fileId);

  if (firstPageText) {
    console.log('First page text:');
    console.log(firstPageText);
  }
}

main();
