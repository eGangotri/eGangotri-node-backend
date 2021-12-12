import { 
    checkPageCountEqualsImgCountInFolderUsingPdfLib, 
    mergeAllPdfsInFolder, 
    mergePdfsInList 
} from "./utils/PdfLibUtils";
import * as path from 'path';
import { getAllPdfs, getAllPdfsInFolders, getDirectoriesWithFullPath } from "./utils/Utils";
import { addReport, printReport } from "./index";
import { PDF_EXT, PDF_SUB_FOLDER, PNG_SUB_FOLDER } from "./utils/constants";
import { mergeUsingEasyPdf } from "./utils/EasyPdfMergeUtil";

(async () => {
    const rootFolder = "E:\\ramtek2---";
    const allPdfsFolders = (await getDirectoriesWithFullPath("E:\\ramtek2---")).filter(
        (dir:any) => !dir.match(/ignore/)
    );

    console.log(`Statred Merge-PDF Program for ${allPdfsFolders.length} folders`);
    for (let folder of allPdfsFolders) {
        const pdfName = rootFolder + "//" + path.parse(folder).name + PDF_EXT
        console.log(`mergeAllPdfsInFolder
        ${path.parse(folder).name} `);
        try {
            const _folders = (await getDirectoriesWithFullPath(folder + PDF_SUB_FOLDER)).filter(
                (dir:any) => !dir.match(/ignore/)
            );
            const pdfsInFolders = await getAllPdfsInFolders(_folders);
            console.log("going to mergeusing easypdf")
            //mergeUsingEasyPdf(pdfsInFolders.slice(0,30), pdfName);
            //await mergePdfsInList(folder + PDF_SUB_FOLDER, pdfName);
            //await checkPageCountEqualsImgCountInFolderUsingPdfLib(pdfName, folder + PNG_SUB_FOLDER);
        }
        catch (e) {
            addReport(`***mergeAllPdfsInFolder
            ${path.parse(folder).name} Failed 
            ${e}`)
        }
    }
    printReport();
})()