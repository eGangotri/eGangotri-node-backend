"use strict";
exports.__esModule = true;
exports.ItemsQueued = void 0;
var mongoose = require("mongoose");
var schema = new mongoose.Schema({
    archiveProfile: { type: String, required: true },
    uploadLink: { type: String, required: true },
    localPath: { type: String, required: true },
    title: { type: String, required: true },
    uploadCycleId: { type: String, required: true },
    csvName: { type: String, required: true },
    datetimeUploadStarted: { type: Date, required: true }
}, {
    collection: 'Items_Queued',
    timestamps: true
});
exports.ItemsQueued = mongoose.model('Items_Queued', schema);
