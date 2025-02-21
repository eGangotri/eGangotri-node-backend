import * as mongoose from 'mongoose';

const schema = new mongoose.Schema(
    {
        uploadCycleId: { type: String, required: false },
        src: { type: String, required: true },
        dest: { type: String, required: true },
        destFolderOrProfile: { type: String, required: false },
        success: { type: Boolean, required: false },
        msg: { type: String, required: false },
        errorList: { type: [String], required: false },
        srcPdfsBefore: { type: Number, required: false },
        srcPdfsAfter: { type: Number, required: false },
        destFilesBefore: { type: Number, required: false },
        destFilesAfter: { type: Number, required: false },
        fileCollisionsResolvedByRename: { type: [String], required: false },
        filesMoved: { type: [String], required: false },
        filesAbsPathMoved: { type: [String], required: false },
        filesMovedNewAbsPath: { type: [String], required: false },
        reversed: { type: Boolean, required: false },
    }, {
    collection: 'File_Move_Tracker',
    timestamps: true
}
);

export const FileMoveTracker = mongoose.model('File_Move_Tracker', schema);


