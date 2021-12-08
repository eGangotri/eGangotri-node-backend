import * as fs from 'fs';

export const getDirectories = source =>
     fs.readdirSync(source, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name)

export function formatTime(timeLapseinMS: number) {
     const timeLapseInSecs = timeLapseinMS / 1000
     let timeLapse = `${(timeLapseInSecs * 100) / 100} sec(s)`
     if (timeLapseInSecs > 60) {
          timeLapse = `${((timeLapseInSecs / 60) * 100) / 100} minute(s)`
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
     const contentList = fs.readdirSync(dir)
     for (let content of contentList) {
          if (content.toLowerCase().endsWith(_types[0]) || (_types.length > 1 && content.toLowerCase().endsWith(_types[1]))) {
               files.push(dir + "\\" + content);
          }
     }
     //console.log(`Found ${files.length} ${_types[0]}(s) of ${contentList.length}  items in \n\t${dir}`)

     return files;
}

export const getUploadableFolders = (srcFolder: string, dest: string) => {
     const dirs = getDirectories(srcFolder);
     console.log(`${dirs.length} uploadable folders.`);
     return dirs.map((subFolder, index) => {
          return {
               src: `${srcFolder}\\${subFolder}`,
               dest: `${dest}-${index + 1}`
          }
     });
}
export function garbageCollect() {
     const before = getMemUsage();
     global.gc()
     const after = getMemUsage();
     console.log(`Mem Usage reduced approximately from 
     \t${Math.round(before * 100) / 100} MB to
     \t${Math.round(after * 100) / 100} MB 
     \treleasing ${Math.round((before-after) * 100) / 100} MB `);
}

export function getMemUsage() {
     const used = process.memoryUsage().heapUsed / 1024 / 1024;
     return used;
}