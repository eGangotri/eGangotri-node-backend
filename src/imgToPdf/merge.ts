import { mergeAllPdfsInFolder } from "./utils/PdfLibUtils";
import * as path from 'path';

(async ()=> {
    const pngRootFolder = "C:\\tmp\\M-72-Sulabh Veda Prakash - Kavikulguru Kalidas Sanskrit University Ramtek Collection";
    const pdfRootFolder = "C:\\tmp\\pdfA111";
    console.log("Merge");
    await mergeAllPdfsInFolder(pdfRootFolder, pdfRootFolder + "//" + path.parse(pngRootFolder).name + ".pdf");
})()