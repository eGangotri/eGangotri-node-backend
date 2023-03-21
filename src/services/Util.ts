import * as fs from 'fs';
import * as path from 'path';
import moment from 'moment';

/**
 * 
 * @param folderName 
 * @param dateString must be DD-MMM-YYYY. Ex: 21-Mar-2021
 * if dateString === "ALL" then all files will be processed
 */
 export function filesOnGivenDate(folderName:string, dateString:string = ""):string[]{
    let processableFiles:string[] = []
    const formattedDate = dateString != "ALL" ? (dateString || (moment(new Date())).format('DD-MMM-YYYY') ):"ALL";
    console.log(`\nSearching for Files in ${folderName} for ${formattedDate}`);
  
    fs.readdirSync(path.resolve("/", folderName)).forEach(file => {
      if(dateString === "ALL"){
        processableFiles.push(`${folderName}/${file}`);
      }
      else if (file.indexOf(formattedDate) > 0) {
        processableFiles.push(`${folderName}/${file}`);
      }
    });
  
    console.log(`We will process following ${processableFiles?.length} Files:`);
  
    processableFiles.forEach((fileName)=>{
      //console.log(`${fileName}`);
    })
    return processableFiles;
  }
  

  function stripQuotes(text: any) {
    const strippedValue =
      typeof text === "string"
        ? text.toString().replace(/\"/g, "").replace(/\"/g, "").trim()
        : text;
    return strippedValue;
  }
  
  export function stripQuotesForItemsInArray(rowArray: Array<any>) {
    return rowArray.map((r: any) => {
      return stripQuotes(r);
    });
  }