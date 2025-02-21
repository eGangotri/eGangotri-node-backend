import { promisify } from 'util';
import { exec, spawn } from 'child_process';
import { WORKING_DIR } from '../common';
import { ArchiveProfileAndTitle } from '../mirror/types';
import path from 'path';
import { stripQuotes } from '../excelToMongo/Util';


/*
gradle uploadToArchiveSelective --args="your_arg1 your_arg2"
*/



const gradleCommandFormat = (args: string, gradleCommand: string) => {
    const cmd = `gradle ${gradleCommand} --args="${args}"`
    console.log(`gradleCommandFormat:cmd ${cmd}`);
    return cmd
}


const generateGradleCommand = (spaceSepString: string, gradleCommand: string) => {
    const _cmd = `gradle ${gradleCommand} --args="${spaceSepString}"`
    console.log(`_cmd ${_cmd}`);
    return _cmd
}

const generateGradleCommandForCSV = (args: string, gradleCommand: string) => {
    return generateGradleCommandForChar(args, gradleCommand, ",")
}

const generateGradleCommandForHashSeparated = (args: string, gradleCommand: string) => {
    return generateGradleCommandForChar(args, gradleCommand, "#")
}

const generateGradleCommandForChar = (args: string, gradleCommand: string, char: string) => {
    const _query = args.split(char).map((x: string) => x.trim()).filter(y => y.length > 0).map(z => `'${z}'`).join(" ")
    console.log(`args ${args}`);
    const _cmd = gradleCommandFormat(_query, gradleCommand)
    console.log(`_cmd ${_cmd}`);
    return _cmd
}

export function launchUploader(args: any, optionalParams: string = ""): Promise<string> {
    console.log(`launchUploader ${args} ${optionalParams}`);
    //export function launchUploader(args: any, optionalParams:object = { [key: string]: any} = {}): Promise<string> {
    let _cmd =generateGradleCommandForCSV(`${args}`, "uploadToArchive");
   // _cmd + = ", ${optionalParams.replace(/,/g, "")""
   if(optionalParams?.trim() != ""){
    optionalParams = ", '" + optionalParams + "'"
    _cmd = _cmd.replace(/"$/, optionalParams + "\"")
   }
   console.log(`_cmd with optionalParams: ${_cmd}`);

    return  makeGradleCall(_cmd)
}

export function launchUploaderViaExcelV1(profile: string, excelPath: string, uploadCycleId: string): Promise<string> {
    const gradleArgsAsJSON = `{'profile': '${profile}','excelPath':'${path.basename(excelPath)}','uploadCycleId': '${uploadCycleId}'}`
    return makeGradleCall(
        `gradle uploadToArchiveViaExcelV1WithFourCols -PjsonArgs="${gradleArgsAsJSON}"`)
}

export function launchUploaderViaExcelV3(profile: string, excelPath: string, uploadCycleId: string, range: string = ""): Promise<string> {
    const gradleCmd = `gradle uploadToArchiveViaExcelV3WithOneCol --args="${profile} '${excelPath}' '${uploadCycleId}' '${range}'"`;
    return makeGradleCall(gradleCmd)
}

export function launchUploaderViaExcelV3Multi(profiles: string, excelPaths: string, uploadCycleId: string, range: string = ""): Promise<string> {
    const gradleCmd = `gradle uploadToArchiveViaExcelV3WithOneColMulti --args="${profiles} '${excelPaths}' '${uploadCycleId}' '${range}'"`;
    return makeGradleCall(gradleCmd)
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

const COMMAND_PROMO_MAX_BUFFER_SIZE = 1024 * 1024 * 1024;
export function makeGradleCallOld(_cmd: string): Promise<string> {
    console.log(`makeGradleCall ${_cmd} `);

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


const execAsync = promisify(exec); // Promisify the exec function for async/await usage

export async function makeGradleCall(_cmd: string): Promise<string> {
    console.log(`makeGradleCall ${_cmd}`);
    try {
        const { stdout, stderr } = await execAsync(_cmd, {
            maxBuffer: COMMAND_PROMO_MAX_BUFFER_SIZE,
            cwd: `${WORKING_DIR}`,
        });

        if (stderr) {
            console.error(`stderr: ${stderr}`);
            throw new Error(stderr); // Treat stderr as an error
        }

        console.log(`stdout: ${stdout}`);
        return stdout; // Resolve with the stdout
    } catch (error) {
        console.error(`Error executing Gradle command: ${error.message}`);
        throw error; // Re-throw the error for the caller to handle
    }
}
