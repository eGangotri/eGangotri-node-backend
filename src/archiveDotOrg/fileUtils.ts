import * as fs from 'fs';

export const isFileInUse = (file: string): boolean => {
    try {
        const fd = fs.openSync(file, 'r+');
        fs.closeSync(fd);
        return false;
    } catch (err) {
        return true;
    }
};

