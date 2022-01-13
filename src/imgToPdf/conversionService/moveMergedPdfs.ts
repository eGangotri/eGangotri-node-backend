import { getAllPdfs, getDirectories, getDirectoriesWithFullPath, mkDirIfDoesntExists } from "../utils/Utils";

const FINAL_PDF_LOC = 'finalPdfsTmpLoc';
import * as fs from 'fs';

async function moveMergedPdfs(rootDir: string) {
  const finalPDFDestFolder = `${rootDir}_pdfs_`
  await mkDirIfDoesntExists(finalPDFDestFolder);

  const folders = await getDirectories(rootDir);
  let renamingPromises = folders.map(async (folder) => {
  const srcPdfFolder = `${rootDir}\\${folder}\\${FINAL_PDF_LOC}`

  const destFolderName = `${finalPDFDestFolder}\\${folder}`
  await mkDirIfDoesntExists(finalPDFDestFolder);
  console.log(`renaming ${srcPdfFolder} -> ${destFolderName}`)
  fs.promises.rename(srcPdfFolder, destFolderName)
  });
}


//E:\August-2019_reduced\ramtek-1_01-08-2019(19)\finalPdfsTmpLoc
moveMergedPdfs("E:\\August-2019_reduced");
