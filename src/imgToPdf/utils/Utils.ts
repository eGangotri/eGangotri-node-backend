import * as fs from 'fs';
const path = require('path');
const v8 = require('v8');

export const getDirectories = async (source:string) => {
     const subDirs = await fs.promises.readdir(source, { withFileTypes: true })
          return subDirs.filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name)
}

export const getDirectoriesWithFullPath = async (source:string) => {
     const subDirs = await fs.promises.readdir(source, { withFileTypes: true })
          return subDirs.filter(dirent => dirent.isDirectory())
          .map(dirent => `${source}\\${dirent.name}`)
}

export function formatTime(timeLapseinMS: number) {
     const timeLapseInSecs = timeLapseinMS / 1000
     let timeLapse = `${timeLapseInSecs.toFixed(2)} sec(s)`
     if (timeLapseInSecs > 60) {
          timeLapse = `${(timeLapseInSecs / 60).toFixed(2)} minute(s)`
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
               fs.unlinkSync(file);
          } catch (err) {
               console.error(err)
          }
     };
}

export const getAllPdfs = async (dir: string) => {
     return await getAllFilesOfGivenType(dir, [".pdf"]);
}
export const getAllFilesOfGivenType = async (dir: string, _types: Array<string> = []) => {
     let files = []

     const contentList = await fs.promises.readdir(dir)
     files = contentList.map((x) => dir + "\\" + x).filter((y) => {
          return _types.includes(path.extname(y).toLowerCase())
     })
     //console.log(`Found ${files.length} ${files} ${_types.join(",")}(s) in ${dir}`)

     return files;
}

export const getUploadableFolders = async (srcFolder: string, dest: string) => {
     const dirs = await getDirectories(srcFolder);
     console.log(`${dirs.length} uploadable folders.`);

     return dirs.map((subFolder, index) => {
          return {
               src: `${srcFolder}\\${subFolder}`,
               dest: `${dest}ramtek_${index + 1}_${subFolder}`
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
export function heapStats(){
     const v8 = require('v8');
     const totalHeapSize = v8.getHeapStatistics().total_available_size;
     const totalHeapSizeGb = (totalHeapSize / 1024 / 1024 / 1024).toFixed(2);
     console.log('totalHeapSizeGb: ', totalHeapSizeGb);
}

export function garbageCollect() {
     const before = getMemUsage();
     if (global.gc) {
          console.log("....");
          global.gc();}
     const after = getMemUsage();
     console.log(`Mem Usage reduced approximately from 
     \t${Math.round(before * 100) / 100} MB to
     \t${Math.round(after * 100) / 100} MB 
     \treleasing ${Math.round((before - after) * 100) / 100} MB `);
}

export function getMemUsage() {
     const used = process.memoryUsage().heapUsed / 1024 / 1024;
     return used;
}