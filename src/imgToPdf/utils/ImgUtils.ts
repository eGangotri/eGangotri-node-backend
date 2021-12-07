import * as fs from 'fs';

export const getAllTifs = async (dir: string) => {
    return await getAllFilesOfGivenType(dir, [".tif", ".tiff"]);
}

export const getAllPngs = async (dir: string) => {
    return await getAllFilesOfGivenType(dir, [".png"]);
}

export const deleteAllPngs = async (dir: string) => {
    return await deleteFiles(await getAllPngs(dir));
}

export async function deleteFiles(files: Array<string>) {
    for (let file of files) {
        try {
            fs.unlinkSync(file);
        } catch (err) {
            console.error(err)
        }
    };
}

const getAllFilesOfGivenType = async (dir: string, _types: Array<string> = []) => {
    let files = []
    const contentList = fs.readdirSync(dir)
    for (let content of contentList) {
        if (content.toLowerCase().endsWith(_types[0]) || (_types.length > 1 && content.toLowerCase().endsWith(_types[1]))) {
            files.push(dir + "\\" + content);
        }
    }
    console.log(`Found ${files.length} ${_types[0]}(s) of ${contentList.length}  items in \n\t${dir}`)

    return files;
}

