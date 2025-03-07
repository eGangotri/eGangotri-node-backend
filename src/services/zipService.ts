import * as fs from 'fs';
import archiver from 'archiver';
import * as path from 'path';
import { getAllZipFiles } from '../utils/FileStatsUtils';
import * as yauzl from 'yauzl';
import { checkFolderExistsAsync, createFolderIfNotExistsAsync } from '../utils/FileUtils';

const UNZIP_FOLDER = path.sep + "-unzipped";

export async function zipFiles(
    filePaths: string[],
    outputZipPath: string,
    rootDirToMaintainOrigFolderOrder: string = ""
): Promise<void> {
    const output = fs.createWriteStream(outputZipPath);
    const archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level.
    });

    // Handle the 'close' event when the archive is finalized
    output.on('close', () => {
        console.log(`Archive ${outputZipPath} created successfully. Total bytes: ${archive.pointer()}`);
    });

    // Handle errors in the archive process
    archive.on('error', (err) => {
        throw err; // Throw the error to be caught by the caller
    });

    // Pipe the archive data to the output file
    archive.pipe(output);

    // Add files to the archive
    filePaths.forEach((filePath) => {
        if (rootDirToMaintainOrigFolderOrder === "") {
            const fileName = filePath.split(path.sep).pop(); // Extract the file name
            if (fileName) {
                archive.file(filePath, { name: fileName });
            }
        } else {
            console.log(`filePath: ${filePath}, rootDirToMaintainOrigFolderOrder: ${rootDirToMaintainOrigFolderOrder}`);
            const relativePath = filePath.split(rootDirToMaintainOrigFolderOrder).pop(); // Use the provided root directory
            if (relativePath) {
                archive.file(filePath, { name: relativePath });
            }
        }
    });

    // Finalize the archive
    await archive.finalize();
}

function unzipFiles(filePath: string, outputDir: string): Promise<void> {
    return new Promise((resolve, reject) => {
        yauzl.open(filePath, { lazyEntries: true }, (err, zipfile) => {
            if (err) {
                console.error(`received error in yauzl: ${JSON.stringify(err)}`);
                return reject(err);
            }

            const writeStreams = new Set<fs.WriteStream>();
            let hasError = false;

            zipfile.readEntry();

            zipfile.on("entry", async (entry) => {
                // Normalize the entry filename to use OS-specific path separators
                const normalizedFileName = entry.fileName.split('/').join(path.sep);
                const outputPath = path.join(outputDir, normalizedFileName);

                // Create directory for entry if needed
                if (/\/$/.test(normalizedFileName)) {
                    // Directory entry
                    await createFolderIfNotExistsAsync(outputPath);
                    zipfile.readEntry(); // Continue to the next entry
                } else {
                    // File entry
                    try {
                        // Ensure the output directory exists
                        await createFolderIfNotExistsAsync(path.dirname(outputPath));

                        zipfile.openReadStream(entry, (err, readStream) => {
                            if (err || hasError) {
                                hasError = true;
                                return reject(err);
                            }

                            const writeStream = fs.createWriteStream(outputPath);
                            writeStreams.add(writeStream);

                            writeStream.on("finish", () => {
                                writeStreams.delete(writeStream);
                                zipfile.readEntry(); // Continue to the next entry
                            });

                            writeStream.on("error", (err) => {
                                hasError = true;
                                console.error(`Error writing file ${normalizedFileName}: ${err}`);
                                // Clean up all write streams
                                writeStreams.forEach(stream => {
                                    stream.destroy();
                                    // Delete the partial file
                                    fs.unlink(outputPath, () => {});
                                });
                                reject(err);
                            });

                            readStream.pipe(writeStream);
                        });
                    } catch (err) {
                        hasError = true;
                        reject(err);
                    }
                }
            });

            zipfile.on("end", () => {
                if (!hasError) {
                    console.log(`Successfully extracted all files to ${outputDir}`);
                    resolve();
                }
            });

            zipfile.on("error", (err) => {
                hasError = true;
                console.error(`Error in zip file processing: ${err}`);
                reject(err);
            });
        });
    });
}

