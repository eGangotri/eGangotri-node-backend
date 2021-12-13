import {
    formatTime,
    getDirectoriesWithFullPath, getUploadableFolders
} from './utils/Utils';
import * as fs from 'fs';
import { tifToPdf } from './TifToPdf';
import * as path from 'path';
import { addReport, printReport } from '.';


async function execDynamic() {
    const index = 3;
    const FOLDERS = await getUploadableFolders("D:\\NMM\\August-2019", "E:\\");
    console.log(FOLDERS)
    console.log(`This Run will convert tifs in Folder # ${index + 1} 
    ${FOLDERS[index].src} to 
    ${FOLDERS[index].dest}`);

    const src = FOLDERS[index].src
    const dest = FOLDERS[index].dest;
    const tifFoldersForTransformation = await getDirectoriesWithFullPath(src);
    console.log(`${tifFoldersForTransformation}`)
    await exec(tifFoldersForTransformation, dest)
}

async function exec(tifFoldersForTransformation: Array<string>, pdfDest: string) {
    if (!fs.existsSync(pdfDest)) {
        fs.mkdirSync(pdfDest);
    }
    const tifFoldersForTransformationCount = tifFoldersForTransformation.length;
    const START_TIME = Number(Date.now())
    addReport(`TifToPDF started for ${tifFoldersForTransformationCount} folder(s) at ${new Date(START_TIME)}
    \t${tifFoldersForTransformation.map((elem, index) => `(${index+1}). ${elem}`).join("\n\t")}`)

    for (let mainFolder of tifFoldersForTransformation) {
        try {
            const START_TIME = Number(Date.now())
            await tifToPdf(mainFolder, pdfDest);
            const END_TIME = Number(Date.now())
            console.log(`tifToPdf for ${path.parse(mainFolder).name} -> ${path.parse(pdfDest).name} ended at ${new Date(END_TIME)}.
            \nTotal Time Taken for converting
            ${path.parse(mainFolder).name} -> ${path.parse(pdfDest).name}
            ${formatTime(END_TIME - START_TIME)}`);
        }
        catch(e){
            console.log(`tifToPdf Error for ${mainFolder} -> ${pdfDest}` , e)
        }
    }
    const END_TIME = Number(Date.now())
    addReport(`TifToPDF for ${tifFoldersForTransformation.length} Folder(s) ended at ${new Date(END_TIME)}.\nTotal Time Taken ${formatTime(END_TIME - START_TIME)}`);
    printReport();
}


async function execFixed() {
    const tifFoldersForTransformation = 
    ['D:\\NMM\\August-2019\\05-08-2019\\M-88-Maurya Goswami Charitra_Kumar Sambhav 1st Sarga - Kavikulguru Kalidas Sanskrit University Ramtek Collection','D:\\NMM\\August-2019\\05-08-2019\\M-87-Maurya Goswami Charitra_Kumar Sambhav 1st Sarga - Kavikulguru Kalidas Sanskrit University Ramtek Collection','D:\\NMM\\August-2019\\05-08-2019\\M-82-Rukminii Svayamvar_Durga Kalpa Taru_Goda Nirnay Chandrika - Kavikulguru Kalidas Sanskrit University Ramtek Collection','D:\\NMM\\August-2019\\05-08-2019\\M-81-Rukminii Svayamvar_Durga Kalpa Taru_Goda Nirnay Chandrika - Kavikulguru Kalidas Sanskrit University Ramtek Collection','D:\\NMM\\August-2019\\05-08-2019\\M-80-Rukminii Svayamvar_Durga Kalpa Taru_Goda Nirnay Chandrika - Kavikulguru Kalidas Sanskrit University Ramtek Collection','D:\\NMM\\August-2019\\05-08-2019\\M-79-Hiranya Koshiya Nitya Vidhi - Kavikulguru Kalidas Sanskrit University Ramtek Collection','D:\\NMM\\August-2019\\05-08-2019\\M-78-Abhyas Chintan_Daksha Prajapati SMriti_Pratyangira Puja - Kavikulguru Kalidas Sanskrit University Ramtek Collection','D:\\NMM\\August-2019\\05-08-2019\\M-77-Abhyas Chintan_Daksha Prajapati SMriti_Pratyangira Puja - Kavikulguru Kalidas Sanskrit University Ramtek Collection','D:\\NMM\\August-2019\\05-08-2019\\M-76-Abhyas Chintan_Daksha Prajapati SMriti_Pratyangir Puja - Kavikulguru Kalidas Sanskrit University Ramtek Collection','D:\\NMM\\August-2019\\05-08-2019\\M-75-Amrit Arnav_Yam Niyam Yog Vishayak - Kavikulguru Kalidas Sanskrit University Ramtek Collection','D:\\NMM\\August-2019\\05-08-2019\\M-74-Amrit Arnav_Yam Niyam Yog Vishayak - Kavikulguru Kalidas Sanskrit University Ramtek Collection','D:\\NMM\\August-2019\\05-08-2019\\M-73-Bhakti Kavya Sangrah - Kavikulguru Kalidas Sanskrit University Ramtek Collection','D:\\NMM\\August-2019\\05-08-2019\\M-151-Gita Gauripati - Kavikulguru Kalidas Sanskrit University Ramtek Collection','D:\\NMM\\August-2019\\05-08-2019\\M-150-Mantra Kosh - Kavikulguru Kalidas Sanskrit University Ramtek Collection','D:\\NMM\\August-2019\\05-08-2019\\M-149-Shri Sukta - Kavikulguru Kalidas Sanskrit University Ramtek Collection','D:\\NMM\\August-2019\\05-08-2019\\M-148-Vancha Kalpa Lata - Kavikulguru Kalidas Sanskrit University Ramtek Collection','D:\\NMM\\August-2019\\05-08-2019\\M-147-Shiv Pamarjan Stotra - Kavikulguru Kalidas Sanskrit University Ramtek Collection','D:\\NMM\\August-2019\\05-08-2019\\M-146-Shyama Rahasya - Kavikulguru Kalidas Sanskrit University Ramtek Collection','D:\\NMM\\August-2019\\05-08-2019\\M-145-Bhagavat Gita - Kavikulguru Kalidas Sanskrit University Ramtek Collection','D:\\NMM\\August-2019\\05-08-2019\\M-143-Shad Devata Puja - Kavikulguru Kalidas Sanskrit University Ramtek Collection','D:\\NMM\\August-2019\\05-08-2019\\M-142-Mudra Lakshan - Kavikulguru Kalidas Sanskrit University Ramtek Collection','D:\\NMM\\August-2019\\05-08-2019\\M-141-Parthiv Ling Puja - Kavikulguru Kalidas Sanskrit University Ramtek Collection','D:\\NMM\\August-2019\\05-08-2019\\M-140-Gayatri Jap Vidhi - Kavikulguru Kalidas Sanskrit University Ramtek Collection']
                    
    const destPdf = "E:\\ramtek4Y";
    await exec(tifFoldersForTransformation, destPdf);

}
//execDynamic();
execFixed();


