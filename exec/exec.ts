import {exec} from 'child_process';

const command = "gradle uploadToArchive";  
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
