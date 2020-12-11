import * as connection from '../db/connection';
import * as fs from 'fs';
import * as csv from 'csv-parser';
import * as _ from 'underscore';
import { ItemsQueued } from '../models/itemsQueued';
import { v4 as uuidv4 } from 'uuid';

export async function processCSV(_file: string) {
    const uploadCycleId = uuidv4();
    fs.createReadStream(_file)
        .pipe(csv())
        .on('data', async (row) => {
            await extractDataAndCommitToDB(row, uploadCycleId);
        })
        .on('end', () => {
            console.log('CSV file successfully processed');
        });
}

export async function extractDataAndCommitToDB(row: any, uploadCycleId: string) {
    const rowArray = _.values(row);
    console.log(rowArray[0]);
    const iq = new ItemsQueued({
        archiveProfile: rowArray[0],
        uploadLink: rowArray[1],
        archivePath: rowArray[2],
        title: rowArray[3],
        uploadCycleId
    });

    await iq.save(function (err) {
        if (err) {
            console.log(`err saving ${rowArray[0]} ${uploadCycleId}`, err)
            return err;
        }
        console.log(`saved ${rowArray[0]} ${uploadCycleId}`)
    });
}
