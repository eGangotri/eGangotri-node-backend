import { createLogger, format, transports } from 'winston';
import * as os from 'os';
import {  createDirIfNotExists } from 'utils/FileUtils';

const { combine, timestamp, printf } = format;

const logFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level}]: ${message}`;
});

const homeDirectory = os.homedir();
const logsDirectory = `${homeDirectory}/egangotri/logs`;

const now = new Date();
const weekYearSuffix = getWeekOfYear(now);

createDirIfNotExists(logsDirectory);

const logger = createLogger({
    level: 'info',
    format: combine(
        timestamp(),
        logFormat
    ),
    transports: [
        new transports.File({ filename: `${logsDirectory}/node-be-${weekYearSuffix}.log` }),
        new transports.Console()
    ]
});

function getWeekOfYear(date: Date): string {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const weekNumber = Math.ceil((((date.getTime() - startOfYear.getTime()) / 86400000) + startOfYear.getDay() + 1) / 7);
    return `Week-${weekNumber}-${date.getFullYear()}`;
}

export default logger;
