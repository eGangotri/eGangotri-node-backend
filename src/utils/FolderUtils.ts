import * as fs from 'fs';

// Local definition to avoid circular dependency with FileUtils
export const checkFolderExistsSync = (folderPath: string): boolean => {
    try {
        fs.accessSync(folderPath);
        return true;
    } catch (err: any) {
        if (err.code === 'ENOENT') {
            return false;
        }
        throw err;
    }
}

