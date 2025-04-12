import { exec } from 'child_process';
import { promisify } from 'util';
import { ReuploadType } from '../types/listingTypes';
import * as _ from 'lodash';

export const execPromise = promisify(exec);

//const command = "gradle uploadToArchive";  
const command = "" //'gradle loginToArchive --args="SPS VT  PANINI"';

const PROJECT_DIR = "C:\\ws\\eGangotri";

// exec(`cd ${PROJECT_DIR} && ${command}`, (error, stdout, stderr) => {
//     if (error) {
//         console.log(`error: ${error.message}`);
//         return;
//     }
//     if (stderr) {
//         console.log(`stderr: ${stderr}`);
//         return;
//     }
//     console.log(`stdout: ${stdout}`);
// });

export const gradleLaunchArchiveUpload = (itemsForReupload: ReuploadType[]) => {

    for (const itemForReupload of itemsForReupload) {

    }
    return true
}