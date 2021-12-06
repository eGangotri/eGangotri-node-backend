import { deleteAllPngs } from './utils/ImgUtils';
import { createPdfAndDeleteGeneratedFiles } from './utils/PdfUtils';
import { createPngs } from './utils/PngUtils';
import * as fs from 'fs';




(async () => {
    const src = "C:\\tmp\\1"
    const dest = "E:\\1"
    if (!fs.existsSync(dest)){
        fs.mkdirSync(dest);
    }
    //await deleteAllPngs(dest);
    await createPngs(src,dest)
    console.log(`createPngs ends`)
    await createPdfAndDeleteGeneratedFiles(dest);
})()

