import * as fs from 'fs';
import { DD_MM_YYYY_HH_MMFORMAT } from "../../utils/utils";
import moment from "moment";
import { ExcelHeaders } from './types';
import { excelToJson } from './ExcelUtils';

const _root = "E:\\_catalogWork\\_collation";
const treasureFolder = "Treasures 1"

const mainExcelPath = `${_root}\\_catExcels\\${treasureFolder}`
const mainExcelFileName = `${mainExcelPath}\\${fs.readdirSync(mainExcelPath)[0]}`;

const secondaryExcelPath = `${_root}\\forMerge\\${treasureFolder}`
const secondaryExcelFileName = `${secondaryExcelPath}\\${fs.readdirSync(secondaryExcelPath)[0]}`;

const timeComponent = moment(new Date()).format(DD_MM_YYYY_HH_MMFORMAT)

const combinedExcelPath = `${_root}\\merged\\${treasureFolder}`;

if (!fs.existsSync(combinedExcelPath)) {
    fs.mkdirSync(combinedExcelPath);
}
const combinedExcelFileName = `${combinedExcelPath}\\${treasureFolder}-Catalog-${timeComponent}`;

const mergeExcels = () => {
    const mainExcelData: ExcelHeaders[] = excelToJson(mainExcelFileName);
    const secondaryExcelData: ExcelHeaders[] = excelToJson(secondaryExcelFileName);
}

mergeExcels()