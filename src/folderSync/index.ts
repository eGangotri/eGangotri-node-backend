import * as FileUtils from "../imgToPdf/utils/FileUtils";
import { PdfStats } from "../imgToPdf/utils/types";
import * as _ from 'lodash';


const sync = async (src: string, dest: string) => {
    console.log(`sync src ${src}`);
    const srcJsonArray = await FileUtils.getAllPDFFiles(src)

    FileUtils.incrementRowCounter();

    console.log(`sync dest ${dest}`);
    const destJsonArray = await FileUtils.getAllPDFFiles(dest)


    const umMatchedItemsLtoR: Array<PdfStats | undefined> = []
    const umMatchedItemsRToL: Array<PdfStats | undefined> = []

    matchOneWay(srcJsonArray, src, destJsonArray, dest, umMatchedItemsLtoR);
    matchOneWay(destJsonArray, dest, srcJsonArray, src, umMatchedItemsRToL);
    for (let i = 0; i < umMatchedItemsLtoR.length; i++) {
        console.log(`L->R:${i + 1} ${JSON.stringify(umMatchedItemsLtoR[i]?.absPath)}`)
     }
     for (let i = 0; i < umMatchedItemsRToL.length; i++) {
        console.log(`R-L:${i + 1} ${JSON.stringify(umMatchedItemsRToL[i]?.absPath)}`)
     }
   
     console.log(`'${umMatchedItemsLtoR.map(x=>x?.absPath)?.join(",'")}'`)
     console.log(`'${umMatchedItemsRToL.map(x=>x?.absPath)?.join(",'")}'`)
}

const matchOneWay = (firstJsonArray: PdfStats[], firstFolderRoot: string, secondJsonArray: PdfStats[], secondFolderRoot: string, umMatchedItems: Array<PdfStats | undefined>) => {
    const matchedMap = firstJsonArray.map(pdfStat => findMatching(pdfStat, firstFolderRoot, secondJsonArray, secondFolderRoot,umMatchedItems));
    const matched = matchedMap.filter(y => !_.isEmpty(y));
    const unmatched = matchedMap.filter(y => _.isEmpty(y));
    console.log(`
    Json Array-1:${firstJsonArray.length}
    Json Array-2:${secondJsonArray.length}
    Diff:${firstJsonArray.length - secondJsonArray.length}
    MatchedMap-1:${matchedMap.length}
    Matched:${matched.length}
    Unmatched:${unmatched.length}
    Unmatched Length:${umMatchedItems.length}
    `)


    const crit1 = (firstJsonArray.length - secondJsonArray.length) === 0;
    const crit2 = (firstJsonArray.length - matched.length) === 0;
    const crit3 = unmatched.length === 0

    console.log(`${(crit1 === crit2 && crit2 === crit3 && crit3 === true) ? "In Sync" : "Missing Items detected"}`);
    for (let i = 0; i < matched.length; i++) {
        // console.log(`${i + 1} ${JSON.stringify(matched[i]?.fileName)}`)
     }
 
}
const getRelativePath = (rootFolder: string, fileAbsPath: string) => {
    return fileAbsPath.replace(rootFolder, '');
}

const findMatching = (src: PdfStats, srcRoot: string, dest: PdfStats[], destRoot: string, umMatchedItems: Array<PdfStats | undefined>) => {
    const relativePath = getRelativePath(srcRoot, src.absPath);
    const _found = dest.find(pdfStat => relativePath === getRelativePath(destRoot, pdfStat.absPath))
    //console.log(`${JSON.stringify(_found)}`) 
    if (_.isEmpty(_found)) {
        umMatchedItems.push(src)
    }
    return _found
}

const _root = "Otro-1-Otro-2\\Otro-2"
const _src = `D:\\${_root}`
const _dest = `F:\\${_root}`;

sync(_src, _dest)
//yarn run syncFolders