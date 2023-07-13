import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import * as os from 'os';
const HOME_DIR = os.homedir();
import { google, drive_v3 } from 'googleapis';

export async function readPdfFromDriveAndMerge(drive2: drive_v3.Drive, folderName:string, fileId:string, umbrellaFolder:string) {
    console.log(`folderName:${folderName} fileId:${fileId}: umbrellaFolder: ${umbrellaFolder}`);
    
 // Authenticate and authorize the application
//  const auth = new google.auth.GoogleAuth({
//     keyFile: 'C:/Users/chetan/eGangotri/googleDriveCredentials/credentials.json',
//     scopes: ['https://www.googleapis.com/auth/drive.readonly'],
//   });
//   const authClient = (await auth.getClient()) ;
//   // Create a Drive client
//   const drive = google.drive({ version: 'v3',
//    auth: authClient as any
// });

// const auth2 = await google.auth.getClient({ scopes: ['https://www.googleapis.com/auth/drive'] });
// const authX = await google.auth.getClient({
//   //  keyFile: 'C:/Users/chetan/eGangotri/googleDriveCredentials/credentials.json',
//     scopes: ['https://www.googleapis.com/auth/drive.readonly'] });
// //const drive = google.drive({ version: 'v3', auth });
// const drive3 = google.drive({ version: 'v3', auth:auth2 });

console.log('...3',fileId);

  // Download the PDF file from Google Drive
  const response = await drive2.files.export(
    {
      fileId:`${fileId}`,
      mimeType: 'application/pdf',
    },
    { responseType: 'stream' }
  );
  console.log('...4');

  // Read the downloaded PDF file
  const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    response.data.on('data', (chunk: Buffer) => chunks.push(chunk));
    response.data.on('end', () => resolve(Buffer.concat(chunks)));
    response.data.on('error', (error: Error) => reject(error));
  });

  // Load the PDF file using pdf-lib
  const pdfDoc = await PDFDocument.load(pdfBuffer);

  // Access the PDF content
  const totalPages = pdfDoc.getPageCount();
  const pdfTitle = pdfDoc.getTitle();

  console.log(`Total Pages: ${totalPages} pdfTitle ${pdfTitle}`);
  const firstTenPages = pdfDoc.getPages().slice(0, 10);
  const lastTenPages = pdfDoc.getPages().slice(-10);

  // Create a new PDF document for merged pages
  const mergedPdfDoc = await PDFDocument.create();

  // Copy pages from the first ten pages array
  for (const page of firstTenPages) {
    const pageIndex = pdfDoc.getPages().indexOf(page);
    const copiedPage = await mergedPdfDoc.copyPages(pdfDoc, [pageIndex]);
    mergedPdfDoc.addPage(copiedPage[0]);
  }

  // Copy pages from the last ten pages array
  for (const page of lastTenPages) {
    const pageIndex = pdfDoc.getPages().indexOf(page);
    const copiedPage = await mergedPdfDoc.copyPages(pdfDoc, [pageIndex]);
    mergedPdfDoc.addPage(copiedPage[0]);
  }

  // Save the merged PDF to a file
  const mergedPdfBytes = await mergedPdfDoc.save();
  fs.writeFileSync(`${HOME_DIR}/${umbrellaFolder}/${folderName}/${fileId}-${pdfTitle}.pdf`, mergedPdfBytes);
}

//readPdfFromDriveAndMerge().catch(console.error);
