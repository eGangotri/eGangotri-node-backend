import * as fs from 'fs';
import archiver from 'archiver';
import * as path from 'path';
import { getAllZipFiles } from '../utils/FileStatsUtils';
import * as yauzl from 'yauzl';
import { getNonFolderFileCount } from '../archiveDotOrg/utils';
import { pipeline } from "stream/promises";

const MAX_CONCURRENCY = 4; // Adjust based on your system resources

const UNZIP_FOLDER = "\\unzipped";

export async function zipFiles(filePaths: string[],
    outputZipPath: string,
    rootDirToMaintainOrigFolderOrder = ""): Promise<void> {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outputZipPath);
        const archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level.
        });

        output.on('close', () => {
            console.log(`Archive ${outputZipPath} created successfully. Total bytes: ${archive.pointer()}`);
            resolve();
        });

        archive.on('error', (err) => {
            reject(err);
        });

        archive.pipe(output);

        filePaths.forEach(filePath => {
            if (rootDirToMaintainOrigFolderOrder === "") {
                const fileName = filePath.split('\\').pop(); // Extract the file name
                if (fileName) {
                    archive.file(filePath, { name: fileName });
                }
            }
            else {
                console.log(`filePath : ${filePath} rootDirToMaintainOrigFolderOrder : ${rootDirToMaintainOrigFolderOrder}`);
                const relativePath = filePath.split('C:\\Users\\chetan\\Documents').pop(); // Adjust the base directory as needed
                if (relativePath) {
                    archive.file(filePath, { name: relativePath });
                }
            }
        });

        archive.finalize();
    });
}

function findZipFiles(dir: string, zipFiles: string[] = []): string[] {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            findZipFiles(filePath, zipFiles);
        } else if (filePath.endsWith('.zip')) {
            zipFiles.push(filePath);
        }
    }
    return zipFiles;
}



function unzipFilesDeprecated2(filePath: string, outputDir: string): Promise<void> {
    return new Promise((resolve, reject) => {
        yauzl.open(filePath, { lazyEntries: true }, (err, zipfile) => {
            if (err) {
                console.error(`recieved error in yauzl: ${JSON.stringify(err)}`);
                return reject(err);
            }

            zipfile.readEntry();
            let entryFileName = "";

            zipfile.on("entry", (entry) => {
                // Construct the full output path
                const outputPath = path.join(outputDir, entry.fileName);
                entryFileName = entry.fileName;
                // Create directory for entry if needed
                if (/\/$/.test(entry.fileName)) {
                    // Directory entry
                    fs.mkdirSync(outputPath, { recursive: true });
                    zipfile.readEntry(); // Continue to the next entry
                } else {
                    // File entry
                    zipfile.openReadStream(entry, (err, readStream) => {
                        if (err) {
                            return reject(err);
                        }

                        // Ensure the output directory exists
                        fs.mkdirSync(path.dirname(outputPath), { recursive: true });

                        const writeStream = fs.createWriteStream(outputPath);
                        readStream.pipe(writeStream);

                        writeStream.on("finish", () => {
                            zipfile.readEntry(); // Continue to the next entry
                        });

                        writeStream.on("error", (err) => {
                            console.error(`yauzl-error ${entryFileName} to ${outputDir}`);
                            reject(err);
                        });
                    });
                }

            });


            zipfile.on("end", () => {
                console.log(`yauzl-extracted ${entryFileName} to ${outputDir}`);
                resolve(); // Resolve the promise when done
            });
        });
    });
}


