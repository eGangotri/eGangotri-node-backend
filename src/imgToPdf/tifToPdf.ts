import { deleteAllPngs } from './utils/ImgUtils';
import { createPdfAndDeleteGeneratedFiles } from './utils/PdfUtils';
import { createPngs } from './utils/PngUtils';
import * as fs from 'fs';
import { getDirectories } from './utils/Utils';


export let GENERATION_REPORT = [];

async function tifToPdf(src:string,dest:string){
    if (!fs.existsSync(dest)){
        fs.mkdirSync(dest);
    }
    await createPngs(src,dest)
    console.log(`createPngs ends`)
    await createPdfAndDeleteGeneratedFiles(src,dest);
    console.log(GENERATION_REPORT);
}
(async () => {
    const src = "D:\\NMM\\August-2019\\01-08-2019"
    const dest = "E:\\manus"
    const subfolders = getDirectories(src);
    console.log(subfolders)
    for(let subfolder of subfolders){
        const forderForPdfizeing = `${src}\\${subfolder}`;
        console.log(`process Folder ${forderForPdfizeing}`)
        await tifToPdf(forderForPdfizeing,dest)
    }
})();

