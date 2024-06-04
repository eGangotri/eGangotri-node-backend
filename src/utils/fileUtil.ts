import { FileStats } from "imgToPdf/utils/types";
import { getAllFileListingWithFileSizeStats } from "../imgToPdf/utils/FileUtils";

export const getDuplicatesBySize = async (folder: string, folder2: string) => {
    const metadata = await getAllFileListingWithFileSizeStats(folder);
    const metadata2 = await getAllFileListingWithFileSizeStats(folder2);

    const duplicates = duplicateBySizeCheck(metadata, metadata2)

    const reverseDuplicates = duplicateBySizeCheck(metadata2, metadata)
    return {
        msg: `${metadata.length} files in ${folder} and ${metadata2.length} files in ${folder2} with ${duplicates.length} duplicates by size.`,
        metadata1Length: metadata.length,
        metadata2Length: metadata2.length,
        diff1: metadata.length - duplicates.length,
        diff2: metadata2.length - reverseDuplicates.length,
        dupLength: duplicates.length,
        revDupLength: reverseDuplicates.length,
        duplicates,
        reverseDuplicates,
    }
}

const duplicateBySizeCheck = (metadata: FileStats[], metadata2: FileStats[]) => {
    const duplicates = [];
    console.log(`metadata ${JSON.stringify(metadata[0].size)} metadata2 ${JSON.stringify(metadata2[0].size)}`)
    metadata.forEach((file:FileStats) => {
        const match = metadata2.find((file2:FileStats) => {
            if(file.rawSize === file2.rawSize){
                console.log(`rawSize ${file.fileName}(${file.rawSize}) ${file2?.fileName}(${file2?.rawSize})`)
            }
            return file.rawSize === file2.rawSize;
        });
        //console.log(`match ${JSON.stringify(match)}`)
        if (match?.fileName.length > 0) {
            duplicates.push({
                file:file.fileName,
                file2:match?.fileName
            });
        }
    });
    return duplicates;
}
