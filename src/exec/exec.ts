import { exec } from 'child_process';
import { ReuploadType } from '../services/types';
import * as _ from 'lodash';

//const command = "gradle uploadToArchive";  
const command = 'gradle loginToArchive --args="SPS VT  PANINI"';

const PROJECT_DIR = "C:\\ws\\eGangotri";

exec(`cd ${PROJECT_DIR} && ${command}`, (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }
    console.log(`stdout: ${stdout}`);
});

export const gradleLaunchArchiveUpload = (itemsForReupload: ReuploadType[]) => {

    for (const itemForReupload of itemsForReupload) {

    }
    return true
}