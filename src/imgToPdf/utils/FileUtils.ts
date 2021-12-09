import * as fs from 'fs';

export function removeFolderWithContents(folder:string){
    fs.rm(folder, { recursive:true, force: true }, (err) => {
        if(err){
            console.error(err.message);
            return;
        }
    })
}

export const removeExcept = async (folder:any, except:Array<string>)=>{
    const contentList = await fs.promises.readdir(folder)
    const files = contentList.map((x) => folder + "\\" + x).filter((y) => {
        console.log(`Found ${y}`)
        return !except.includes(y)
   }).map(e => fs.unlink(e, (err) => {
            if (err) throw err;
            console.log(`${e} was deleted`);
          }))

}