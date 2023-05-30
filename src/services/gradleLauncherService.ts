import { exec, spawn } from 'child_process';
import { WORKING_DIR } from '../common';


export function launchUploader(args:any) {
    console.log(`args ${args}`);
    if(!args){
        args = "C:\\Users\\Chetan Pandey\\Downloads\\forPrint"
    }

 //    exec(`gradlew loginToArchive --args==` + args, {
      exec(`gradlew bookTitles --args==${args}`, {
        cwd: `${WORKING_DIR}`
    }, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    })
}