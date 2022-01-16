const DB_NAME = 'archive_upload_monitor';
const HOST = 'localhost';
const PORT = 27017;
const DB_URL =  `mongodb://${HOST}:${PORT}/${DB_NAME}`;

export const connection_config = {
    HOST,
    PORT,
    DB_NAME,
    DB_URL,
    options: {
        useNewUrlParser: true,
        useUnifiedTopology:true
    }
}