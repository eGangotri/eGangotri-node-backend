import { downloadPdfFromUrl } from "../cliBased/pdf/downloadPdf";
import { DOWNLOAD_COMPLETED_COUNT, DOWNLOAD_FAILED_COUNT, resetDownloadCounters } from "../cliBased/pdf/utils";
import { getFolderInSrcRootForProfile } from "../cliBased/utils";
import fs from 'fs';
import * as fsExtra from "fs-extra";
import { LinkData } from "./types";
import { isValidPath } from "../utils/utils";


export const downloadPdfFromArchiveToProfile = async (pdfLinks: LinkData[], profileOrPath: string) => {

  const pdfDumpFolder = isValidPath(profileOrPath) ? profileOrPath : getFolderInSrcRootForProfile(profileOrPath);
  console.log(`downloadPdfFromGoogleDriveToProfile:pdfDumpFolder ${pdfDumpFolder}`);
  if (!fs.existsSync(pdfDumpFolder)) {
    console.log(`No corresponding folder ${pdfDumpFolder} to profile  ${profileOrPath} exists`)
    return {
      "status": "failed"
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
    console.log(`Error count: ${DOWNLOAD_FAILED_COUNT}`);
    const _resp = {
      status: `${DOWNLOAD_COMPLETED_COUNT} out of ${DOWNLOAD_COMPLETED_COUNT + DOWNLOAD_FAILED_COUNT} made it`,
      success_count: DOWNLOAD_COMPLETED_COUNT,
      error_count: DOWNLOAD_FAILED_COUNT,
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

const downloadArchivePdfs = async (linkData: LinkData[], pdfDumpFolder: string) => {
  const promises = linkData.map(pdfLink => {
    console.log(`_data: ${JSON.stringify(pdfLink)}}`);
    console.log(`pdfDumpFolder: ${pdfDumpFolder}`);
    return downloadPdfFromUrl(pdfDumpFolder,
      pdfLink.pdfDownloadUrl, pdfLink.uniqueIdentifier, pdfLink.originalTitle + ".pdf", linkData.length)
  });

  const results = await Promise.all(promises);
  return {
    totalPdfsToDownload: linkData.length,
    results
  }
}
