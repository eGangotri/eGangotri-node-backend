import { exec } from 'child_process';
import { timeInfo } from '../mirror/FrontEndBackendCommonCode';
import { ellipsis } from '../mirror/utils';
import { promisify } from 'util';

const PYTHON_HOME = "C://ws//egangotri-python";
export const makePythonCallOld = async (_srcFolder: string,
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


const execAsync = promisify(exec); // Promisify the exec function for async/await usage

export const makePythonCall = async (
    _srcFolder: string,
    destFolder: string = "",
    firstNPages: number,
    lastNPages: number
): Promise<{ success: boolean; timeTaken: string; output: string }> => {
    // Construct the command to run the Python script
    const pythonScriptPath = `${PYTHON_HOME}//extractPdf//firstAndLastNPages.py`;
    const command = `python ${pythonScriptPath} "${_srcFolder}" --output_folder "${destFolder}" --firstN ${firstNPages} --lastN ${lastNPages}`;
    const timeNow = Date.now();
    console.log(`makePythonCall command: ${command} started at ${new Date(timeNow)}`);

    try {
        // Execute the Python script asynchronously
        const { stdout, stderr } = await execAsync(command);

        if (stderr) {
            console.error(`Python script stderr: ${stderr}`);
            throw new Error(stderr);
        }

        console.log(`Python script output: ${stdout}`);
        return {
            success: true,
            timeTaken: timeInfo(Date.now() - timeNow),
            output: ellipsis(stdout, 100).toString(),
        };
    } catch (error) {
        console.error(`Error executing Python script: ${error.message}`);
        return {
            success: false,
            timeTaken: timeInfo(Date.now() - timeNow),
            output: `Error executing Python script: ${error.message}`,
        };
    }
};