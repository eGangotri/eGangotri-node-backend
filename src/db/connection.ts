const production = true;
const DB_NAME = 'archive_upload_monitor';
const HOST = production?'egangotri:bcWbOF0rPGAU4BhJJdlGjVTdbs1xAboMl9poX68Qm4UOMusvdGds4JNxRPTb3RzqLaXoAGEI80H5P49dIfnmcg==@egangotri.mongo.cosmos.azure.com:':'localhost';
const PORT = production?'10255':27017;

const DB_URL = production?
'mongodb://egangotri:bcWbOF0rPGAU4BhJJdlGjVTdbs1xAboMl9poX68Qm4UOMusvdGds4JNxRPTb3RzqLaXoAGEI80H5P49dIfnmcg==@egangotri.mongo.cosmos.azure.com:10255/?ssl=true&retrywrites=false&maxIdleTimeMS=120000&appName=@egangotri@'
:`mongodb://${HOST}:${PORT}/${DB_NAME}`;

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