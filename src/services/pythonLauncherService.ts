import { exec } from 'child_process';
import { timeInfo } from '../mirror/FrontEndBackendCommonCode';
import { ellipsis } from '../mirror/utils';

const PYTHON_HOME = "C://ws//egangotri-python";
export const makePythonCall = async (_srcFolder: string,
    destFolder: string = "",
    firstNPages: number,
    lastNPages: number): Promise<any> => {
    // Construct the command to run the Python script
    const pythonScriptPath = `${PYTHON_HOME}//extractPdf//firstAndLastNPages.py`;
    const command = `python ${pythonScriptPath} "${_srcFolder}" --output_folder "${destFolder}" --firstN ${firstNPages} --lastN ${lastNPages}`;
    const timeNow = Date.now();
    console.log(`makePythonCall command: ${command} started at ${new Date(timeNow)}`);
    return new Promise((resolve, reject) => {
        // Execute the Python script
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing Python script: ${error.message}`);
                return reject({
                    success: false,
                    timeTaken: timeInfo(Date.now() - timeNow),
                    output: `Error executing Python script: ${error.message}`
                });
            }

            console.log(`Python script output: ${stdout}`);
            resolve({
                success: true,
                timeTaken: timeInfo(Date.now() - timeNow),
                output: ellipsis(stdout,100)
            });
        });
    });
};