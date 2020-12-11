import * as mongoose from 'mongoose';

const DB_NAME = 'archive_upload_monitor';
const HOST = 'localhost';
const PORT = 27017;

export const connection = mongoose.createConnection(`mongodb://${HOST}:${PORT}/${DB_NAME}`);

