import { downloadFileFromUrl } from "../cliBased/pdf/downloadFile";
import { DOWNLOAD_COMPLETED_COUNT, DOWNLOAD_COMPLETED_COUNT2, DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT, DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT2, resetDownloadCounters, resetDownloadCounters2 } from "../cliBased/pdf/utils";
import { getFolderInSrcRootForProfile } from "../archiveUpload/ArchiveProfileUtils";
import { ArchiveLinkData } from "./types";
import { isValidPath } from "../utils/FileUtils";
import { checkFolderExistsSync, createFolderIfNotExistsAsync } from "../utils/FileUtils";
import { DOUBLE_HASH_SEPARATOR } from "./utils";


export const downloadPdfFromArchiveToProfile = async (pdfLinks: ArchiveLinkData[], 
  profileOrPath: string, downloadArchiveCounterController = "") => {

  const pdfDumpFolder = isValidPath(profileOrPath) ? profileOrPath : getFolderInSrcRootForProfile(profileOrPath);
  console.log(`downloadPdfFromArchiveToProfile:pdfDumpFolder ${pdfDumpFolder}`);
  if (!checkFolderExistsSync(pdfDumpFolder)) {
    console.log(`No corresponding folder ${pdfDumpFolder} to profile  ${profileOrPath} exists`)
    return {
      "success": false,
      msg: `No corresponding folder to profile (${profileOrPath}) exists`
    }
  }

  const folderWithProfileName = pdfDumpFolder + "\\" + pdfLinks[0].acct;
  console.log(`folderWithProfileName ${folderWithProfileName} folderWithProfileName`)

  await createFolderIfNotExistsAsync(pdfDumpFolder);
  await createFolderIfNotExistsAsync(folderWithProfileName);

  try {
    resetDownloadCounters2(downloadArchiveCounterController)
    const _results = await downloadArchivePdfs(pdfLinks,
      folderWithProfileName,downloadArchiveCounterController);

    console.log(`Success count: ${DOWNLOAD_COMPLETED_COUNT2(downloadArchiveCounterController)}`);
    console.log(`Error count: ${DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT2(downloadArchiveCounterController)}`);
    const _resp = {
      status: `${DOWNLOAD_COMPLETED_COUNT2(downloadArchiveCounterController)} out of ${DOWNLOAD_COMPLETED_COUNT + DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT} made it`,
      success_count: DOWNLOAD_COMPLETED_COUNT2(downloadArchiveCounterController),
      error_count: DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT2(downloadArchiveCounterController),
      ..._results
    }
    console.log(`_resp : ${JSON.stringify(_resp)}`);
    return _resp;
  }
  catch (err) {
    console.log(`Error ${err}`)
    return {
      "status": "failed" + err
    }
  }
}

//this should be redundant after downloadArchiveItems starts working
const downloadArchivePdfs = async (linkData: ArchiveLinkData[], pdfDumpFolder: string, downloadArchiveCounterController:string ="") => {
  const promises = linkData.map(pdfLink => {
    console.log(`_data: ${JSON.stringify(pdfLink)}}`);
    console.log(`pdfDumpFolder: ${pdfDumpFolder}`);
    return downloadFileFromUrl(pdfDumpFolder,
      pdfLink.pdfDownloadUrl, pdfLink.originalTitle + ".pdf", linkData.length,"",downloadArchiveCounterController)
  });

  const results = await Promise.all(promises);
  return {
    totalPdfsToDownload: linkData.length,
    results
  }
}

export const adjustLinkedDataForMultipleItems = async (linkData: ArchiveLinkData[], pdfDumpFolder: string) => {
  const linkDataWithMultiItems = [];

  for (const pdfLink of linkData) {
    if (!pdfLink?.allNames?.includes(DOUBLE_HASH_SEPARATOR) && pdfLink?.allFormats?.trim().includes("PDF")) {
      const _name = pdfLink?.allNames?.trim();
      console.log(`for pdfs pdfLink.pdfDownloadUrl ${pdfLink.pdfDownloadUrl} and ${_name}`);
      linkDataWithMultiItems.push({
        pdfDumpFolder,
        pdfDownloadUrl: pdfLink.pdfDownloadUrl,
        name: _name.length > 0 ? _name : pdfLink.originalTitle + ".pdf"
      });
    } else {
      const allNames = pdfLink?.allNames?.split(DOUBLE_HASH_SEPARATOR);
      for (let i = 0; i < allNames.length; i++) {
        const _name = allNames[i];
        console.log(`pdfLink.pdfDownloadUrl ${pdfLink.pdfDownloadUrl}`);
        const pdfDumpSubFolder = pdfDumpFolder + "\\" + pdfLink.uniqueIdentifier;
        await createFolderIfNotExistsAsync(pdfDumpSubFolder);
        linkDataWithMultiItems.push({
          pdfDumpFolder: pdfDumpSubFolder,
          pdfDownloadUrl: `${pdfLink.pdfDownloadUrl}/${_name}`,
          name: _name
        });
      }
    }
  }

  return linkDataWithMultiItems;
}
export const downloadArchiveItems = async (_linkData: ArchiveLinkData[], 
  pdfDumpFolder: string, downloadArchiveCounterController = "") => {

  const _linkDataWithMultiItems = await adjustLinkedDataForMultipleItems(_linkData, pdfDumpFolder);

  const promises = _linkDataWithMultiItems.map(pdfLink => {
    try {
      console.log(`downloadArchiveItems:_data: ${JSON.stringify(pdfLink)}}`);
      console.log(`downloadArchiveItems:pdfDumpFolder: ${pdfDumpFolder}`);
      return downloadFileFromUrl(pdfLink.pdfDumpFolder, pdfLink.pdfDownloadUrl, 
        pdfLink.name, _linkDataWithMultiItems.length, "",downloadArchiveCounterController);
    } catch (error) {
      console.error(`Error downloading file: ${pdfLink.name}`, error);
      return null; // Return null or any other value to indicate failure
    }

  });

  const results = await Promise.all(promises);
 
  return {
    totalPdfsToDownload: _linkDataWithMultiItems.length,
    results
  }
}