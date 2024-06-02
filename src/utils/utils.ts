import fs from 'fs';
import path from 'path';
import { SelectedUploadItem } from '../mirror/types';
import { createArchiveLink } from '../mirror';
export const Utils = {};

export const DD_MM_YYYY_FORMAT = 'DD-MMM-YYYY'
export const DD_MM_YYYY_HH_MMFORMAT = 'DD-MMM-YYYY-HH-mm'

export function isValidPath(path: string): boolean {
  try {
    fs.accessSync(path);
    return true;
  } catch {
    return false;
  }
}

export const findTopNLongestFileNames = (directory: string, n: number = 1, includePathInCalc = false) => {
  let longestFileNames: string[] = [];

  function processDirectory(dir: string) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        processDirectory(filePath);
      } else {
        const fileName = includePathInCalc ? filePath : path.basename(filePath);
        longestFileNames.push(fileName);
        longestFileNames.sort((a, b) => b.length - a.length);
        if (longestFileNames.length > n) {
          longestFileNames.pop();
        }
      }
    }
  }

  processDirectory(directory);
  console.log('longestFileNames:', longestFileNames);
  return longestFileNames;//.map(fileName => [fileName, fileName.length]);
}


export const findHighestFileSize = (directory: string): number => {
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

export async function checkUrlValidityForUploadItems(_forVerfication: SelectedUploadItem,
  counter: number,
  total: number): Promise<SelectedUploadItem> {
  const url = createArchiveLink(_forVerfication.archiveId);
  const _validity = await checkUrlValidity(url, counter, total);
  return {
    ..._forVerfication,
    isValid: _validity
  }
}

export async function checkUrlValidity(url: string, counter: number, total: number): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    // Check if the response status code indicates success (2xx) or redirection (3xx)
    if (response.ok && response.status === 200) {
      return true;
    }
    else {
      console.log(`Item # ${counter}/${total}*******response.status ${url} ${response.status} ${response.statusText}`)
      return false;
    }
  } catch (error) {
    console.log(`checkUrlValidity error ${error} `)
    return false;
  }
}


export const getLatestExcelFile = (folderPath: string) => {
  try {
    const files = fs.readdirSync(folderPath);
    const excelFiles = files.filter(file => path.extname(file).toLowerCase() === '.xlsx' || path.extname(file).toLowerCase() === '.xls');

    let latestFilePath;
    let latestFileName;
    let latestTime = 0;

    excelFiles.forEach(file => {
      const filePath = path.join(folderPath, file);
      const stat = fs.statSync(filePath);

      if (stat.mtimeMs > latestTime) {
        latestTime = stat.mtimeMs;
        latestFilePath = filePath;
        latestFileName = file;
      }
    });

    return {
      latestFilePath,
      latestFileName
    };
  }
  catch (err) {
    console.log(`Error in getLatestExcelFile ${err}`)
    return {
      latestFilePath: undefined,
      latestFileName: undefined
    }
  }
}