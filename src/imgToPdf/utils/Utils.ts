import * as fs from 'fs';

export const getDirectories = source =>
     fs.readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)

export function formatTime(timeLapseinMS:number){
     const timeLapseInSecs = timeLapseinMS/1000
     if(timeLapseInSecs > 60){
          return `${timeLapseInSecs/60} minute(s)`
     }
     return `${timeLapseInSecs} sec(s)` 
}