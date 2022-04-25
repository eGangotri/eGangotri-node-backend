
import { filesOnGivenDate } from '../services/Util';
import { connectToMongo } from '../services/dbService';
import { processCSVPair } from '../services/execute';
import * as os from 'os';

const HOME_DIR = os.homedir();

let HOME_FOLDER = `${HOME_DIR}/eGangotri`;

const customLocation = process.argv && process.argv.length > 2 ? process.argv[2]: '';
if(customLocation){
    HOME_FOLDER = customLocation
}
const ITEM_QUEUED_FOLDER = `${HOME_FOLDER}/items_queued`;
const ITEM_USHERED_FOLDER = `${HOME_FOLDER}/items_ushered`;
const givenDate = "29-Nov-2019" // "ALL"

const queuedFile = filesOnGivenDate(ITEM_QUEUED_FOLDER, givenDate);
const usheredFile = filesOnGivenDate(ITEM_USHERED_FOLDER, givenDate);

function flatFile2Mongo(){
    connectToMongo().then( () =>{
        console.log("started writting to mongo")
        for(let i = 0; i < queuedFile.length;i++){
            console.log(`queuedFile(s) ${queuedFile.join(",")} i=${i}`)
            console.log(`usheredFile(s) ${usheredFile.join(",")} i=${i}`)
            processCSVPair(queuedFile[i], usheredFile[i]);
        }
    });
}

(()=>{
    flatFile2Mongo();
})();