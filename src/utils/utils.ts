import path from 'path';
import * as fsPromise from 'fs/promises';

import { SelectedUploadItem } from '../mirror/types';
import { createArchiveLink } from '../mirror';
export const Utils = {};

export const DD_MM_YYYY_FORMAT = 'DD-MMM-YYYY'
export const DD_MM_YYYY_HH_MMFORMAT = 'DD-MMM-YYYY-HH-mm'

export const findTopNLongestFileNames = async (directory: string, n: number = 1, includePathInCalc = false) => {
  let longestFileNames: string[] = [];

  async function processDirectory(dir: string) {
    const files = await fsPromise.readdir(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fsPromise.stat(filePath);

      if (stat.isDirectory()) {
        await processDirectory(filePath);
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

  await processDirectory(directory);
  return longestFileNames;
};

export const findHighestFileSize = async (directory: string): Promise<number> => {
  let highestSize = 0;

  async function processDirectory(dir: string) {
    const files = await fsPromise.readdir(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fsPromise.stat(filePath);

      if (stat.isDirectory()) {
        await processDirectory(filePath);
      } else {
        const fileSize = stat.size;
        if (fileSize > highestSize) {
          highestSize = fileSize;
        }
      }
    }
  }

  await processDirectory(directory);
  return highestSize;
};
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


export const getLatestExcelFile = async (folderPath: string) => {
  try {
    const files = await fsPromise.readdir(folderPath);
    const excelFiles = files.filter(
      file => path.extname(file).toLowerCase() === '.xlsx' || path.extname(file).toLowerCase() === '.xls'
    );

    let latestFilePath: string | undefined;
    let latestFileName: string | undefined;
    let latestTime = 0;

    for (const file of excelFiles) {
      const filePath = path.join(folderPath, file);
      const stat = await fsPromise.stat(filePath);

      if (stat.mtimeMs > latestTime) {
        latestTime = stat.mtimeMs;
        latestFilePath = filePath;
        latestFileName = file;
      }
    }

    return {
      latestFilePath,
      latestFileName,
    };
  } catch (err) {
    console.log(`Error in getLatestExcelFile: ${err}`);
    return {
      latestFilePath: undefined,
      latestFileName: undefined,
    };
  }
};