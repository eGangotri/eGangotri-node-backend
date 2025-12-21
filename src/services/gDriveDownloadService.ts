import GDriveDownload from "../models/GDriveDownloadHistory";

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


export const softDeleteGDriveDownload = async (runId: string) => {
    const gDriveDownload = await GDriveDownload.findOne({ runId });
    if (!gDriveDownload) {
        console.log(`softDeleteGDriveDownload/${runId}:GDriveDownload not found`);
        return false;
    }

    gDriveDownload.deleted = true;
    const updatedGDriveDownload = await gDriveDownload.save();
    console.log(`softDeleteGDriveDownload:updatedGDriveDownload/${runId}: ${JSON.stringify(updatedGDriveDownload)}`);
    if (!updatedGDriveDownload) {
        console.log(`softDeleteGDriveDownload:GDriveDownload not found`);
        return false;
    }
    return true;
}