import { promisify } from 'util';

const openZip = promisify(yauzl.open);

export async function unzipAllFilesInDirectory(pathToZipFiles: string,
    _unzipHere: string = ""):
    Promise<{
        success_count: number,
        error_count: number,
        unzipFolder: string,
        error_msg: string[]
    }> {
    let error_count = 0;
    let success_count = 0;
    const error_msg: string[] = [];
    try {
        const _zipFiles = await getAllZipFiles(pathToZipFiles);
        if (!_unzipHere || _unzipHere?.trim() === "") {
            _unzipHere = path.join(pathToZipFiles, UNZIP_FOLDER);
        }
        let idx = 0;
        for (const zipFile of _zipFiles) {
            try {
                const outputDir = path.join(_unzipHere, path.basename(zipFile.absPath, '.zip'));
                console.log(`checking ${zipFile.absPath} for ${outputDir}`)
                await createFolderIfNotExistsAsync(outputDir)
                console.log(`${++idx}). unzipping ${zipFile.absPath} to ${outputDir} `)
                await unzipFiles(zipFile.absPath, outputDir);
                console.log(`Unzipped ${zipFile.absPath} to ${outputDir}`);
                success_count++
            }
            catch (error) {
                const _err = `Error while unzipping ${zipFile.absPath} : ${JSON.stringify(error)} `;
                console.log(_err);
                error_count++;
                error_msg.push(_err)
            }
        }
    }
    catch (error) {
        console.log(`Error while getting zip files: ${JSON.stringify(error)} `);
        error_count++;
        error_msg.push(`Error while getting zip files: ${JSON.stringify(error)} `);
    }
    return {
        success_count,
        error_count,
        error_msg,
        unzipFolder: _unzipHere
    };
}

