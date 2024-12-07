
export const googleDriveLinkFromId = (fileId: string) => {
    return `https://drive.google.com/file/d/${fileId}/view?usp=drive_link`
}

export const getGDrivePdfDownloadLink = (driveId: string) => {
    return `https://drive.usercontent.google.com/download?id=${driveId}&export=download&authuser=0&confirm=t`
}

//Sample:  https://drive.google.com/file/d/11ovaMqoQxVe06gzjPmLkFlbk2-ghHSrr/view?usp=drivesdk
//Sample 2: //https://docs.google.com/spreadsheets/d/1rj3-umAmHplgstGj8QL3hhe6y4fuzwb4/edit?usp=drivesdk&ouid=102521773827228978854&rtpof=true&sd=true

const regex1 = /\/d\/([^/]+)\/(view|edit)/;

//Sample: https://drive.google.com/drive/folders/1eJnYKRgZIyPO2s-BgsJ4ozhCEuH3i_lQ?usp=drive_link
const regex2 = /\/folders\/([^/?]+)/;

export function extractGoogleDriveId(folderIdOrUrl: string) {
    folderIdOrUrl = folderIdOrUrl.trim()
    try {
        if (folderIdOrUrl.startsWith("http")) {
            folderIdOrUrl = folderIdOrUrl?.split("?")[0]
            let match: RegExpMatchArray | null;
            if (folderIdOrUrl.includes("/d/")) {
                match = folderIdOrUrl.match(regex1);
            }
            else {
                match = folderIdOrUrl.match(regex2);
            }

            if (match) {
                return match[1];
            } else {
                return "";
            }
        }
    }
    catch (err: any) {
        console.log("Error in extractGoogleDriveId", err.message);
    }
    return folderIdOrUrl;

}