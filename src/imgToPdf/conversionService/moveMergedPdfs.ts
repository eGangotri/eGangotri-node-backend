import { getAllPdfs, getDirectories, getDirectoriesWithFullPath, mkDirIfDoesntExists } from "../utils/Utils";

const FINAL_PDF_LOC = 'finalPdfsTmpLoc';
import * as fs from 'fs';

async function moveMergedPdfs(rootDir: string) {
  const discardableFolder = `${rootDir}_disc_`
  const tmpFolder = `${rootDir}_tmp_`
  await mkDirIfDoesntExists(tmpFolder);
  await mkDirIfDoesntExists(discardableFolder);
  renamers(rootDir,tmpFolder);
  console.log(`01`);
  //Since 
  // fs.renameSync(rootDir, discardableFolder)
  // keeps failing, we try a diff approach
  //;
  // renamers(rootDir,discardableFolder);
  // console.log(`12`);
  //  // also fails fs.renameSync(tmpFolder, rootDir)
  //  renamers(tmpFolder, rootDir);

  console.log(`Shifted all Pdfs to be under ${rootDir}. unwanted files dumped to ${discardableFolder}`);

}

 const renamers = async (rootDir:string, tmpFolder:string) =>{
  const folders = await getDirectories(rootDir);
  let renamingPromises = folders.map(async (folder) => {
  const srcPdfFolder = `${rootDir}\\${folder}\\${FINAL_PDF_LOC}`
  const destFolderName = `${tmpFolder}\\${folder}`
  await mkDirIfDoesntExists(tmpFolder);
  console.log(`renaming ${srcPdfFolder} -> ${destFolderName}`);
  return fs.promises.rename(srcPdfFolder, destFolderName)
  });
  await Promise.all(renamingPromises);
}

//E:\August-2019_reduced\ramtek-1_01-08-2019(19)\finalPdfsTmpLoc
moveMergedPdfs("E:\\June-2020");
//yarn run  move-merged-pdfs