import fs from 'fs';
import path from 'path'; import { sizeInfo } from '../mirror/FrontEndBackendCommonCode';
import { SelectedUploadItem } from '../mirror/types';
import { createArchiveLink } from '../mirror';
export const Utils = {};

export const DD_MM_YYYY_FORMAT = 'DD-MMM-YYYY'
export const DD_MM_YYYY_HH_MMFORMAT = 'DD-MMM-YYYY-HH-mm'


export function isValidPath(path: string):boolean {
  try {
    fs.accessSync(path);
    return true;
  } catch {
    return false;
  }
}

function findLongestFileName(directory: string, longestButLessThan: number = 300): string {
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
        const fileWithPathLength = path.resolve(filePath);
        if (fileName.length > longestFileName.length && (fileName.length < longestButLessThan)) {
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

// const folderPath = "E:\\_catalogWork\\_reducedPdfs\\Treasures60 (1694)"
// const longestFileName = findLongestFileName(folderPath, 196);
// console.log('Longest file name:', longestFileName, longestFileName.length);

/*

const highestSize = findHighestFileSize(folderPath);
console.log('Highest file size:', sizeInfo(highestSize));
*/

interface VerfiyUrlType {
  url: string;
  success: boolean;
}

export async function checkUrlValidityForUploadItems(_forVerfication: SelectedUploadItem): Promise<SelectedUploadItem> {
  const url = createArchiveLink(_forVerfication.archiveId);
  const _validity = await checkUrlValidity(url);
  return {
    isValid: _validity,
    ..._forVerfication
  }
}

export async function checkUrlValidity(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    // Check if the response status code indicates success (2xx) or redirection (3xx)
    if (response.ok && response.status === 200) {
      return true;
    }
    else {
      console.log(`*******response.status ${url} ${response.status} ${response.statusText}`)
      return false;
    }
  } catch (error) {
    console.log(`checkUrlValidity error ${error} `)
    return false;
  }
}

