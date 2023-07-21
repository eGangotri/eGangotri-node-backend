import * as fs from 'fs';
const path = require("path")

export function removeFolderWithContents(folder: string) {
    fs.rm(folder, { recursive: true, force: true }, (err) => {
        if (err) {
            console.error(err.message);
            return;
        }
    })
}

export const removeExcept = async (folder: any, except: Array<string>) => {
    const contentList = await fs.promises.readdir(folder)
    const files = contentList.map((x) => folder + "\\" + x).filter((y) => {
        console.log(`Found ${y}`)
        return !except.includes(y)
    }).map(e => fs.unlink(e, (err) => {
        if (err) throw err;
        console.log(`${e} was deleted`);
    }))

}


export function getAllPDFFiles(directoryPath: string): string[] {
    let pdfFiles: string[] = [];

    // Read all items in the directory
    const items = fs.readdirSync(directoryPath);

    for (const item of items) {
        const itemPath = path.join(directoryPath, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
            // Recursively call the function for subdirectories
            pdfFiles = pdfFiles.concat(getAllPDFFiles(itemPath));
        } else if (path.extname(itemPath).toLowerCase() === '.pdf') {
            // Add PDF files to the array
            pdfFiles.push(itemPath);
        }
    }
    return pdfFiles;
}

export function createFolderIfNotExists(folderPath: string): void {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`Folder created: ${folderPath}`);
    } else {
     // console.log(`Folder already exists: ${folderPath}`);
    }
  }



