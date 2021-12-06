import * as fs from 'fs';

export const getAllTifs = async (directoryPath: string) => {
    return await getAllFilesOfGivenType(directoryPath, [".tif", ".tiff"]);
}

export const getAllPngs = async (directoryPath: string) => {
    return await getAllFilesOfGivenType(directoryPath, [".png"]);
}

export const deleteAllPngs = async (directoryPath: string) => {
    return await deleteFiles(await getAllPngs(directoryPath));
}

export async function deleteFiles(files: Array<string>) {
    for (let file of files) {
        try {
            fs.unlinkSync(file);
            console.log(`deleted ${file}`);
        } catch (err) {
            console.error(err)
        }
    };
}

const getAllFilesOfGivenType = async (directoryPath: string, _types: Array<string> = []) => {
    let files = []
    const contentList = fs.readdirSync(directoryPath)
    for (let content of contentList) {
        if (content.toLowerCase().endsWith(_types[0]) || (_types.length > 1 && content.toLowerCase().endsWith(_types[1]))) {
            //console.log("getAllFilesOfGivenType: " + directoryPath + "\\" + content);
            files.push(directoryPath + "\\" + content);
        }
    }
    return files;
}

