import { getAllFilesOfGivenType, getAllPdfs, getDirectories, getDirectoriesWithFullPath } from "../utils/Utils";

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
      const targetCount = (await getDirectoriesWithFullPath(folder)).length;
    }
    else{
      const targetCount = (await getAllPdfs(folder)).length;

    }
    console.log(`targetCount ${targetCount} for Folder ${folder}`);
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
  console.log(` Is Success Count and No. fo Folders matching ${totalTallyableDirectoryCount=== tallySuccessCount?  "Yes Complete Success" : "!!!! FAILURES !!!!"}`)
}

const TALLY_FOR_FOLDERS = 1;
const TALLY_FOR_PDFS = 2;
tally("E:\\August-2019_reduced", TALLY_FOR_PDFS);