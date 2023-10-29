import { exec, spawn } from 'child_process';
import { WORKING_DIR } from '../common';


const generateGradleCommand = (args: string, gradleCommand: string) => {
    const _query = args.split(",").map((x: string) => x.trim()).join(" ")
    console.log(`args ${args}`);
    const _cmd = `gradle ${gradleCommand} --args="${_query}"`
    console.log(`_cmd ${_cmd}`);
    return _cmd
}
export function launchUploader(args: any): Promise<string> {
    return makeGradleCall(generateGradleCommand(args, "uploadToArchive"))
}

export function reuploadMissed(args: any): Promise<string> {
    return makeGradleCall(generateGradleCommand(args, "reuploadMissed"))
}


//localhost/launchGradle/moveToFreeze?profiles="TEST,TMP"
export function moveToFreeze(args: any): Promise<string> {
    //gradle fileMover --args=JNGM_BEN JNGM_TAMIL JNGM_TEL JNGM BVT
    return makeGradleCall(generateGradleCommand(args, "fileMover"))
}
export function loginToArchive(args: any): Promise<string> {
    //gradle loginToArchive --args=JNGM_BEN JNGM_TAMIL JNGM_TEL JNGM BVT
    return makeGradleCall(generateGradleCommand(args, "loginToArchive"))
}

function makeGradleCall(_cmd: string): Promise<string> {
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