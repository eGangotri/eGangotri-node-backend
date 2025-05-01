import * as v8 from 'v8';
import * as path from 'path';
import { PDF_EXT, PNG_EXT } from './constants';
import * as fsPromise from 'fs/promises';

export const getDirectories = async (source: string) => {
     const subDirs = await fsPromise.readdir(source, { withFileTypes: true })
     return subDirs.filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name)
}

export const getDirectoriesWithFullPath = async (source: string) => {
     const subDirs = await fsPromise.readdir(source, { withFileTypes: true })
     return subDirs.filter(dirent => dirent.isDirectory())
          .map(dirent => `${source}\\${dirent.name}`)
}

export function formatTime(timeLapseinMS: number) {
     const timeLapseInSecs = timeLapseinMS / 1000
     const timeLapseInMins = timeLapseInSecs/60
     const timeLapseInHrs = timeLapseInMins/60
     let timeLapse = `${timeLapseInSecs.toFixed(2)} sec(s)`
     if (timeLapseInHrs > 1) {
          timeLapse = `${(timeLapseInMins/60).toFixed(2)} hour(s)`
     }
     else if (timeLapseInMins > 1) {
          timeLapse = `${timeLapseInMins.toFixed(2)} min(s)`
     }
     return timeLapse
}

export async function folderCountEqualsPDFCount(srcFolderCount: number, dest: string) {
     const pdfCount = (await getAllPdfs(dest)).length
     const folderCountCheck = srcFolderCount === pdfCount
     if (folderCountCheck) {
          return `Exactly ${srcFolderCount} pdfs were created from same number of Folders.`
     }
     else {
          return `****Error. Folder Count ${srcFolderCount} and no. of pdfs ${pdfCount} generated is different by (${srcFolderCount - pdfCount}).`
     }
}

export async function deleteFiles(files: Array<string>) {
     for (let file of files) {
         try {
             await fsPromise.unlink(file);
         } catch (err) {
             console.error(err);
         }
     }
 }

export const getAllPdfs = async (dir: string): Promise<Array<string>> => {
     return await getAllFilesOfGivenType(dir, [PDF_EXT]);
}

export const getAllFilessInFoldersOfGivenType = async (dirs: Array<string>, _types:string): Promise<Array<string>> => {
     let files = [];
     for(let dir of dirs){
          const _file = await getAllFilesOfGivenType(dir, [_types])
          files.push(_file);
     }
     return files.flat(1);
}

export const getAllPdfsInFolders = async (dirs: Array<string>): Promise<Array<string>> => {
     return getAllFilessInFoldersOfGivenType(dirs, PDF_EXT)
}
export const getAllPngsInFolders = async (dirs: Array<string>): Promise<Array<string>> => {
     return getAllFilessInFoldersOfGivenType(dirs, PNG_EXT)
}

export const getAllDotSumFiles = async (dir: string) => {
     return await getAllFilesOfGivenType(dir, [".sum"]);
}

/**
 * Retrieves all files of specified types from a given directory
 * @param dir - The directory path to search in
 * @param fileTypes - Array of file extensions to filter (e.g., ['.pdf', '.jpg'])
 * @returns Promise<string[]> Array of full file paths matching the specified types
 * @throws Error if directory is invalid or unreadable
 */
export const getAllFilesOfGivenType = async (dir: string, fileTypes: string[] = []): Promise<string[]> => {
    try {
        // Validate directory
        if (!dir || typeof dir !== 'string') {
            throw new Error('Invalid directory path provided');
        }

        // Normalize file types (ensure they start with dot and are lowercase)
        const normalizedTypes = fileTypes.map(type => 
            type.startsWith('.') ? type.toLowerCase() : `.${type.toLowerCase()}`
        );

        // Read directory contents
        const contentList = await fsPromise.readdir(dir);

        // Process files
        const files = contentList
            .map(filename => path.join(dir, filename))
            .filter(filePath => normalizedTypes.length === 0 || 
                normalizedTypes.includes(path.extname(filePath).toLowerCase()));

        return files;
    } catch (error) {
        throw new Error(`Failed to get files from directory ${dir}: ${error.message}`);
    }
}

export const getUploadableFolders = async (srcFolder: string, dest: string) => {
     const dirs = await getDirectories(srcFolder);
     console.log(`${dirs.length} uploadable folders.`);

     return dirs.map((subFolder, index) => {
          return {
               folderNo: `${index+1}`,
               src: `${srcFolder}\\${subFolder}`,
               dest: `${dest}_(${dirs.length})\\ramtek-${index + 1}_${subFolder}`
          }
     });
}

export const getUploadableFoldersForList = (srcFolder: Array<string>, dest: string) => {
     console.log(`${srcFolder.length} uploadable folders.`);

     return srcFolder.map((subFolder, index) => {
          return {
               src: `${subFolder}`,
               dest: `${dest}ramtek_${index + 1}_${subFolder}`
          }
     });
}
export function heapStats(text = '') {
     var stats = v8.getHeapStatistics();
     const totalHeapSize = stats.total_available_size;
     console.log(`${text} totalHeapSizeGb: ${formatMem(totalHeapSize)}`);
     //getStats(text);
}

var getStats = function (text: string = '') {
     var stats = v8.getHeapSpaceStatistics();
     stats.forEach(function (stat: any) {
          console.log(text + ' ' + stat.space_name + ' Available size : ' + formatMem(stat.space_available_size));
     });
};

function formatMem(heapSize: number) {
     const heapSizeInMBs = (heapSize / 1024 / 1024);
     const heapSizeInGBs = (heapSize / 1024 / 1024 / 1024);
     return heapSizeInGBs > 1 ? `${heapSizeInGBs.toFixed(2)} GB(s)` : `${heapSizeInMBs.toFixed(2)} Mb(s)`
}

export function garbageCollect() {
     const before = getMemUsage();
     if (global.gc) {
          global.gc();
          const after = getMemUsage();
     //      console.log(`Mem Usage reduced approximately from 
     // \t${Math.round(before * 100) / 100} MB to
     // \t${Math.round(after * 100) / 100} MB 
     // \treleasing ${Math.round((before - after) * 100) / 100} MB `);
     }
}

export function getMemUsage() {
     const used = process.memoryUsage().heapUsed / 1024 / 1024;
     return used;
}

export const chunk = (arr:Array<any>, size:number) => {
     if(size > arr.length || size < 1){
          return [arr]
     }
     return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
          arr.slice(i * size, i * size + size)
     )
}

export const mkDirIfDoesntExists = async (destFolder:string) => {
     await fsPromise.mkdir(destFolder, {recursive:true});
}
