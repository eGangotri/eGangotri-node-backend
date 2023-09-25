import { exec, spawn } from 'child_process';
import { WORKING_DIR } from '../common';


export function launchUploader(args: any): Promise<string> {
    console.log(`args ${args}`);
    const _cmd = `gradle uploadToArchive --args=${args.split(",").map((x: string)=>x.trim()).join(" ")}`
    return makeGradleCall(_cmd)
}

//localhost/launchGradle/moveToFreeze?profiles="TEST,TMP"
export function moveToFreeze(args: any): Promise<string> {
    console.log(`args ${args}`);
    //gradle fileMover --args=JNGM_BEN JNGM_TAMIL JNGM_TEL JNGM BVT
    const _cmd = `gradle fileMover --args=${args.split(",").join(" ")}`
    return makeGradleCall(_cmd)
}

function makeGradleCall( _cmd: string): Promise<string> {
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