export async function verifyUnzipSuccessInDirectory(pathToZipFiles: string,
    _unzipHere: string = "",
    ignoreFolder = ""):
    Promise<{
        success_count: number,
        error_count: number,
        unzipFolder: string,
        error_msg: string[]
    }> {
    let error_count = 0;
    let success_count = 0;
    const error_msg: string[] = [];
    try {
        const _zipFiles = await getAllZipFiles(pathToZipFiles);
        if (!_unzipHere || _unzipHere === "") {
            _unzipHere = path.join(pathToZipFiles, UNZIP_FOLDER);
        }

        for (const zipFile of _zipFiles) {
            if (zipFile.absPath.includes(ignoreFolder) ||
                zipFile.absPath.includes(UNZIP_FOLDER)) {
                console.log(`Ignoring ${zipFile.absPath} `);
                continue;
            }
            try {
                const baseOutputDir = path.join(_unzipHere, path.basename(zipFile.absPath, '.zip'));
                console.log(`\nChecking ${zipFile.absPath}`);
                console.log(`Base output directory: ${baseOutputDir}`);
                
                // First check if the base output directory exists
                if (!(await checkFolderExistsAsync(baseOutputDir))) {
                    const err = `No corresponding base output directory found for ${zipFile.absPath} at ${baseOutputDir}`;
                    console.log(err);
                    error_msg.push(err);
                    error_count++;
                    continue;
                }

                // Get list of files and sizes in zip (including nested paths)
                const zipEntries = new Map<string, {size: number; path: string}>();
                const zip = await openZip(zipFile.absPath);
                await new Promise<void>((resolve, reject) => {
                    zip.on('entry', (entry) => {
                        if (!entry.fileName.endsWith('/')) { // Skip directories
                            // Normalize zip paths: convert to OS-specific separators
                            const normalizedPath = entry.fileName.split('/').join(path.sep);
                            zipEntries.set(normalizedPath, {
                                size: entry.uncompressedSize,
                                path: normalizedPath
                            });
                        }
                    });
                    zip.on('end', () => resolve());
                    zip.on('error', (err) => reject(err));
                });

                // Get list of files and sizes in output directory (recursive)
                const unzippedFiles = new Map<string, {size: number; path: string}>();
                const baseForRelative = baseOutputDir + path.sep;
                
                async function scanDirectory(dir: string) {
                    const files = await fs.promises.readdir(dir);
                    for (const file of files) {
                        const fullPath = path.join(dir, file);
                        const stat = await fs.promises.stat(fullPath);
                        if (stat.isFile()) {
                            // Get path relative to the base output directory
                            const relativePath = fullPath.substring(baseForRelative.length);
                            unzippedFiles.set(relativePath, {
                                size: stat.size,
                                path: fullPath
                            });
                        } else if (stat.isDirectory()) {
                            await scanDirectory(fullPath);
                        }
                    }
                }

                await scanDirectory(baseOutputDir);

                // Debug output
                console.log("\nZip contents:");
                for (const [path, entry] of zipEntries) {
                    console.log(`  ${path} (${entry.size} bytes)`);
                }
                console.log("\nUnzipped contents:");
                for (const [path, entry] of unzippedFiles) {
                    console.log(`  ${path} (${entry.size} bytes)`);
                }

                // Compare files and sizes
                if (unzippedFiles.size === 0) {
                    const err = `Output directory ${baseOutputDir} is empty for ${zipFile.absPath}`;
                    console.log(err);
                    error_msg.push(err);
                    error_count++;
                    continue;
                }

                let mismatch = false;
                const missingFiles: string[] = [];
                const sizeMismatches: string[] = [];
                const extraFiles: string[] = [];

                // Check for missing or size-mismatched files from zip
                for (const [zipPath, zipEntry] of zipEntries) {
                    const unzippedEntry = unzippedFiles.get(zipPath);
                    if (!unzippedEntry) {
                        missingFiles.push(zipPath);
                        mismatch = true;
                    } else if (unzippedEntry.size !== zipEntry.size) {
                        sizeMismatches.push(`${zipPath} (zip: ${zipEntry.size} bytes, unzipped: ${unzippedEntry.size} bytes)`);
                        mismatch = true;
                    }
                }

                // Check for extra files in unzipped directory
                for (const [unzippedPath] of unzippedFiles) {
                    if (!zipEntries.has(unzippedPath)) {
                        extraFiles.push(unzippedPath);
                        mismatch = true;
                    }
                }

                if (mismatch) {
                    if (missingFiles.length > 0) {
                        const err = `Missing files in ${baseOutputDir}:\n  ${missingFiles.join('\n  ')}`;
                        console.log(err);
                        error_msg.push(err);
                    }
                    if (sizeMismatches.length > 0) {
                        const err = `Size mismatches in ${baseOutputDir}:\n  ${sizeMismatches.join('\n  ')}`;
                        console.log(err);
                        error_msg.push(err);
                    }
                    if (extraFiles.length > 0) {
                        const err = `Extra files found in ${baseOutputDir}:\n  ${extraFiles.join('\n  ')}`;
                        console.log(err);
                        error_msg.push(err);
                    }
                    error_count++;
                } else {
                    console.log(`✓ Successfully verified ${zipFile.absPath}\n  All ${zipEntries.size} files match in size at ${baseOutputDir}`);
                    success_count++;
                }

            } catch (error) {
                const err = `Error verifying unzip for ${zipFile.absPath}: ${error}`;
                console.log(err);
                error_msg.push(err);
                error_count++;
            }
        }
    } catch (error) {
        const err = `Error while getting zip files: ${error}`;
        console.log(err);
        error_msg.push(err);
        error_count++;
    }

    return {
        success_count,
        error_count,
        error_msg,
        unzipFolder: _unzipHere
    };
}
