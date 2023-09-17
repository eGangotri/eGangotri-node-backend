import { exec, spawn } from 'child_process';
import { WORKING_DIR } from '../common';


export function launchUploader(args: any) {
    console.log(`args ${args}`);
    if (!args) {
        args = "C:\\Users\\Chetan Pandey\\Downloads\\forPrint"
    }

    //    exec(`gradlew loginToArchive --args==` + args, {
    exec(`gradle bookTitles --args=${args}`, {
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

//localhost/launchGradle/moveToFreeze?profiles="TEST,TMP"
export function moveToFreeze(args: any):Promise<string> {
    console.log(`args ${args}`);

    //gradle fileMover --args=JNGM_BEN JNGM_TAMIL JNGM_TEL JNGM BVT
    const _cmd = `gradle fileMover --args=${args.split(",").join(" ")}`
    return new Promise((resolve, reject) => {
        exec(_cmd, {
            cwd: `${WORKING_DIR}`
        }, (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`);
                reject(error);
                return;
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
                reject(new Error(stderr));
                return;
            }
            console.log(`stdout: ${stdout}`);
            resolve(stdout);
        })
    });

}