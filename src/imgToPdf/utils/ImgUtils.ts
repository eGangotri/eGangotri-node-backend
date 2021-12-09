import * as fs from 'fs';
import { deleteFiles, getAllFilesOfGivenType } from './Utils';

export const getAllTifs = async (dir: string) => {
    return await getAllFilesOfGivenType(dir, [".tif", ".tif"]);
}

export const getAllPngs = async (dir: string) => {
    return await getAllFilesOfGivenType(dir, [".png"]);
}

export const deleteAllPngs = async (dir: string) => {
    return await deleteFiles(await getAllPngs(dir));
}

