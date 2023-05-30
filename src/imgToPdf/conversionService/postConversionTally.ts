import { getAllFilesOfGivenType, getAllPdfs, getDirectories, getDirectoriesWithFullPath } from "../utils/Utils";
import * as path from 'path';

const TALLY_FOR_FOLDERS = 1;
const TALLY_FOR_PDFS = 2;
let TOTAL_NUMBER_OF_FOLDERS_HAVING_PDF_CREATIBLES = 0
let TOTAL_NUMBER_OF_TARGETS_GENERATED = 0
let FOLDER_COUNT_EQUALS_GENERATED_FOLDERS_OR_PDFS = false;
//doesnt refer to NMM. only local
async function tally(dirToTally: string,  tallyType: number = 1) {
  let tallyFailureCount = 0;
  let tallySuccessCount = 0;
  const folders = await getDirectoriesWithFullPath(dirToTally);

  let dirToTallySubFolderCountFromTitle = parseInt(path.parse(dirToTally).name.split("(")[1]);
 

  let totalTallyableDirectoryCount = folders.length;
  let tallyStats = folders.map(async (folder) => {
    const tokens = path.parse(folder).name.split("(");
    let folderLengthFromTitle = -1
    if (tokens && tokens.length === 2) {
      folderLengthFromTitle = parseInt(tokens[1]);
      console.log(`folderLengthFromTitle ${folderLengthFromTitle} from ${folder}`);
    }
    let targetCount = 0;
    if (tallyType === 1) {
      targetCount = (await getDirectoriesWithFullPath(folder)).length;
    }
    else {
      targetCount = (await getAllPdfs(folder)).length;
    }
    TOTAL_NUMBER_OF_TARGETS_GENERATED += targetCount

    console.log(`Item Count ${targetCount} for Target Item ${folder}`);
    TOTAL_NUMBER_OF_FOLDERS_HAVING_PDF_CREATIBLES += folderLengthFromTitle
    const tallyCheck = folderLengthFromTitle === targetCount
    if (tallyCheck) {
      tallySuccessCount++
    }
    else {
      tallyFailureCount++
    }
    console.log(`Tally Check for ${folder} ${tallyCheck}`);
    return {
      folder,
      tallyCheck,
      diff: folderLengthFromTitle - targetCount
    }
  });


  if (dirToTallySubFolderCountFromTitle !== folders.length) {
    console.log(`Folder Count ${folders.length} not same as ${dirToTallySubFolderCountFromTitle}`);
  }
  else {
    FOLDER_COUNT_EQUALS_GENERATED_FOLDERS_OR_PDFS = true
  }
  const _tallType = tallyType === TALLY_FOR_FOLDERS ? "Folder Tally" : "PDF Tally"
  console.log(await Promise.all(tallyStats));
  console.log(`TOTAL_NUMBER_OF_FOLDERS_HAVING_PDF_CREATIBLES: ${TOTAL_NUMBER_OF_FOLDERS_HAVING_PDF_CREATIBLES}`)
  console.log(`TOTAL_NUMBER_OF_TARGETS_GENERATED: ${TOTAL_NUMBER_OF_TARGETS_GENERATED}`)
  const targetItemCountDiff = TOTAL_NUMBER_OF_FOLDERS_HAVING_PDF_CREATIBLES - TOTAL_NUMBER_OF_TARGETS_GENERATED
  console.log(`Target Item Creation Count(${TOTAL_NUMBER_OF_FOLDERS_HAVING_PDF_CREATIBLES}==${TOTAL_NUMBER_OF_TARGETS_GENERATED})`, targetItemCountDiff === 0 ? "Matches. Sucesss" : `Short by ${targetItemCountDiff}. Failed`)

  console.log(`\n${_tallType} Failure(s): ${tallyFailureCount}`);
  console.log(`${_tallType} Success Count: ${tallySuccessCount}`);
  console.log(`${_tallType} Is Success Count(${tallySuccessCount}) and No. of Target Items(${totalTallyableDirectoryCount}) matching ${totalTallyableDirectoryCount === tallySuccessCount ? "Yes Complete Success" : "!!!! FAILURES !!!!"}`)
  console.log(`FOLDER_COUNT_EQUALS_GENERATED_FOLDERS_OR_PDFS: ${FOLDER_COUNT_EQUALS_GENERATED_FOLDERS_OR_PDFS}`);
}

//Before Merge
const mmYYYY = "Dec-2019_(15)";
const _local = `E:/NMM-5/${mmYYYY}`
//tally(_local, TALLY_FOR_FOLDERS);
//After Merge
tally(_local, TALLY_FOR_PDFS);

//yarn run tally-post-conversion