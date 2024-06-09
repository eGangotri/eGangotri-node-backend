import { LOCAL_FOLDERS_PROPERTIES_FILE_FOR_SRC, getArchiveMetadataForProfile } from '../archiveUpload/utils';
import * as express from 'express';
import { getAllFileListingWithoutStats, getAllPDFFiles } from '../utils/FileStatsUtils';
import { createExcelV1FileForUpload } from './GradleLauncherUtil';
import { callAksharamukhaToRomanColloquial } from '../aksharamukha/convert';
import path from 'path';

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

export const generateV1ExcelsForMultipleProfiles = async (profiles: string, script: string, allNotJustPdfs:boolean = false, useFolderNameAsDesc = false) => {
    const result = []
    const _profilesAsArray = profiles.includes(",") ? profiles?.split(",").map((x: string) => x.trim()) : [profiles.trim()];
    for (const profile of _profilesAsArray) {
        try {
            const _metadata = getArchiveMetadataForProfile(profile);
            const absPathsAsJsons = await getJsonOfAbsPathFromProfile(profile, allNotJustPdfs);
            for (const absPathAsJson of absPathsAsJsons) {
                const absPathModified = absPathAsJson['absPath'].replace(/\\/g, "\\\\");
                const fileName = path.basename(absPathModified);
                let description = _metadata.description;
                if (script?.length > 0 && findNonAscii(fileName)) {
                    const toRomanCol = await callAksharamukhaToRomanColloquial(script, fileName);
                    description = `${description}. ${toRomanCol}`;
                }

                if (useFolderNameAsDesc) {
                    const folderName = path.dirname(absPathModified);
                    description = `${description}, ${folderName}`;

                    if (script?.length > 0 && findNonAscii(folderName)) {
                        const toRomanCol = await callAksharamukhaToRomanColloquial(script, folderName);
                        description = `${description}, ${toRomanCol}`;
                    }
                }
                console.log(`final desc: ${description}`);

                absPathAsJson['subject'] = _metadata.subjects;
                absPathAsJson['description'] = description;
                absPathAsJson['creator'] = _metadata.creator;
            }
            const excelFileName = createExcelV1FileForUpload("", absPathsAsJsons,
                `absPaths-as-excel-v1-${profile}-${absPathsAsJsons.length}`)
            result.push({
                profile: profile,
                excelFileName: excelFileName,
                length: absPathsAsJsons.length,
                absPathsAsJsons
            })
        }
        catch (err: any) {
            console.log('Error:', err);
            result.push({
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
        info: "Excel-Path stored in Local Storage"
    }
}
export const findNonAscii = (str: string) => {
    return str.match(/[^\x00-\x7F]/g);
}