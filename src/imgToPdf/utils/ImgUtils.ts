import * as fs from 'fs';
import { PNG_EXT, TIFF_EXT } from './constants';
import { deleteFiles, getAllFilesOfGivenType } from './Utils';

export const getAllTifs = async (dir: string) => {
    return await getAllFilesOfGivenType(dir,TIFF_EXT);
}
export const getAllPngs = async (dir: string) => {
    return await getAllFilesOfGivenType(dir, [PNG_EXT]);
}

export const deleteAllPngs = async (dir: string) => {
    return await deleteFiles(await getAllPngs(dir));
}

