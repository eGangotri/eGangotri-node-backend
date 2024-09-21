import { downloadFileFromUrl } from "../cliBased/pdf/downloadPdf";
import { DOWNLOAD_COMPLETED_COUNT, DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT, resetDownloadCounters } from "../cliBased/pdf/utils";
import { getFolderInSrcRootForProfile } from "../archiveUpload/ArchiveProfileUtils";
import fs from 'fs';
import * as fsExtra from "fs-extra";
import { LinkData } from "./types";
import { isValidPath } from "../utils/utils";
import { createFolderIfNotExists } from "../utils/FileUtils";
import { DOUBLE_HASH_SEPARATOR } from "./utils";


export const downloadPdfFromArchiveToProfile = async (pdfLinks: LinkData[], profileOrPath: string) => {

  const pdfDumpFolder = isValidPath(profileOrPath) ? profileOrPath : getFolderInSrcRootForProfile(profileOrPath);
  console.log(`downloadPdfFromArchiveToProfile:pdfDumpFolder ${pdfDumpFolder}`);
  if (!fs.existsSync(pdfDumpFolder)) {
    console.log(`No corresponding folder ${pdfDumpFolder} to profile  ${profileOrPath} exists`)
    return {
      "success": false,
      msg: `No corresponding folder to profile (${profileOrPath}) exists`
    }
  }

  const folderWithProfileName = pdfDumpFolder + "\\" + pdfLinks[0].acct;
  console.log(`folderWithProfileName ${folderWithProfileName} folderWithProfileName`)

  if (!fs.existsSync(pdfDumpFolder) || !fs.existsSync(folderWithProfileName)) {
    fsExtra.ensureDirSync(folderWithProfileName);
    fsExtra.ensureDirSync(folderWithProfileName);
  }

  try {
    resetDownloadCounters()
    const _results = await downloadArchivePdfs(pdfLinks,
      folderWithProfileName);

    console.log(`Success count: ${DOWNLOAD_COMPLETED_COUNT}`);
    console.log(`Error count: ${DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT}`);
    const _resp = {
      status: `${DOWNLOAD_COMPLETED_COUNT} out of ${DOWNLOAD_COMPLETED_COUNT + DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT} made it`,
      success_count: DOWNLOAD_COMPLETED_COUNT,
      error_count: DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT,
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
const downloadArchivePdfs = async (linkData: LinkData[], pdfDumpFolder: string) => {
  const promises = linkData.map(pdfLink => {
    console.log(`_data: ${JSON.stringify(pdfLink)}}`);
    console.log(`pdfDumpFolder: ${pdfDumpFolder}`);
    return downloadFileFromUrl(pdfDumpFolder,
      pdfLink.pdfDownloadUrl, pdfLink.originalTitle + ".pdf", linkData.length)
  });

  const results = await Promise.all(promises);
  return {
    totalPdfsToDownload: linkData.length,
    results
  }
}

export const adjustLinkedDataForMultipleItems = (linkData: LinkData[], pdfDumpFolder: string) => {
  const linkDataWithMultiItems = [];

  linkData.map(pdfLink => {
    if (!pdfLink?.allNames?.includes(DOUBLE_HASH_SEPARATOR) && pdfLink?.allFormats?.trim().includes("Text PDF")) {
      const _name = pdfLink?.allNames?.trim();
      linkDataWithMultiItems.push({
        pdfDumpFolder,
        pdfDownloadUrl: pdfLink.pdfDownloadUrl,
        name: _name.length > 0 ? _name : pdfLink.originalTitle + ".pdf"
      });
    }
    else {
      const allNames = pdfLink?.allNames?.split(DOUBLE_HASH_SEPARATOR);
      allNames?.forEach(_name => {
        console.log(`pdfLink.pdfDownloadUrl ${pdfLink.pdfDownloadUrl}`);
        const pdfDumpSubFolder = pdfDumpFolder + "\\" + pdfLink.uniqueIdentifier
        createFolderIfNotExists(pdfDumpSubFolder);
        linkDataWithMultiItems.push({
          pdfDumpFolder: pdfDumpSubFolder,
          pdfDownloadUrl: `${pdfLink.pdfDownloadUrl}/${_name}`,
          name: _name
        })
      });
    }
  });
  return linkDataWithMultiItems;

}

export const downloadArchiveItems = async (_linkData: LinkData[], pdfDumpFolder: string) => {

  const _linkDataWithMultiItems = adjustLinkedDataForMultipleItems(_linkData, pdfDumpFolder);

  const promises = _linkDataWithMultiItems.map(pdfLink => {
    try {
      console.log(`downloadArchiveItems:_data: ${JSON.stringify(pdfLink)}}`);
      console.log(`downloadArchiveItems:pdfDumpFolder: ${pdfDumpFolder}`);
      return downloadFileFromUrl(pdfLink.pdfDumpFolder, pdfLink.pdfDownloadUrl, pdfLink.name, _linkDataWithMultiItems.length);
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