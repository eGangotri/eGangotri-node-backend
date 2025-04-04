import fs from 'fs-extra';
import path from 'path';
import winston from 'winston';
import dotenv from 'dotenv';
import { UploadItem } from './types';

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

export class FileRetriever {
    private static readonly PDF_REGEX = /\.pdf$/i;
    private static readonly ALL_EXTENSIONS_REGEX = /\.[^.]+$/i;
    private static folderMap: Map<string, string> | null = null;

    private static async loadFolderMap(): Promise<Map<string, string>> {
        if (this.folderMap) return this.folderMap;

        const userHome = process.env.HOME || process.env.USERPROFILE;
        const eGangotriDir = path.join(userHome!, 'egangotri');
        const localFoldersFile = path.join(eGangotriDir, 'local_folders.properties');
        
        // Create egangotri directory if it doesn't exist
        await fs.ensureDir(eGangotriDir);
        
        // Create default properties file if it doesn't exist
        if (!await fs.pathExists(localFoldersFile)) {
            const defaultContent = `# eGangotri Upload Folders Configuration
# Paths can be absolute or relative to SRC_ROOT

SRC_ROOT=D:/eGangotri/archive_items
DEST_ROOT=D:/eGangotri/archive_items_done
DEST_OTRO_ROOT=D:/eGangotri/archive_items_other

# Profile folders - customize these
# PROFILE1=profile1_folder
# PROFILE2=D:/absolute/path/to/profile2
`;
            await fs.writeFile(localFoldersFile, defaultContent, 'utf8');
            logger.info(`Created default local_folders.properties at ${localFoldersFile}`);
        }

        try {
            const content = await fs.readFile(localFoldersFile, 'utf8');
            const lines = content.split('\n');
            const map = new Map<string, string>();
            
            let srcRoot = '';
            
            for (const line of lines) {
                const [key, value] = line.split('=').map(s => s.trim());
                if (!key || !value) continue;
                
                if (key === 'SRC_ROOT') {
                    srcRoot = value;
                    continue;
                }
                
                if (!key.includes('.') && key !== 'DEST_ROOT' && key !== 'DEST_OTRO_ROOT') {
                    // If path is absolute, use it as is
                    if (path.isAbsolute(value) || value.includes(':')) {
                        map.set(key, value);
                    } else {
                        // Otherwise, make it relative to SRC_ROOT
                        map.set(key, path.join(srcRoot, value));
                    }
                }
            }
            
            this.folderMap = map;
            return map;
        } catch (error) {
            logger.error('Error loading folder map:', error);
            return new Map();
        }
    }

    private static async getIgnorePatterns(): Promise<string[]> {
        return process.env.IGNORE_PATTERNS ? 
            process.env.IGNORE_PATTERNS.split(',').map(p => p.trim().toLowerCase()) : 
            [];
    }

    private static async getIgnoreExtensions(): Promise<string[]> {
        return process.env.IGNORE_EXTENSIONS ? 
            process.env.IGNORE_EXTENSIONS.split(',').map(ext => ext.trim().toLowerCase()) : 
            [];
    }

    private static shouldIgnoreFile(filePath: string, ignorePatterns: string[], ignoreExtensions: string[]): boolean {
        const lowerPath = filePath.toLowerCase();
        const ext = path.extname(filePath).toLowerCase();
        
        // Check if file matches any ignore pattern
        if (ignorePatterns.some(pattern => lowerPath.includes(pattern))) {
            return true;
        }

        // Check if extension should be ignored
        if (ignoreExtensions.includes(ext)) {
            return true;
        }

        // Ignore hidden files
        if (path.basename(filePath).startsWith('.')) {
            return true;
        }

        return false;
    }

    static async getUploadableItems(profile: string, subjectDesc: string = ''): Promise<UploadItem[]> {
        const folderMap = await this.loadFolderMap();
        const folder = folderMap.get(profile.toUpperCase());
        
        if (!folder) {
            logger.error(`No folder found for profile: ${profile}`);
            return [];
        }

        if (!await fs.pathExists(folder)) {
            logger.error(`Folder does not exist: ${folder}`);
            return [];
        }

        const ignorePatterns = await this.getIgnorePatterns();
        const ignoreExtensions = await this.getIgnoreExtensions();
        const items: UploadItem[] = [];

        try {
            const files = await fs.readdir(folder, { withFileTypes: true });
            
            for (const file of files) {
                if (!file.isFile()) continue;

                const filePath = path.join(folder, file.name);
                
                // Skip if file should be ignored
                if (this.shouldIgnoreFile(filePath, ignorePatterns, ignoreExtensions)) {
                    continue;
                }

                // Only accept PDFs by default
                if (!this.PDF_REGEX.test(file.name)) {
                    continue;
                }

                items.push({
                    title: path.parse(file.name).name, // filename without extension
                    path: filePath,
                    archiveProfile: profile,
                    subject: subjectDesc || undefined
                });
            }

            // Sort items by path
            return items.sort((a, b) => a.path.localeCompare(b.path));

        } catch (error) {
            logger.error(`Error reading directory ${folder}:`, error);
            return [];
        }
    }

    static async getUploadableItemCount(profile: string): Promise<number> {
        const items = await this.getUploadableItems(profile);
        return items.length;
    }
}
