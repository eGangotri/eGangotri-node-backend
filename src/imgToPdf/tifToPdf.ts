import { deleteAllPngs } from './utils/ImgUtils';
import { createPdfAndDeleteGeneratedFiles, mergepPdfs } from './utils/PdfUtils';
import { tifftoPngs } from './utils/PngUtils';
import * as fs from 'fs';
import { getDirectories } from './utils/Utils';


export let GENERATION_REPORT = [];

async function tifToPdf(src:string,dest:string){
    if (!fs.existsSync(dest)){
        fs.mkdirSync(dest);
    }
    const tiffCount = await tifftoPngs(src,dest)
    if(tiffCount.countMatch){
        await createPdfAndDeleteGeneratedFiles(src,dest);
    }
    else{
            const err =`${src} \n ${dest} \n tiff(${tiffCount.tiffsCount})/png count${tiffCount.pngCount} mismatch. 
        will not proceed`;
        GENERATION_REPORT.push(err)
        console.log(err);
    }
}
(async () => {
    const src = "D:\\NMM\\August-2019\\01-08-2019"
    const dest = "E:\\ramtek"
    const subfolders = getDirectories(src);
    console.log(subfolders)
    for(let subfolder of subfolders){
        const forderForPdfizeing = `${src}\\${subfolder}`;
        console.log(`process Folder ${forderForPdfizeing}`)
        await tifToPdf(forderForPdfizeing,dest)
    }
    console.log(GENERATION_REPORT);
    //await mergepPdfs("E:\\ramtek\\M-10-Surya Kavach - Kavikulguru Kalidas Sanskrit University Ramtek Collection.pdf")
})();

