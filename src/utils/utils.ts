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
  const _validity = await checkArchiveUrlValidity(url, counter, total);
  return {
    ..._forVerfication,
    isValid: _validity
  }
}

export async function checkArchiveUrlValidity(url: string, counter: number, total: number): Promise<boolean> {
  try {
    console.log(`Checking URL validity: ${url} (attempt 1/3)`);
    
    // Try HTTPS first with 20 second timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);
      
      const fetchOptions = {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      };
      
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.log(`Item # ${counter}/${total}******* response.status ${url} ${response.status} ${response.statusText}`);
        throw new Error(`HTTP status ${response.status}`);
      }
      
      // Get the page content
      const html = await response.text();
      // Check for PDF download option
      const hasPDF = html.includes('PDF');
      
      if (!hasPDF) {
        console.log(`Item # ${counter}/${total}******* PDF not available for download at ${url}`);
        return false;
      }
      
      return true;
    } catch (error: any) {
      console.log(`HTTPS attempt failed: ${error.message || error}`);
      
      // If HTTPS failed, try HTTP version
      const httpUrl = url.replace('https://', 'http://');
      console.log(`Trying HTTP instead: ${httpUrl} (attempt 2/3)`);
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);
        
        const fetchOptions = {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        };
        
        const httpResponse = await fetch(httpUrl, fetchOptions);
        clearTimeout(timeoutId);
        
        if (!httpResponse.ok) {
          console.log(`Item # ${counter}/${total}******* response.status ${httpUrl} ${httpResponse.status} ${httpResponse.statusText}`);
          throw new Error(`HTTP status ${httpResponse.status}`);
        }
        
        const html = await httpResponse.text();
        const hasPDF = html.includes('PDF');
        
        if (!hasPDF) {
          console.log(`Item # ${counter}/${total}******* PDF not available for download at ${httpUrl}`);
          return false;
        }
        
        return true;
      } catch (httpError: any) {
        console.log(`HTTP attempt also failed: ${httpError.message || httpError}`);
        
        // Final attempt with increased timeout
        console.log(`Final attempt with increased timeout (attempt 3/3)`);
        
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
          
          const fetchOptions = {
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          };
          
          const finalResponse = await fetch(url, fetchOptions);
          clearTimeout(timeoutId);
          
          if (!finalResponse.ok) {
            console.log(`Item # ${counter}/${total}******* final attempt response.status ${url} ${finalResponse.status} ${finalResponse.statusText}`);
            throw new Error(`HTTP status ${finalResponse.status}`);
          }
          
          const html = await finalResponse.text();
          const hasPDF = html.includes('PDF');
          
          if (!hasPDF) {
            console.log(`Item # ${counter}/${total}******* PDF not available for download at ${url}`);
            return false;
          }
          
          return true;
        } catch (finalError: any) {
          console.log(`Final attempt failed: ${finalError.message || finalError}`);
          console.log(`All attempts to access ${url} failed. URL may be valid but unreachable from current network.`);
          if (finalError.name === 'AbortError') {
            console.log('The request was aborted due to timeout. This may indicate network connectivity issues.');
          }
          return false;
        }
      }
    }
  } catch (error) {
    console.log(`checkUrlValidity (${url}) unexpected error: ${error}. This may be due to network connectivity issues.`);
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