async function unzipFiles(filePath: string, outputDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    yauzl.open(filePath, { lazyEntries: true }, async (err, zipfile) => {
      if (err) return reject(err);

      try {
        let activeOperations = 0;
        const queue: yauzl.Entry[] = [];
        let isProcessing = false;

        // Process queue with concurrency control
        const processQueue = async () => {
          while (activeOperations < MAX_CONCURRENCY && queue.length > 0) {
            const entry = queue.shift()!;
            activeOperations++;
            
            try {
              if (/\/$/.test(entry.fileName)) {
                // Directory entry
                const dirPath = path.join(outputDir, entry.fileName);
                await fs.promises.mkdir(dirPath, { recursive: true });
              } else {
                // File entry
                await new Promise<void>((resolveFile, rejectFile) => {
                  zipfile.openReadStream(entry, async (err, readStream) => {
                    if (err) return rejectFile(err);

                    try {
                      const filePath = path.join(outputDir, entry.fileName);
                      const dirPath = path.dirname(filePath);
                      
                      // Create parent directory first
                      await fs.promises.mkdir(dirPath, { recursive: true });
                      
                      const writeStream = fs.createWriteStream(filePath);
                      
                      // Use stream.pipeline for proper error handling
                      await pipeline(readStream, writeStream);
                      resolveFile();
                    } catch (error) {
                      rejectFile(error);
                    }
                  });
                });
              }
            } catch (error) {
              reject(error);
              return;
            } finally {
              activeOperations--;
              processQueue(); // Continue processing
            }
          }

          // Check completion when queue is empty
          if (queue.length === 0 && activeOperations === 0 && isProcessing) {
            zipfile.close();
            resolve();
          }
        };

        zipfile.on("entry", (entry) => {
          queue.push(entry);
          if (!isProcessing) {
            isProcessing = true;
            processQueue();
          }
        });

        zipfile.on("end", () => {
          isProcessing = false;
          processQueue(); // Final check in case entries finished before queue was empty
        });

        zipfile.readEntry();
      } catch (error) {
        reject(error);
      }
    });
  });
}

export async function unzipAllFilesInDirectory(pathToZipFiles: string, _unzipHere: string = "", ignoreFolder = ""):
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
        const zipFiles = await getAllZipFiles(pathToZipFiles);
        if (!_unzipHere || _unzipHere === "") {
            _unzipHere = pathToZipFiles + UNZIP_FOLDER;
        }
        let idx = 0;
        for (const zipFile of zipFiles) {
            try {
                const outputDir = path.join(_unzipHere, path.basename(zipFile.absPath, '.zip'));
                if (fs.existsSync(outputDir)) {
                    console.log(`Folder already exists ${outputDir} for ${zipFile.absPath} to `);
                    error_count++;
                    error_msg.push(`Folder already exists ${zipFile.absPath}`);
                    continue;
                }
                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }
                console.log(`${++idx}). unzipping ${zipFile.absPath} to ${outputDir} `)
                await unzipFiles(zipFile.absPath, outputDir);
                console.log(`Unzipped ${zipFile.absPath} to 
            ${outputDir} `);
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
        const zipFiles = await getAllZipFiles(pathToZipFiles);
        if (!_unzipHere || _unzipHere === "") {
            _unzipHere = pathToZipFiles + UNZIP_FOLDER;
        }

        for (const zipFile of zipFiles) {
            if (zipFile.absPath.includes(ignoreFolder) ||
                zipFile.absPath.includes(UNZIP_FOLDER)) {
                console.log(`Ignoring ${zipFile.absPath} `);
                continue
            }
            try {
                const outputDir = path.join(_unzipHere, path.basename(zipFile.absPath, '.zip'));
                console.log(`checking ${zipFile.absPath} for ${outputDir}`)
                if (!fs.existsSync(outputDir)) {
                    console.log(`no corresponding ${outputDir} to ${zipFile.absPath} `)
                    error_msg.push(`No output directory found for ${zipFile.absPath} to ${outputDir} `);
                    error_count++;
                }
                else {
                    const fileCount = await getNonFolderFileCount(outputDir);
                    if (fileCount > 0) {
                        console.log(`${zipFile.absPath} exists for ${outputDir}`);
                        success_count++;
                    }
                    else {
                        console.log(`${zipFile.absPath} to ${outputDir} empty`)
                        error_msg.push(`output directory ${outputDir} empty for ${zipFile.absPath}`);
                        error_count++;
                    }
                }

            }
            catch (error) {
                const _err = `Error while reading ${zipFile.absPath} : ${JSON.stringify(error)} `;
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
