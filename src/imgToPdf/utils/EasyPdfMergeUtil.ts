import { checkFolderExistsSync } from "utils/FileUtils";
import { formatTime } from "./Utils";
import * as fs from 'fs';

const merge = require('easy-pdf-merge');

const opts = {
    maxBuffer: 1024 * 1024 * 1024, // 100mb
    maxHeap: '5g' // for setting JVM heap limits to 2GB
};

export function mergeUsingEasyPdf(pdfs: Array<any>, mergerPdf: string) {
    if (checkFolderExistsSync(mergerPdf)) {
        fs.writeFileSync(mergerPdf, "");
    }
    const flattened = pdfs.flat(1);
    const START_TIME = Number(Date.now())
    if (flattened.length === 1) {
        console.log(`Single PDF merely copy ${flattened}`)
        fs.copyFileSync(flattened[0], mergerPdf);
    }
    else {
        console.log(`Merging ${flattened.length} pdfs from  ${pdfs.length} Folders`);
      //  console.log(` flattened ${flattened} `);
        try {
            merge(pdfs, mergerPdf, opts, function (err: any) {
                if (err) {
                    return console.log("merge: " + err)
                }
                console.log('Successfully merged!', mergerPdf);
            });
        }
        catch (e) {
            console.log("-->", e);
        }
    }
    const EMD_TIME = Number(Date.now())
    console.log(`\nTotal Time Taken for pdfmerge ${formatTime(EMD_TIME - START_TIME)}`);
    console.log(`Created pdf from ${flattened.length} pdf Files: \n\t${mergerPdf}`)

}