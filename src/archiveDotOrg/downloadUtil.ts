import { downloadPdfFromUrl } from "cliBased/pdf/downloadPdf";
import { DOWNLOAD_COMPLETED_COUNT, DOWNLOAD_FAILED_COUNT, resetDownloadCounters } from "cliBased/pdf/utils";
import { getFolderInSrcRootForProfile } from "cliBased/utils";
import fs from 'fs';
import * as fsExtra from "fs-extra";
import { LinkData } from "./types";


export const downloadPdfFromArchiveToProfile = async (pdfLinks: LinkData[], profile: string) => {
  const pdfDumpFolder = getFolderInSrcRootForProfile(profile)
  console.log(`downloadPdfFromGoogleDriveToProfile:pdfDumpFolder ${pdfDumpFolder}`)
  try {
    if (fs.existsSync(pdfDumpFolder)) {
      resetDownloadCounters()
      const _results = await getArchivePdfs(pdfLinks,
        pdfDumpFolder);

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
    console.log(`No corresponding folder ${pdfDumpFolder} to profile  ${profile} exists`)
    return {
      "status": "failed"
    }
  }
  catch (err) {
    console.log(`Error ${err}`)
    return {
      "status": "failed" + err
    }
  }
}

const getArchivePdfs = async (linkData: LinkData[], pdfDumpFolder: string) => {
  const promises = linkData.map(pdfLink => {
    console.log(`_data: ${JSON.stringify(pdfLink)}}`);
    console.log(`pdfDumpFolder: ${pdfDumpFolder}`);
    if (!fs.existsSync(pdfDumpFolder)) {
      fsExtra.ensureDirSync(pdfDumpFolder);
    }

    return downloadPdfFromUrl(pdfDumpFolder,
      pdfLink.pdfDownloadUrl, pdfLink.uniqueIdentifier, pdfLink.originalTitle + ".pdf", linkData.length)
  });

  const results = await Promise.all(promises);
  return {
    totalPdfsToDownload: linkData.length,
    results
  }
}
