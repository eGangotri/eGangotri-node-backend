import * as fs from 'fs';
import * as  Jimp from "jimp"

export function tiffToPng(tiffs: Array<string>, dest: string) {
    tiffs.forEach((tiff) => {
        const fileName = `${tiff}.png`
        Jimp.read(tiff, function (err, file) {
            if (err) {
                console.log(`tiffToPng err ${fileName} ${err}`)
            } else {
                console.log(`fileName ${fileName}`);
                file.write(fileName)
            }
        })
    });
    return getAllPngs(dest)
}

export const getAllTifs = (directoryPath: string) => {
    return getAllFilesOfGivenType(directoryPath, [".tif", ".tiff"]);
}

export const getAllPngs = (directoryPath: string) => {
    return getAllFilesOfGivenType(directoryPath, [".png"]);
}

export const deleteAllPngs = (directoryPath: string) => {
    return deleteFiles(getAllPngs(directoryPath));
}

const deleteFiles = (files: Array<string>) => {
    files.forEach(file => {
        try {
            fs.unlinkSync(file)
        } catch (err) {
            console.error(err)
        }
    });
}

export const getAllFilesOfGivenType = (directoryPath: string, _types: Array<string> = []) => {
    let files = []
    fs.readdirSync(directoryPath).forEach(file => {
        _types.forEach((_type) => {
            if (file.toLowerCase().endsWith(_type)) {
                // console.log(directoryPath + "\\" + file);
                files.push(directoryPath + "\\" + file);
            }
        })
    });
    return files;
}

