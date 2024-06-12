import { LOCAL_FOLDERS_PROPERTIES_FILE_FOR_SRC, getArchiveMetadataForProfile, isValidArchiveProfile } from '../archiveUpload/ArchiveProfileUtils';
import * as express from 'express';
import { getAllFileListingWithoutStats, getAllPDFFiles } from '../utils/FileStatsUtils';
import { createExcelV1FileForUpload } from './GradleLauncherUtil';
import { callAksharamukhaToRomanColloquial } from '../aksharamukha/convert';
import path from 'path';
import { ArchiveUploadExcelProps } from 'archiveDotOrg/archive.types';
import { ExcelV1Columns } from './types';

export const getJsonOfAbsPathFromProfile = async (profile: string, allNotJustPdfs: boolean) => {
    const profileFolder = LOCAL_FOLDERS_PROPERTIES_FILE_FOR_SRC.get(profile);
    console.log(`profileFolder ${profile}:${profileFolder} allNotJustPdfs ${allNotJustPdfs}`);

    if (!profileFolder) {
        throw new Error(`Profile '${profile}' not found. Please check the profile name and try again.`);
    }
    let filesForUpload = []
    if (allNotJustPdfs) {
        filesForUpload = await getAllFileListingWithoutStats({ directoryPath: profileFolder });
    } else {
        filesForUpload = await getAllPDFFiles(profileFolder);
    }
    console.log(`filesForUpload ${filesForUpload.length}`);

    const filesAsJson = filesForUpload.map((file) => {
        return {
            "absPath": file.absPath,
        }
    });
    return filesAsJson;
}

const extractV1Metadata = async (absPathAsJson: { absPath: string }, _metadata: ExcelV1Columns, script: string, useFolderNameAsDesc: boolean) => {
    const refined: ExcelV1Columns = { ...absPathAsJson };
    const absPathModified = refined['absPath'];
    const path = require('path');
    const fileName = path.parse(absPathModified).name;
    let description = _metadata.description;
    if (script?.length > 0 && findNonAscii(fileName)) {
        const toRomanCol = await callAksharamukhaToRomanColloquial(script, fileName);
        description = `${description}. '${toRomanCol}'`;
    }

    if (useFolderNameAsDesc) {
        const parentDir = path.dirname(absPathModified);
        let folderName = path.basename(parentDir);
        description = `${description}, '${folderName}'`;
        if (script?.length > 0 && findNonAscii(folderName)) {
            const toRomanCol = await callAksharamukhaToRomanColloquial(script, folderName);
            description = `${description}, '${toRomanCol}'`;
        }
    }

    refined['subject'] = _metadata.subject;
    refined['description'] = description;
    refined['creator'] = _metadata.creator;
    refined['uploadedFlag'] = false;
    return refined;
}

export const generateV1ExcelsForMultipleProfiles = async (profiles: string, script: string, allNotJustPdfs: boolean = false, useFolderNameAsDesc = false) => {
    const result = []
    const errors = []
    const _profilesAsArray = profiles.includes(",") ? profiles?.split(",").map((x: string) => x.trim()) : [profiles.trim()];
    for (const profile of _profilesAsArray) {
        if(!isValidArchiveProfile(profile)){
            console.log(`Profile ${profile} is not valid. Please check the profile name and try again.`)
            errors.push({
                success: false,
                msg: `Profile ${profile} is not valid. Please check the profile name and try again.`
            });
            continue;
        }
        try {
            const _metadata = getArchiveMetadataForProfile(profile);
            const absPathsAsJsons = await getJsonOfAbsPathFromProfile(profile, allNotJustPdfs);
            const _refinedMetadata = [];
            for (const absPathAsJson of absPathsAsJsons) {
                const _refined: ExcelV1Columns = await extractV1Metadata(absPathAsJson, _metadata, script, useFolderNameAsDesc);
                _refinedMetadata.push(_refined);
            }
            const excelFileName = createExcelV1FileForUpload("", _refinedMetadata,
                `absPaths-as-excel-v1-${profile}-${_refinedMetadata.length}`)
            result.push({
                profile: profile,
                excelFileName: excelFileName,
                length: _refinedMetadata.length,
                _refinedMetadata
            })
        }
        catch (err: any) {
            console.log('Error:', err);
            errors.push({
                success: false,
                msg: `Error while creating Excel file V1 for profile ${profile}`,
                response: `${err.message}`
            });
        }
    }

    return {
        msg: `Created ${result.length} Excel file(s) with (${result.map((res) => res.length)}) items in each file.`,
        profiles: result.map((res) => res.profile),
        excelFileNames: result.map((res) => res.excelFileName),
        info: "Excel-Path(s) created will be stored in Local Storage",
        ...result,
        ...errors
    }
}
export const findNonAscii = (str: string) => {
    return str.match(/[^\x00-\x7F]/g);
}