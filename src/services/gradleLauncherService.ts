import { exec, spawn } from 'child_process';
import { WORKING_DIR } from '../common';
import { ArchiveProfileAndTitle } from '../mirror/types';
import path from 'path';
import { stripQuotes } from '../excelToMongo/Util';


/*
gradle uploadToArchiveSelective --args="your_arg1 your_arg2"
*/
const generateGradleCommandForCSV = (args: string, gradleCommand: string) => {
    return generateGradleCommandForChar(args, gradleCommand, ",")
}

const generateGradleCommandForHashSeparated = (args: string, gradleCommand: string) => {
    return generateGradleCommandForChar(args, gradleCommand, "#")
}

const gradleCommandFormat = (args: string, gradleCommand: string ) => {
    const cmd = `gradle ${gradleCommand} --args='${args}'`
    console.log(`cmd ${cmd}`);
    return cmd
}
const generateGradleCommandForChar = (args: string, gradleCommand: string, char: string) => {
    const _query = args.split(char).map((x: string) => x.trim()).join(" ")
    console.log(`args ${args}`);
    const _cmd = gradleCommandFormat(_query, gradleCommand)
    //`gradle ${gradleCommand} --args="${_query}"`
    console.log(`_cmd ${_cmd}`);
    return _cmd
}

const generateGradleCommand = (spaceSepString: string, gradleCommand: string) => {
    const _cmd = `gradle ${gradleCommand} --args="${spaceSepString}"`
    console.log(`_cmd ${_cmd}`);
    return _cmd
}

export function launchUploader(args: any): Promise<string> {
    return makeGradleCall(generateGradleCommandForCSV(args, "uploadToArchive"))
}

export function launchUploaderViaExcel(profile:string, excelPath:string, uploadCycleId:string): Promise<string> {
  const gradleArgsAsJSON = `{'profile': '${profile}','excelPath':'${path.basename(excelPath)}','uploadCycleId': '${uploadCycleId}'}`
  return makeGradleCall(
        `gradle uploadToArchiveExcel -PjsonArgs="${gradleArgsAsJSON}"`) 
}

export function launchUploaderViaJson(args: any): Promise<string> {
    return makeGradleCall(generateGradleCommandForCSV(args, "uploadToArchiveJson"))
}

export function launchUploaderViaAbsPath(args: any): Promise<string> {
    return makeGradleCall(generateGradleCommandForHashSeparated(args, "uploadToArchiveSelective"))
}

export function reuploadMissed(itemsForReupload: ArchiveProfileAndTitle[]): Promise<string> {
    console.log(`reuploadMissed ${JSON.stringify(itemsForReupload)}`);
    const dataAsCSV = itemsForReupload.map((x: ArchiveProfileAndTitle) => x.archiveProfile + ", '" + x.title.trim() + "'").join(" ")
    return makeGradleCall(generateGradleCommand(dataAsCSV, "uploadToArchiveSelective"))
}

export function reuploadByUploadCycleId(args: any): Promise<string> {
    return makeGradleCall(generateGradleCommandForCSV(args, "uploadByUploadCycleId"))
}

//localhost/launchGradle/moveToFreeze?profiles="TEST,TMP"
export function moveToFreeze(args: any): Promise<string> {
    //gradle fileMover --args=JNGM_BEN JNGM_TAMIL JNGM_TEL JNGM BVT
    return makeGradleCall(generateGradleCommandForCSV(args, "fileMover"))
}

export function bookTitlesLaunchService(args: any): Promise<string> {
    //gradle fileMover --args=JNGM_BEN JNGM_TAMIL JNGM_TEL JNGM BVT
    return makeGradleCall(generateGradleCommandForCSV(args, "bookTitles"))
}

export function loginToArchive(args: any): Promise<string> {
    //gradle loginToArchive --args=JNGM_BEN JNGM_TAMIL JNGM_TEL JNGM BVT
    return makeGradleCall(generateGradleCommandForCSV(args, "loginToArchive"))
}

export async function snap2htmlCmdCall(rootFolderPath: string, snap2htmlFileName: string = ""): Promise<{}> {
    if (snap2htmlFileName === "" || !snap2htmlFileName?.endsWith(".html")) {
        snap2htmlFileName = `${path.basename(rootFolderPath)}.html`
    }

    console.log(`snap2htmlCmdCall ${snap2htmlFileName}`);
    const outputPath = path.join(rootFolderPath, snap2htmlFileName);
    const _cmd = `Snap2HTML.exe -path:"${stripQuotes(rootFolderPath)}" -outfile:"${stripQuotes(outputPath)}"`
    const _gradleResp = await makeGradleCall(_cmd);
    return {
        _gradleResp,
        msg: `snap2html for ${rootFolderPath} if successful will be in ${rootFolderPath}/${snap2htmlFileName}`,
    }
}

const COMMAND_PROMO_MAX_BUFFER_SIZE = 1024 * 1024 * 1024 ; 
export function makeGradleCall(_cmd: string): Promise<string> {
    console.log(`makeGradleCall ${_cmd}`);
    return new Promise((resolve, reject) => {
        exec(_cmd, {
            maxBuffer: COMMAND_PROMO_MAX_BUFFER_SIZE,
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


