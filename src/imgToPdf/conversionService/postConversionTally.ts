import { getAllFilesOfGivenType, getAllPdfs, getDirectories, getDirectoriesWithFullPath } from "../utils/Utils";

const TALLY_FOR_FOLDERS = 1;
const TALLY_FOR_PDFS = 2;

async function tally(dirToTally: string, tallyType:number = 1) {
  let tallyFailureCount = 0;
  let tallySuccessCount = 0; 
  const folders = await getDirectoriesWithFullPath(dirToTally);
  let totalTallyableDirectoryCount = folders.length; 
  let tallyStats = folders.map(async (folder) => {
    const tokens = folder.split("(");
    let folderLengthFromTitle = -1
    if (tokens && tokens.length === 2) {
      folderLengthFromTitle = parseInt(tokens[1]);
      console.log(`folderLengthFromTitle ${folderLengthFromTitle} from ${folder}`);
    }
    let targetCount = 0;
    if(tallyType === 1){
      targetCount = (await getDirectoriesWithFullPath(folder)).length;
    }
    else{
      targetCount = (await getAllPdfs(folder)).length;
    }
    console.log(`Item Count ${targetCount} for Target Item ${folder}`);
    const tallyCheck = folderLengthFromTitle === targetCount
    if(tallyCheck){
        tallySuccessCount++
    }
    else{
        tallyFailureCount++
    }
    console.log(`Tally Check for ${folder} ${tallyCheck}`);
    return {
        folder,
        tallyCheck
    }
  });

  console.log(await Promise.all(tallyStats));
  console.log(`Taily Failure: ${tallyFailureCount}`);
  console.log(`Taily Success Count: ${tallySuccessCount}`);
  console.log(` Is Success Count(${tallySuccessCount}) and No. of Target Items(${totalTallyableDirectoryCount}) matching ${totalTallyableDirectoryCount=== tallySuccessCount?  "Yes Complete Success" : "!!!! FAILURES !!!!"}`)
}

//Before Merge
tally("E:\\July-2019_d", TALLY_FOR_FOLDERS);

//After Merge
//tally("E:\\July-2019", TALLY_FOR_PDFS);
