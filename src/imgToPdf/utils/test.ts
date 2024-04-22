export async function getAllFileStatsSync(directoryPath: string,
    filterPath: string = "",
    ignoreFolders: boolean = false,
    withLogs: boolean = false,
    withMetadata: boolean = false): Promise<FileStats[]> {

    // Read all items in the directory
    const items = fs.readdirSync(directoryPath);

    for (const item of items) {
        const itemPath = path.join(directoryPath, item);
        const stat = fs.statSync(itemPath);
        if (stat.isDirectory()) {
            // Recursively call the function for subdirectories
         
            _files = _files.concat(await getAllFileStats(itemPath, filterPath, ignoreFolders, withLogs, withMetadata));
        } else {
        
        }
    }
    return _files;
}