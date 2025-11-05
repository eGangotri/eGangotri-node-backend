import { ScanningCenter } from "../models/scanningCenters";
import { getLimit } from "../routes/utils";

export async function getCentersAndLibraries() {
    const centers = await ScanningCenter.find({ isDeleted: { $ne: true } })
        .sort({ centerName: 1 })
        .limit(getLimit(null));
    return centers;
}


export async function addCentersAndLibraries(center: any) {
    const checkForDuplicate = await ScanningCenter.findOne({ centerName: center.centerName, isDeleted: { $ne: true } });
    if (checkForDuplicate) {
        return {
            success: false,
            message: "Center already exists",
            name: checkForDuplicate.centerName
        };
    }
    else {
        const _res = await center.save();
        return {
            success: true,
            _id: _res._id,
            centerName: _res.centerName
        };
    }
}

export async function softDeleteCenter(centerId: string, deletedBy?: string) {
    const center = await ScanningCenter.findById(centerId);
    if (!center) {
        return { success: false, message: "Center not found" };
    }
    if ((center as any).isDeleted) {
        return { success: true, message: "Center already deleted" };
    }
    (center as any).isDeleted = true;
    (center as any).deletedAt = new Date();
    if (deletedBy) {
        (center as any).deletedBy = deletedBy;
    }
    await center.save();
    return { success: true, message: "Center soft-deleted", _id: center._id };
}

export async function editCenter(centerId: string, updates: { centerName?: string; libraries?: string[] }) {
    const center = await ScanningCenter.findById(centerId);
    if (!center || (center as any).isDeleted) {
        return { success: false, message: "Center not found" };
    }
    if (updates.centerName) {
        const dup = await ScanningCenter.findOne({
            _id: { $ne: centerId },
            centerName: updates.centerName,
            isDeleted: { $ne: true }
        });
        if (dup) {
            return { success: false, message: "Center already exists", name: dup.centerName };
        }
        (center as any).centerName = updates.centerName;
    }
    if (Array.isArray(updates.libraries)) {
        (center as any).libraries = updates.libraries;
    }
    await center.save();
    return { success: true, _id: center._id, centerName: (center as any).centerName };
}

