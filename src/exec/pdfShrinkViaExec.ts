import { exec } from "child_process";
import { getAllPdfs } from "../imgToPdf/utils/Utils";
import { BATCH_FILE_PATH, createBatchFileIfNotExists } from "./GhostScriptUtil";

async function pdfShrinker() {
 createBatchFileIfNotExists();

    const pdfs =
        await getAllPdfs("E:\\tifReductionResult\\finalPdfs");
    console.log(`processing pdfs  ${pdfs}`)
    for (let pdf of pdfs) {
        const command = `${BATCH_FILE_PATH} ${pdf}`;
        console.log(`command  ${command}`)

        exec(`${command}`, (error, stdout, stderr) => {
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
    }
}

pdfShrinker()