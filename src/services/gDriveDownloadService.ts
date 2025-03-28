import GDriveDownload from "../models/GDriveDownloadHistorySchema";

export const markVerifiedForGDriveDownload = async (id: string, success: boolean) => {
    const gDriveDownload = await GDriveDownload.findById(id);
    if (!gDriveDownload) {
        console.log(`markVerificationGDriveDownload/${id}:GDriveDownload not found`);
        return false;
    }

    gDriveDownload.verify = success;
    const updatedGDriveDownload = await gDriveDownload.save();
    console.log(`markVerificationGDriveDownload:updatedGDriveDownload/${id}: ${JSON.stringify(updatedGDriveDownload)}`);
    if (!updatedGDriveDownload) {
        console.log(`markVerificationGDriveDownload:GDriveDownload not found`);
        return false;
    }
    return true;
}
