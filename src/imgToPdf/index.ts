"use strict";
console.log("Welcome to PDF Converter")
export const CHUNK_SIZE = 5;
export const ADD_INTRO_PDF = true;
export const INTRO_PAGE_ADJUSTMENT = ADD_INTRO_PDF ? 1 : 0
export let GENERATION_REPORT: Array<string> = [];
export const REDUNDANT_FOLDER = "C:\tmp\redundant";
export function printReport(){
    GENERATION_REPORT.forEach((rep,index) =>{
        console.log(`${index}. ${rep}`) 
    });
}