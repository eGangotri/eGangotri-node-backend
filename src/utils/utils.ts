import fs from 'fs';
import path from 'path'; import { sizeInfo } from '../mirror/FrontEndBackendCommonCode';
import { SelectedUploadItem } from '../mirror/types';
import { createArchiveLink } from '../mirror';
export const Utils = {};

export const DD_MM_YYYY_FORMAT = 'DD-MMM-YYYY'
export const DD_MM_YYYY_HH_MMFORMAT = 'DD-MMM-YYYY-HH-mm'

function findLongestFileName(directory: string): string {
  let longestFileName = '';

  function processDirectory(dir: string) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        processDirectory(filePath);
      } else {
        const fileName = path.basename(filePath);
        if (fileName.length > longestFileName.length) {
          longestFileName = fileName;
        }
      }
    }
  }

  processDirectory(directory);

  return longestFileName;
}

function findHighestFileSize(directory: string): number {
  let highestSize = 0;

  function processDirectory(dir: string) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        processDirectory(filePath);
      } else {
        const fileSize = stat.size;
        if (fileSize > highestSize) {
          highestSize = fileSize;
        }
      }
    }
  }

  processDirectory(directory);

  return highestSize;
}

/*
const folderPath = "D:\\eG-tr1-30\\Treasures"
const longestFileName = findLongestFileName(folderPath);
console.log('Longest file name:', longestFileName, longestFileName.length);

const highestSize = findHighestFileSize(folderPath);
console.log('Highest file size:', sizeInfo(highestSize));
*/

interface VerfiyUrlType {
  url: string;
  success: boolean;
}
export async function checkUrlValidity(_forVerfication: SelectedUploadItem): Promise<SelectedUploadItem> {
  const url = createArchiveLink(_forVerfication.archiveId);
  const result = {
    success: false,
    ..._forVerfication
  }
  try {
    const response = await fetch(url, { method: 'HEAD' });
    // Check if the response status code indicates success (2xx) or redirection (3xx)
    if (response.ok || (response.status >= 300 && response.status < 400)) {
      result.success = true
    }
  } catch (error) {
    return result; // An error occurred, so the URL is invalid
  }
  return result;
}

