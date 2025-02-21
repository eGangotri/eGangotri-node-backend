import { FILE_SIZE, LOCAL_FILE_NAME_HEADER } from "../googleapi/_utils/constants";
import { LocalFileHeaders } from "../googleapi/types";
import { excelToJson } from "./ExcelUtils";
import * as fs from 'fs';
import * as _ from 'lodash';


const nonLatin = (jsonArray: LocalFileHeaders) => {
    const nonLatinCharacters = jsonArray[LOCAL_FILE_NAME_HEADER]?.toString().match(/[^\x00-\x7F]+/g);
    if (nonLatinCharacters) {
        console.log("Found non-Latin characters:", nonLatinCharacters.join(' '), jsonArray[FILE_SIZE]);
    }
    return nonLatinCharacters
}


//pnpm run findNonLatin