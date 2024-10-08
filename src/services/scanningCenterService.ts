import { ScanningCenter } from "../models/scanningCenters";
import { getLimit } from "../routes/utils";

export async function getCentersAndLibraries() {
    const centers = await ScanningCenter.find({})
        .sort({ createdAt: -1 })
        .limit(getLimit(null));
    return centers;
}


export async function addCentersAndLibraries(center: any) {
    const checkForDuplicate = await ScanningCenter.findOne({ centerName: center.centerName });
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

