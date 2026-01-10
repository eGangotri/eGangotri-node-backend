import { ArchiveDownloadRequest } from '../models/ArchiveDownloadRequest';
import { ArchiveDownloadItem } from '../models/ArchiveDownloadItem';

export const createArchiveDownloadRequest = async (data: {
    runId: string;
    commonRunId: string;
    excelPath?: string;
    archiveUrl?: string;
    profileOrAbsPath: string;
    totalItems?: number;
}) => {
    return await ArchiveDownloadRequest.create({
        ...data,
        status: 'initiated'
    });
};

export const updateArchiveDownloadRequestStatus = async (runId: string, status: string, msg?: string) => {
    return await ArchiveDownloadRequest.findOneAndUpdate(
        { runId },
        { status, msg },
        { new: true }
    );
};

export const createArchiveDownloadItem = async (data: {
    runId: string;
    commonRunId: string;
    archiveUrl: string;
    fileName: string;
    filePath?: string;
    status?: 'queued' | 'failed' | 'success';
}) => {
    return await ArchiveDownloadItem.create({
        ...data,
        status: data.status || 'queued'
    });
};

export const updateArchiveDownloadItemStatus = async (
    runId: string,
    archiveUrl: string,
    fileName: string,
    status: 'queued' | 'failed' | 'success',
    error?: string,
    msg?: string,
    filePath?: string
) => {
    return await ArchiveDownloadItem.findOneAndUpdate(
        { runId, fileName }, // Use runId and fileName as composite key
        { status, error, msg, filePath },
        { upsert: true, new: true }
    );
};

export const getArchiveDownloadItemsByRunId = async (runId: string) => {
    return await ArchiveDownloadItem.find({ runId });
};

export const getArchiveDownloadRequests = async (page: number = 1, limit: number = 20) => {
    const skip = (page - 1) * limit;
    const filter = { deleted: { $ne: true } };
    const requests = await ArchiveDownloadRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const requestsWithCounts = await Promise.all(requests.map(async (req) => {
        const itemRunId = req.runId;

        // Using countDocuments instead of aggregate for better reliability
        const [total, success, failed, queued] = await Promise.all([
            ArchiveDownloadItem.countDocuments({ runId: itemRunId }),
            ArchiveDownloadItem.countDocuments({ runId: itemRunId, status: 'success' }),
            ArchiveDownloadItem.countDocuments({ runId: itemRunId, status: 'failed' }),
            ArchiveDownloadItem.countDocuments({ runId: itemRunId, status: 'queued' })
        ]);

        const itemCounts = { total, success, failed, queued };
        console.log(`Mapping runId ${itemRunId} with counts: ${JSON.stringify(itemCounts)}`);

        return Object.assign({}, req, { itemCounts });
    }));

    const total = await ArchiveDownloadRequest.countDocuments(filter);
    return {
        data: requestsWithCounts,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        monitorVersion: '1.2'
    };
};
