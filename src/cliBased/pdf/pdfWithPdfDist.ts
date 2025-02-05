import { getDocument, PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

async function extractFirst25Pages(pdfPath: string, outputPath: string): Promise<void> {
  const loadingTask = getDocument({ url: pdfPath, verbosity: 0 });
  const pdf: PDFDocumentProxy = await loadingTask.promise;

  const totalPages = pdf.numPages;
  const pagesToExtract = Math.min(25, totalPages);

  const extractedPages: PDFPageProxy[] = [];
  for (let i = 1; i <= pagesToExtract; i++) {
    const page: PDFPageProxy = await pdf.getPage(i);
    extractedPages.push(page);
  }

  // Save or process the extracted pages here
  console.log(`Extracted ${extractedPages.length} pages.`);
}

extractFirst25Pages("C:\\Users\\chetan\\Downloads\\UB 5 (2).pdf", 'C:\\Users\\chetan\\Downloads\\test');
//pdftk input.pdf cat 1-25 output output.pdf
pdftk "C:\\Users\\chetan\\Downloads\\UB 5 (2).pdf" cat 1-25 output C:\\Users\\chetan\\test\\1.pdf"
