import { ArchiveHandler } from './ArchiveHandler';
import { FileRetriever } from './FileRetriever';
import { UploadItem } from './types';
import path from 'path';
import fs from 'fs-extra';
import winston from 'winston';
import dotenv from 'dotenv';
import os from 'os';

dotenv.config();

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'upload.log' })
    ]
});

async function main() {
    try {
        // Get arguments
        const args = process.argv.slice(2);
        let profiles = args;
        let subjectDesc = '';

        // Check for subject description
        const subjectDescIndex = args.findIndex(arg => arg.toLowerCase().startsWith('subjectdesc='));
        if (subjectDescIndex !== -1) {
            subjectDesc = args[subjectDescIndex].split('=')[1];
            profiles = args.filter((_, index) => index !== subjectDescIndex);
        }

        if (!profiles.length) {
            logger.error('No profiles specified');
            return;
        }

        // Initialize archive handler
        const handler = new ArchiveHandler({
            chromePath: process.env.CHROME_PATH,
            defaultSubjectDesc: subjectDesc
        });

        await handler.initialize();

        // Login using credentials from properties file
        const credentials = readArchiveCredentials(profiles[0]);
        console.log(`Using credentials: ${credentials.username} / ${credentials.password}`);    
        const loginSuccess = await handler.login({
            username: credentials.username,
            password: credentials.password
        });

        if (!loginSuccess) {
            logger.error('Login failed');
            return
        }

        // Process each profile
        for (const profile of profiles) {
            logger.info(`Processing profile: ${profile}`);
            
            // Get files to upload (you'll need to implement this based on your file structure)
            const uploadItems: UploadItem[] = await getUploadableItems(profile, subjectDesc);
            
            if (!uploadItems.length) {
                logger.info(`No files to upload for profile ${profile}`);
                continue;
            }
            console.log(`Found ${uploadItems.length} files to upload for profile ${profile}`);  
            // Upload files
            const result = await handler.uploadItems(uploadItems);
            
            logger.info(`Upload results for ${profile}:`, {
                total: uploadItems.length,
                successful: result.success,
                failed: result.failures
            });
        }

        await handler.close();
    } catch (error) {
        logger.error('Error in main process:', error);
        return
    }
}

function readArchiveCredentials(profile: string): { username: string; password: string } {
    const homeDir = os.homedir();
    const propsPath = path.join(homeDir, 'eGangotri', 'archiveLogins.properties');
    console.log(`Checking for properties file at: ${propsPath}`)
    if (!fs.existsSync(propsPath)) {
        throw new Error('archiveLogins.properties file not found in USER_HOME/eGangotri directory');
    }
    
    const content = fs.readFileSync(propsPath, 'utf-8');
    const lines = content.split('\n');
    
    const profileLine = lines.find(line => line.startsWith(`${profile}=`));
    const kutaLine = lines.find(line => line.startsWith('kuta='));
    
    if (!profileLine || !kutaLine) {
        throw new Error('Required credentials not found in properties file');
    }
    
    const username = profileLine.split('=')[1].trim();
    const password = kutaLine.split('=')[1].trim();
    console.log('Found lines in properties file:')
    console.log(`Profile line: ${profileLine}`)
    console.log(`Kuta line: ${kutaLine}`)
    console.log(`Username: ${username}, Password: ${password}`)
    
    return { username, password };
}

async function getUploadableItems(profile: string, subjectDesc: string): Promise<UploadItem[]> {
    return FileRetriever.getUploadableItems(profile, subjectDesc);
}

if (require.main === module) {
    main().catch(error => {
        logger.error('Unhandled error:', error);
        return
    });
}
