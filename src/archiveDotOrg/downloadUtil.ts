import { downloadFileFromUrl } from "../cliBased/pdf/downloadFile";
import { DOWNLOAD_COMPLETED_COUNT, DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT } from "../cliBased/pdf/utils";
import { ArchiveLinkData } from "./types";
import { getPathOrSrcRootForProfile } from "../utils/FileUtils";
import { createFolderIfNotExistsAsync } from "../utils/FileUtils";
import { checkFolderExistsSync } from "../utils/FolderUtils";
import { DOUBLE_HASH_SEPARATOR } from "./utils";


export const downloadPdfFromArchiveToProfile = async (pdfLinks: ArchiveLinkData[],
  profileOrPath: string, downloadArchiveCounterController = "") => {

  const pdfDumpFolder = getPathOrSrcRootForProfile(profileOrPath);
  console.log(`downloadPdfFromArchiveToProfile:pdfDumpFolder ${pdfDumpFolder} pdfLinks ${JSON.stringify(pdfLinks)}`);
  if (!checkFolderExistsSync(pdfDumpFolder)) {
    console.log(`No corresponding folder ${pdfDumpFolder} to profile  ${profileOrPath} exists`)
    return {
      "success": false,
      msg: `No corresponding folder to profile (${profileOrPath}) exists`
    }
  }
  if(pdfLinks?.length === 0) {
    console.log(`No pdfs to download for profile ${profileOrPath}`)
    return {
      "success": false,
      msg: `No pdfs to download for profile (${profileOrPath})`
    }
  }

  const folderWithProfileName = pdfDumpFolder + "\\" + pdfLinks[0].acct;
  console.log(`folderWithProfileName ${folderWithProfileName} folderWithProfileName`)

  await createFolderIfNotExistsAsync(pdfDumpFolder);
  await createFolderIfNotExistsAsync(folderWithProfileName);

  try {
    const _results = await downloadArchivePdfs(pdfLinks,
      folderWithProfileName, downloadArchiveCounterController);

    console.log(`Success count: ${DOWNLOAD_COMPLETED_COUNT(downloadArchiveCounterController)}`);
    console.log(`Error count: ${DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT(downloadArchiveCounterController)}`);
    const _resp = {
      status: `${DOWNLOAD_COMPLETED_COUNT(downloadArchiveCounterController)} out of ${DOWNLOAD_COMPLETED_COUNT(downloadArchiveCounterController) + DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT(downloadArchiveCounterController)} made it`,
      success_count: DOWNLOAD_COMPLETED_COUNT(downloadArchiveCounterController),
      error_count: DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT(downloadArchiveCounterController),
      ..._results
    }
    console.log(`_resp : ${JSON.stringify(_resp)}`);
    return _resp;
  }
  catch (err) {
    console.log(`Error ${err}`)
    return {
      status: "failed" + err,
      err
    }
  }
}

//this should be redundant after downloadArchiveItems starts working
const downloadArchivePdfs = async (linkData: ArchiveLinkData[], pdfDumpFolder: string, downloadArchiveCounterController: string = "") => {
  const results = [];
  for (const pdfLink of linkData) {
    console.log(`_data: ${JSON.stringify(pdfLink)}}`);
    console.log(`pdfDumpFolder: ${pdfDumpFolder}`);
    const res = await downloadFileFromUrl(pdfDumpFolder,
      pdfLink.pdfDownloadUrl, pdfLink.originalTitle + ".pdf", linkData.length, "", downloadArchiveCounterController);
    results.push(res);
  }

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
  const results = [];

  for (const pdfLink of _linkDataWithMultiItems) {
    try {
      console.log(`downloadArchiveItems:_data: ${JSON.stringify(pdfLink)}}`);
      console.log(`downloadArchiveItems:pdfDumpFolder: ${pdfDumpFolder}`);
      const res = await downloadFileFromUrl(pdfLink.pdfDumpFolder, pdfLink.pdfDownloadUrl,
        pdfLink.name, _linkDataWithMultiItems.length, "", downloadArchiveCounterController);
      results.push(res);
    } catch (error) {
      console.error(`Error downloading file: ${pdfLink.name}`, error);
      results.push({
        name: pdfLink.name,
        success: false,
        error: error.message || error
      });
    }
  }

  return {
    totalPdfsToDownload: _linkDataWithMultiItems.length,
    results
  }
}