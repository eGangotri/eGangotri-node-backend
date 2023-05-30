"use strict";
console.log("Welcome to PDF Converter")
export const CHUNK_SIZE = 5;
export const ADD_INTRO_PDF = true;
export const INTRO_PAGE_ADJUSTMENT = ADD_INTRO_PDF ? 1 : 0
export let GENERATION_REPORT: Array<string> = [];
export const REDUNDANT_FOLDER = "C:\\tmp\\redundant";
export const HANDLE_CHECKSUM = true;
export function printReport(){
    GENERATION_REPORT.map((rep,index) =>{
        return `${index}. ${rep}`
    });
    console.log(GENERATION_REPORT)
}
export function addReport(report:any){
    GENERATION_REPORT.push(report)
    console.log(report)
}