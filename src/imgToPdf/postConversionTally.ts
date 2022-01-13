import { getAllPdfs, getDirectories, getDirectoriesWithFullPath } from "./utils/Utils";

async function tally(dirToTally: string) {
  let tallyFailureCount = 0;
  let tailySuccessCount = 0; 
  const folders = await getDirectoriesWithFullPath(dirToTally);
  let tallyStats = folders.map(async (folder) => {
    const tokens = folder.split("(");
    let folderLengthFromTitle = -1
    if (tokens && tokens.length === 2) {
      folderLengthFromTitle = parseInt(tokens[1]);
      console.log(folderLengthFromTitle);
    }
    const pdfCount = (await getAllPdfs(folder)).length;
    const tallyCheck = folderLengthFromTitle  == pdfCount
    if(tallyCheck){
        tailySuccessCount++
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
  console.log(`Taily Success Count: ${tailySuccessCount}`);
}

tally("C:\\tmp\\tallyTest");
