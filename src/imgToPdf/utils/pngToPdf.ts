import { pngToPdf } from "./PdfUtils";

async function directlyFromPngs() {
    const folderForPngs: string = "E:\\ramtek3----WithPdfMErge";
    const destPdf = "C:\\tmp\\pdfMerge"
    await pngToPdf(folderForPngs, destPdf);
}