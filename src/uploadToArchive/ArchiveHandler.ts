import puppeteer, { Browser, Page } from 'puppeteer';
import { ArchiveCredentials, UploadConfig, UploadItem, UploadResult } from './types';
import { ARCHIVE_LOGIN_URL, ARCHIVE_UPLOAD_URL, DEFAULT_CONFIG, SELECTORS } from './config';
import path from 'path';
import fs from 'fs-extra';
import winston from 'winston';

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

export class ArchiveHandler {
    private browser: Browser | null = null;
    private config: UploadConfig;
    private uploadCounter = 0;
    private totalItems = 0;

    constructor(config: Partial<UploadConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    async initialize(): Promise<void> {
        this.browser = await puppeteer.launch({
            headless: false,
            executablePath: this.config.chromePath,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    }

    async login(credentials: ArchiveCredentials): Promise<boolean> {
        if (!this.browser) throw new Error('Browser not initialized');

        const page = await this.browser.newPage();
        await page.goto(ARCHIVE_LOGIN_URL);

        try {
            // Wait for login form elements
            await page.waitForSelector('input[name="username"]');
            await page.waitForSelector('input[name="password"]');
            await page.waitForSelector('input[name="submit-to-login"]');

            // Fill in credentials
            await page.type('input[name="username"]', credentials.username);
            await page.type('input[name="password"]', credentials.password);
            console.log(`Filled in credentials: ${credentials.username} / ${credentials.password}`);
            // Click login button
            await page.click('input[name="submit-to-login"]');
            
            // Wait for navigation and check if login was successful
            await page.waitForNavigation({ waitUntil: 'networkidle0' });
            
            // Check if we're redirected to the logged-in state
            const currentUrl = page.url();
            if (currentUrl.includes('login')) {
                logger.error('Login failed - still on login page');
                return false;
            }

            return true;
        } catch (error) {
            logger.error('Login error:', error);
            return false;
        }
    }

    private async uploadSingleItem(page: Page, item: UploadItem): Promise<boolean> {
        try {
            await page.goto(ARCHIVE_UPLOAD_URL);

            // Wait for upload button and send file
            await page.waitForSelector(`.${SELECTORS.CHOOSE_FILES_BUTTON}`);
            const [fileChooser] = await Promise.all([
                page.waitForFileChooser(),
                page.click(`.${SELECTORS.CHOOSE_FILES_BUTTON}`)
            ]);
            await fileChooser.accept([item.path]);

            // Handle license
            await page.waitForSelector(`#${SELECTORS.LICENSE_PICKER_DIV}`);
            await page.click(`#${SELECTORS.LICENSE_PICKER_DIV}`);
            await page.click(`#${SELECTORS.LICENSE_PICKER_RADIO_OPTION}`);

            // Handle collection for non-PDF files
            if (!item.path.toLowerCase().endsWith('.pdf') && !item.collection) {
                await page.waitForSelector(`#${SELECTORS.COLLECTION_DROPDOWN}`);
                await page.click(`#${SELECTORS.COLLECTION_DROPDOWN}`);
                await page.select(`[name="${SELECTORS.MEDIA_TYPE}"]`, 'data:opensource_media');
            }

            // Set custom identifier if provided
            if (item.archiveItemId) {
                await page.waitForSelector(`#${SELECTORS.PAGE_URL}`);
                await page.click(`#${SELECTORS.PAGE_URL}`);
                await page.type(`.${SELECTORS.PAGE_URL_INPUT}`, item.archiveItemId);
                await page.keyboard.press('Enter');

                // Handle potential alert
                try {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    await page.keyboard.press('Enter');
                } catch (e) {
                    // Alert might not appear, ignore
                }
            }

            // Click upload button and wait for confirmation
            await page.waitForSelector(`#${SELECTORS.UPLOAD_BUTTON}`);
            await page.click(`#${SELECTORS.UPLOAD_BUTTON}`);
            
            this.uploadCounter++;
            logger.info(`Document #${this.uploadCounter}/${this.totalItems} sent for upload: ${item.title}`);
            
            return true;
        } catch (error) {
            logger.error(`Error uploading ${item.title}:`, error);
            return false;
        }
    }

    async uploadItems(items: UploadItem[]): Promise<UploadResult> {
        if (!this.browser) throw new Error('Browser not initialized');

        this.totalItems = items.length;
        const result: UploadResult = {
            success: 0,
            failures: 0,
            items: []
        };

        let failureCount = 0;
        const pages: Page[] = [];

        try {
            // Upload first item in initial page
            const firstPage = await this.browser.newPage();
            pages.push(firstPage);
            const firstSuccess = await this.uploadSingleItem(firstPage, items[0]);
            result.items.push({
                path: items[0].path,
                success: firstSuccess
            });
            if (firstSuccess) result.success++; else result.failures++;

            // Upload remaining items in new tabs
            for (let i = 1; i < items.length; i++) {
                if (failureCount > this.config.maxUploadFailures) {
                    throw new Error(`Too many upload failures (${failureCount}). Stopping.`);
                }

                const page = await this.browser.newPage();
                pages.push(page);
                const success = await this.uploadSingleItem(page, items[i]);
                
                result.items.push({
                    path: items[i].path,
                    success
                });

                if (success) result.success++;
                else {
                    result.failures++;
                    failureCount++;
                }

                // Small delay between uploads
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        } catch (error) {
            logger.error('Upload process error:', error);
        } finally {
            // Close all pages except the first one
            for (let i = 1; i < pages.length; i++) {
                await pages[i].close();
            }
        }

        return result;
    }

    async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}
