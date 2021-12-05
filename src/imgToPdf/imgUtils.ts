; import * as fs from 'fs';
import * as  Jimp from "jimp"

export async function tiffToPng(tiffs: Array<string>, dest: string) {
    console.log(`tiffs ${tiffs}`)
    const promises = tiffs.map((tiff) => {
        Jimp.read(tiff).then(_ => {
            const fileName = `${tiff}.png`
            console.log(`tiffToPng: fileName ${fileName}`);
            _.write(fileName)
        })
        .catch(console.error);
    });

    return Promise.all(promises)
    .then(async () => await getAllPngs(dest));
}

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

export const getAllFilesOfGivenType = async (directoryPath: string, _types: Array<string> = []) => {
    let files = []
    const contentList = fs.readdirSync(directoryPath)
    for (let content of contentList) {
        if (content.toLowerCase().endsWith(_types[0]) || (_types.length > 1 && content.toLowerCase().endsWith(_types[1]))) {
            console.log("getAllFilesOfGivenType: " + directoryPath + "\\" + content);
            files.push(directoryPath + "\\" + content);
        }
    }
    return files;
}

