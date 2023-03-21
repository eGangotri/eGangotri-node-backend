import { getAllPdfs, getDirectories, getDirectoriesWithFullPath, mkDirIfDoesntExists } from "../utils/Utils";

const FINAL_PDF_LOC = 'finalPdfsTmpLoc';
import * as fs from 'fs';

async function moveMergedPdfs(rootDir: string) {
  const discardableFolder = `${rootDir}_disc_`
  const pdfFolder = `${rootDir}_pdf_`
  await mkDirIfDoesntExists(pdfFolder);
  await mkDirIfDoesntExists(discardableFolder);
  renamers(rootDir,pdfFolder);
  console.log(`01`);
  //Since 
  // fs.renameSync(rootDir, discardableFolder)
  // keeps failing, we try a diff approach
  //;
  // renamers(rootDir,discardableFolder);
  // console.log(`12`);
  //  // also fails fs.renameSync(pdfFolder, rootDir)
  //  renamers(pdfFolder, rootDir);

  console.log(`Shifted all Pdfs to be under ${rootDir}. unwanted files dumped to ${discardableFolder}`);

}

 const renamers = async (rootDir:string, pdfFolder:string) =>{
  const folders = await getDirectories(rootDir);
  let renamingPromises = folders.map(async (folder) => {
  const srcPdfFolder = `${rootDir}\\${folder}\\${FINAL_PDF_LOC}`
  const destFolderName = `${pdfFolder}\\${folder}`
  await mkDirIfDoesntExists(pdfFolder);
  console.log(`renaming ${srcPdfFolder} -> ${destFolderName}`);
  return fs.promises.rename(srcPdfFolder, destFolderName)
  });
  await Promise.all(renamingPromises);
}

//E:\August-2019_reduced\ramtek-1_01-08-2019(19)\finalPdfsTmpLoc
const mmYYYY = "Dec-2019_(15)";
const _local = `E:/NMM-5/${mmYYYY}`

moveMergedPdfs(`${_local}`);
//yarn run  move-merged-pdfs