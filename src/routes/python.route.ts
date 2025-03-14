import * as express from 'express';
import { DEFAULT_PDF_PAGE_EXTRACTION_COUNT } from '../cliBased/pdf/extractFirstAndLastNPages';
import { runPythonCopyPdfInLoop, runPthonPdfExtractionInLoop, executePythonPostCall } from '../services/pythonRestService';
import { IMG_TYPE_ANY } from '../mirror/constants';

export const pythonRoute = express.Router();

pythonRoute.post('/getFirstAndLastNPages', async (req: any, resp: any) => {
    try {
        const srcFoldersAsCSV = req?.body?.srcFolders;
        let destRootFolder = req?.body?.destRootFolder;
        const reducePdfSizeAlso = req?.body?.reducePdfSizeAlso || true;
        const nPages = req?.body?.nPages || DEFAULT_PDF_PAGE_EXTRACTION_COUNT;
        let firstNPages = DEFAULT_PDF_PAGE_EXTRACTION_COUNT;
        let lastNPages = DEFAULT_PDF_PAGE_EXTRACTION_COUNT;

        if (!isNaN(nPages)) {
            firstNPages = nPages <= 0 ? DEFAULT_PDF_PAGE_EXTRACTION_COUNT : nPages;
            lastNPages = nPages <= 0 ? DEFAULT_PDF_PAGE_EXTRACTION_COUNT : nPages;
        } else {
            if (nPages?.trim().includes('-')) {
                const [start, end] = nPages.split('-').map((x: string) => parseInt(x?.trim()));
                firstNPages = start;
                lastNPages = end;
            } else {
                firstNPages = parseInt(nPages?.trim());
                lastNPages = parseInt(nPages?.trim());
            }
        }
        const _srcFolders: string[] = srcFoldersAsCSV.split(',').map((x: string) => x.trim());
        console.log(`getFirstAndLastNPages _folders(${_srcFolders.length}) ${_srcFolders} 
        destRootFolder ${destRootFolder}
        ${firstNPages}/${lastNPages}`)

        if (!srcFoldersAsCSV || !destRootFolder) {
            resp.status(300).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "msg": "Pls. provide Src Folder and Dest Folder"
                }
            });
            return;
        }
        const combinedResults = await runPthonPdfExtractionInLoop(_srcFolders, 
            destRootFolder, firstNPages, lastNPages, reducePdfSizeAlso);
        if(combinedResults){
            const stats = combinedResults.filter((x: { success: boolean }) => x.success === true).length;
            console.log(`combinedResults extractFirstN: ${stats} of ${combinedResults.length} processed successfully`);
            resp.status(200).send({
                response: {
                    successes: stats === combinedResults.length,
                    _cumulativeMsg: `${stats} of ${combinedResults.length} processed successfully`,
                    ...combinedResults,
                }
            });
        }
        else {
            resp.status(300).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "msg": "Failed to extract PDFs"
                }
            });
        }
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

pythonRoute.post('/copyAllPdfs', async (req: any, resp: any) => {
    try {
        const srcFoldersAsCSV = req?.body?.srcFolders;
        let destRootFolder = req?.body?.destRootFolder;
        const _srcFolders: string[] = srcFoldersAsCSV.split(',').map((x: string) => x.trim());
        console.log(`copyAllPdfs _folders(${_srcFolders.length}) ${_srcFolders} 
        destRootFolder ${destRootFolder}`);

        if (!srcFoldersAsCSV || !destRootFolder) {
            resp.status(300).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "msg": "Pls. provide Src Folder and Dest Folder"
                }
            });
            return;
        }
        const combinedResults = await runPythonCopyPdfInLoop(_srcFolders, destRootFolder);
        const stats = combinedResults.filter((x: { success: boolean }) => x.success === true).length;
        console.log(`combinedResults copyAllPdfs: ${stats} of ${combinedResults.length} processed successfully`);
        resp.status(200).send({
            response: {
                successes: stats === combinedResults.length,
                _cumulativeMsg: `${stats} of ${combinedResults.length} processed successfully`,
                ...combinedResults,
            }
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

pythonRoute.post('/convert-img-folder-to-pdf', async (req: any, resp: any) => {
    try {
        const src_folder = req?.body?.src_folder;
        const dest_folder = req?.body?.dest_folder;
        const img_type = req?.body?.img_type;

        if (!src_folder || !dest_folder) {
            resp.status(300).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "msg": "Pls. provide Src Folder and Dest Folder"
                }
            });
            return;
        }
        console.log(`convert-img-folder-to-pdf src_folder ${src_folder} dest_folder ${dest_folder} img_type ${img_type}`);
        const _resp = await executePythonPostCall({
            "src_folder": src_folder,
            "dest_folder": dest_folder,
            img_type:   img_type
        }, 'convert-img-folder-to-pdf');
        
        resp.status(200).send({
            response: _resp
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

pythonRoute.post('/verfiyImgtoPdf', async (req: any, resp: any) => {
    try {
        const src_folder = req?.body?.src_folder;
        const img_type = req?.body?.img_type || IMG_TYPE_ANY;
        const dest_folder = req?.body?.dest_folder;

        if (!src_folder || !dest_folder) {
            resp.status(300).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "msg": "Pls. provide Src/Dest for Pdf->Img Verfication"
                }
            });
            return;
        }
        console.log(`verfiyImgtoPdf folder_path ${src_folder} img_type ${img_type}`);
        const _resp = await executePythonPostCall({
            "src_folder": src_folder,
            "dest_folder": dest_folder,
            "img_type":   img_type
        }, 'verfiyImgtoPdf');
        
        resp.status(200).send({
            response: _resp
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})


pythonRoute.post('/mergePdfs', async (req: any, resp: any) => {
    try {
        const first_pdf_path = req?.body?.first_pdf_path;
        const second_pdf_path = req?.body?.second_pdf_path
        const third_pdf_path = req?.body?.third_pdf_path || ""

        if (!first_pdf_path || !second_pdf_path) {
            resp.status(300).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "msg": "Pls. provide Complete Path for both Pdfs for merge"
                }
            });
            return;
        }
        console.log(`mergePdfs first_pdf_path ${first_pdf_path} second_pdf_path ${second_pdf_path}`);
        const _resp = await executePythonPostCall({
            "first_pdf_path": first_pdf_path,
            "second_pdf_path": second_pdf_path,
            "third_pdf_path":   third_pdf_path
        }, 'mergePdfs');
        
        resp.status(200).send({
            response: _resp
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

