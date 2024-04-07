import { readFile, utils } from 'xlsx';
import { connectToMongo } from './dbService';
import { ArchiveItem } from '../models/ArchiveItem';
import { MongoError } from 'mongodb';

const ExcelHeaderToJSONMAPPING = {
    'Serial No.': 'serialNo',
    Link: 'link',
    'All Downloads Link Page': 'allDownloadsLinkPage',
    'Pdf Download Link': 'pdfDownloadLink',
    'Page Count': 'pageCount',
    'Original Title': 'originalTitle',
    'Title-Archive': 'titleArchive',
    Size: 'size',
    'Size Formatted': 'sizeFormatted',
    Subject: 'subject',
    Description: 'description',
    Date: 'date',
    Acct: 'acct',
    Identifier: 'identifier',
    Type: 'type',
    'Media Type': 'mediaType',
    'Email-User': 'emailUser'
}

const replaceExcelHeadersWithJsonKeys = (data: Object[]) => {
    return data.map((row: Object) => {
        const newRow = {};
        Object.keys(row).forEach((key) => {
            const dataRowKeyCorrespondingValue = row[key]
            const jsonHeader = ExcelHeaderToJSONMAPPING[key]
            newRow[jsonHeader] = dataRowKeyCorrespondingValue;
        });
        return newRow;
    });
}

const excelToMongo = () => {
    // Read the Excel file
    const workbook = readFile("C:\\tmp\\_data\\test\\drnaithani(15).xlsx");
    const sheetNameList = workbook.SheetNames;
    const data = utils.sheet_to_json(workbook.Sheets[sheetNameList[0]]);
    console.log("started inserting data...", JSON.stringify(data[0]));
    const newData = replaceExcelHeadersWithJsonKeys(data)
    console.log(`started inserting
    newData... ${JSON.stringify(newData[0])}`);


    connectToMongo(["forUpload"]).then(async () => {
        // Prepare operations for bulkWrite
        const operations = newData.map(document => ({
            insertOne: {
                document
            }
        }));

        return ArchiveItem.bulkWrite(operations, { ordered: false })
            .then(res => {
                printMongoTransactions(res)
            })
            .catch((err) => {
                if (err.code === 11000) { // Duplicate key error code
                    console.log('Some documents were not inserted due to duplicate keys');
                    printMongoTransactions(err.result, true);
                } else {
                    console.error(`err bulkWrite ArchiveItem ${err}`);
                }
            });
    });

}

const printMongoTransactions = (res: any, error = false) => {
    const msg = `Number of documents inserted (${error ? 'with duplication-filtering' : 'without error'}): 
    insertedCount: ${res.insertedCount}
    matchedCount ${res.matchedCount}
    modifiedCount: ${res.modifiedCount}
    deletedCount: ${res.deletedCount}
    upsertedCount: ${res.upsertedCount}
    upsertedIds count: ${Object.keys(res?.upsertedIds)?.length}
    insertedIds Intended count: ${Object.keys(res?.insertedIds)?.length}
    `
    console.log(msg);
}

excelToMongo();

// yarn run excelToMongo