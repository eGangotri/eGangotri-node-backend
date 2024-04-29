import { excelToJson, jsonToExcel } from "../../cliBased/excel/ExcelUtils";
export interface FipExcelOne {
    rowCounter: number;
    absPath: string;
    folder: string;
    fileName: string;
    ext: string;
}
export interface FipExcelTwo {
    identifier: string;
    material: string;
    handlist: string;
    title: string;
    subject: string;
    script: string;
}


export interface FipExcelThree {
    absPath?: string;
    subject?: string;
    description?: string;
    creator?: string;
}

const base = "D:\\FIP\\_IFP\\_IFP"
/**
 * 1	D:\FIP\_IFP Palmleaf Manuscripts PDF All\RE00999.pdf	D:\FIP\_IFP Palmleaf Manuscripts PDF All	RE00999.pdf	.pdf
2	D:\FIP\_IFP Palmleaf Manuscripts PDF All\RE01000.pdf	D:\FIP\_IFP Palmleaf Manuscripts PDF All	RE01000.pdf	.pdf
3	D:\FIP\_IFP Palmleaf Manuscripts PDF All\RE03089.pdf	D:\FIP\_IFP Palmleaf Manuscripts PDF All	RE03089.pdf	.pdf

 */
const excelFirst = `${base}\\_IFP Palmleaf Manuscripts PDF All_MegaList_pdfs_only-29-Apr-2024-08-51.xlsx`;
const excelSecond = `${base}\\IFP Handlist Unicode-sanitized.xlsx`

// RE03175	Palm-leaf	Manuscript hand list – 1 2	Iraniya natakam	Tamil-lit.	Tamil
// RE03176	Palm-leaf	Manuscript hand list – 1 2	Rattinach churukkam	Tamil-lit.	Tamil
// RE03177	Palm-leaf	Manuscript hand list – 1 2	Vaittiya nul	Vaidya	Tamil

const mainExcelData: FipExcelOne[] = excelToJson(excelFirst);
const secondaryExcelData: FipExcelTwo[] = excelToJson(excelSecond);
console.log(`mainExcelData ${JSON.stringify(mainExcelData[0])}`)
console.log(`mainExcelData ${JSON.stringify(secondaryExcelData[0])}`)

const findCorrespondingExcelHeader = (firstExcel: FipExcelOne, secondExcel: FipExcelTwo[]): FipExcelThree => {
    let firstExcelFileName = firstExcel.fileName

    const matchingItem = secondExcel?.find((secondExcel: FipExcelTwo) => {
        return firstExcelFileName?.match(secondExcel.identifier)
    })
    if(matchingItem){

    return {
        absPath: firstExcel.absPath,
        subject: `${matchingItem.handlist}, ${matchingItem.material}, ${matchingItem.script} ${matchingItem.subject}, FIP-EFEO`,
        description: `${matchingItem.title} ${firstExcel?.fileName} ${matchingItem.handlist}, ${matchingItem.material}, ${matchingItem.script} ${matchingItem.subject}, FIP-EFEO`,
        creator: "FIP-EFEO"
    };
}
return {}
}
let combinedExcel: FipExcelThree[] = mainExcelData.map(x => findCorrespondingExcelHeader(x, secondaryExcelData));

console.log(`Combining JSON Data: ${JSON.stringify(combinedExcel.splice(0,5))}`)
jsonToExcel(combinedExcel,`${base}//fip-uploadables.xlsx`)