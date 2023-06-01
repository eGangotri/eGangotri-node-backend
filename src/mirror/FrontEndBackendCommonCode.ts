/**
 * 
 * @param num All Code in this file should be same in both FE and BE Code.
 * @returns 
 */

export function roundOff(num: number) {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }
  
  export function sizeInfo(sizeInBytes: number) {
    const sizeInKB = sizeInBytes / 1024;
    const sizeInMB = sizeInKB / 1024;
  
    if (sizeInKB < 1024) {
      return `${roundOff(sizeInKB)} KB`;
    }
  
    if (sizeInMB >= 1024) {
      const sizeInGB = sizeInMB / 1024;
      return `${roundOff(sizeInGB)} GB`;
    }
  
    return `${roundOff(sizeInMB)} MB`;
  }
  