import { FILE_SIZE, LOCAL_FILE_NAME_HEADER } from "../googleapi/_utils/constants";
import { LocalFileHeaders } from "../googleapi/types";


export const nonLatin = (jsonArray: LocalFileHeaders) => {
    const nonLatinCharacters = jsonArray[LOCAL_FILE_NAME_HEADER]?.toString().match(/[^\x00-\x7F]+/g);
    if (nonLatinCharacters) {
        console.log("Found non-Latin characters:", nonLatinCharacters.join(' '), jsonArray[FILE_SIZE]);
    }
    return nonLatinCharacters
}


//pnpm run findNonLatin