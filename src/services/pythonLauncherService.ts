import { exec } from 'child_process';

const PYTHON_HOME = "C://ws//egangotri-python";


export const makePythonCall = async (_srcFolder: string,
     firstNPages: number, 
     lastNPages: number): Promise<any> => {
    // Construct the command to run the Python script
    const pythonScriptPath = `${PYTHON_HOME}//extractPdf//firstAndLastNPages.py`;
    const command = `python ${pythonScriptPath} ${_srcFolder} --firstN ${firstNPages} --lastN ${lastNPages}`;
    const timeNow = Date.now();

    return new Promise((resolve, reject) => {
        // Execute the Python script
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing Python script: ${error.message}`);
                return reject({
                    status: "failed",
                    success: false,
                    msg: `Error executing Python script: ${error.message}`
                });
            }

            console.log(`Python script output: ${stdout}`);
            resolve({
                status: "success",
                success: true,
                output: stdout,
                timeTaken: Date.now() - timeNow
            });
        });
    });
};