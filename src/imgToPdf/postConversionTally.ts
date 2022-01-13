import { getAllFilesOfGivenType, getAllPdfs, getDirectories, getDirectoriesWithFullPath } from "./utils/Utils";

async function tally(dirToTally: string) {
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
    const subFolderCount = (await getDirectoriesWithFullPath(folder)).length;
    console.log(`subFolderCount ${subFolderCount} for Folder ${folder}`);

    const tallyCheck = folderLengthFromTitle === subFolderCount
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

tally("E:\\August-2019_reduced");