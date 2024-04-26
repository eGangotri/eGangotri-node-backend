import { excelToJson } from "../cliBased/excel/ExcelUtils";

const callAksharamukha = async (body: Record<string, unknown>) => {
    const aksharaMukha = 'https://www.aksharamukha.com/api/convert';
    const response = await fetch(`http://aksharamukha-plugin.appspot.com/api/public?source=${body.source}&target=${body.target}&text=${body.text}&nativize=false`)
    const result = await response.text();
    console.log(result);
    return result;
}


const jsonBody = {
    "source": "IAST",
    "target": "RomanColloquial",
    "text": "Kriyā-Prayoga \nTantra-Kriyā \nĀgama-Nibandha \nKośa \nĀgama-Kriyā \nKriyā-Prayoga Āgama",
    "nativize": true,
    "postOptions": [],
    "preOptions": []
}

const convertExcel = (excelPath:string) => {
    const converted = excelToJson(excelPath);
    console.log(`excelToJson ${converted.length}`)
    console.log(`excelToJson ${JSON.stringify(converted[5])}`)

}
callAksharamukha(jsonBody);
convertExcel("C:\\Users\\chetan\\Downloads\\IFP Handlist Unicode.xlsx")