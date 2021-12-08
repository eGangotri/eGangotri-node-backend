import * as fs from 'fs';

export function removeFolderWithContents(folder:string){
    fs.rm(folder, { recursive:true, force: true }, (err) => {
        if(err){
            console.error(err.message);
            return;
        }
    })
}