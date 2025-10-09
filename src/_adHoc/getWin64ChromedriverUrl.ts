/*
  Fetch the Chrome-for-Testing last-known-good-versions JSON and install the first
  chromedriver download for platform "win64". Steps:
  1) Find URL prioritizing Stable channel.
  2) Confirm URL ends with "win64/chromedriver-win64.zip".
  3) Download ZIP to a temp file.
  4) Unzip chromedriver.exe into the target resources directory (configurable).
  5) If chromedriver.exe exists, rename it to add suffix OLD + <day><month>.
  6) If resources path does not exist, log error and exit gracefully.
  7) If install succeeds, run: gradle clean build --refresh-dependencies from parent of resources dir.

  Configure resources directory via:
   - CLI arg: --resources=C:\\ws\\eGangotri\\resources
   - or env var: RESOURCES_DIR
   - default: C:\\ws\\eGangotri\\resources
*/

import fs from "fs-extra";
import path from "path";
import os from "os";
import { pipeline } from "stream";
import { promisify } from "util";
import yauzl from "yauzl";
import { spawn } from "child_process";

const pipe = promisify(pipeline);

const LKG_ENDPOINT =
  "https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions-with-downloads.json";

type DriverDownload = {
  platform: string; // e.g., "win64"
  url: string;
};

type ChannelDownloads = {
  chromedriver?: DriverDownload[];
  chrome?: DriverDownload[];
};

type ChannelEntry = {
  channel: string; // "Stable" | "Beta" | "Dev" | "Canary"
  version: string;
  revision: string;
  downloads: ChannelDownloads;
};

type LkgResponse = {
  channels: Record<string, ChannelEntry>;
};

function getResourcesDirFromArgs(): string | undefined {
  const arg = process.argv.find((a) => a.startsWith("--resources="));
  if (arg) return arg.substring("--resources=".length + 2 - 2 + 0 + 0); // keep simple slicing below
  return undefined;
}

function parseResourcesDir(): string {
  const arg = process.argv.find((a) => a.startsWith("--resources="));
  const fromArg = arg ? arg.slice("--resources=".length) : undefined;
  const fromEnv = process.env.RESOURCES_DIR;
  return fromArg || fromEnv || "C:\\ws\\eGangotri\\resources";
}

async function findWin64ChromedriverUrl(): Promise<string | undefined> {
  const res = await fetch(LKG_ENDPOINT, { method: "GET" });
  if (!res.ok) {
    throw new Error(`Failed to fetch LKG JSON: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as LkgResponse;
  const channelOrder = ["Stable", "stable", "Beta", "beta", "Dev", "dev", "Canary", "canary"];

  for (const key of channelOrder) {
    const entry = (data.channels as any)[key] as ChannelEntry | undefined;
    if (!entry || !entry.downloads || !entry.downloads.chromedriver) continue;
    const match = entry.downloads.chromedriver.find((d) => d.platform === "win64");
    if (match) return match.url;
  }

  for (const entry of Object.values(data.channels)) {
    const list = entry.downloads?.chromedriver ?? [];
    const match = list.find((d) => d.platform === "win64");
    if (match) return match.url;
  }

  return undefined;
}

async function downloadToFile(url: string, destPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok || !res.body) {
    throw new Error(`Failed downloading ${url}: ${res.status} ${res.statusText}`);
  }
  await fs.ensureDir(path.dirname(destPath));
  const fileStream = fs.createWriteStream(destPath);
  await pipe(res.body as any, fileStream);
}

async function extractChromedriverExe(zipPath: string, destExePath: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (err, zipFile) => {
      if (err || !zipFile) return reject(err || new Error("Unable to open zip"));
      let found = false;
      zipFile.readEntry();
      zipFile.on("entry", (entry) => {
        // Entries look like: chromedriver-win64/chromedriver.exe
        const isFile = !/\/$/.test(entry.fileName);
        if (isFile && /(^|\/)chromedriver\.exe$/i.test(entry.fileName)) {
          found = true;
          zipFile.openReadStream(entry, async (err2, readStream) => {
            if (err2 || !readStream) {
              zipFile.close();
              return reject(err2 || new Error("Unable to read zip entry"));
            }
            try {
              await fs.ensureDir(path.dirname(destExePath));
              const tmpPath = destExePath + ".tmp";
              const writeStream = fs.createWriteStream(tmpPath);
              await pipe(readStream as any, writeStream);
              // Replace existing file atomically
              await fs.move(tmpPath, destExePath, { overwrite: true });
              zipFile.close();
              resolve();
            } catch (e) {
              zipFile.close();
              reject(e);
            }
          });
        } else {
          zipFile.readEntry();
        }
      });
      zipFile.on("end", () => {
        if (!found) reject(new Error("chromedriver.exe not found in zip"));
      });
      zipFile.on("error", (e) => reject(e));
    });
  });
}

function formatOldSuffix(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `OLD${dd}${mm}`;
}

async function runGradle(resourcesDir: string): Promise<number> {
  const parentDir = path.resolve(resourcesDir, "..");
  return await new Promise<number>((resolve) => {
    const cmd = process.platform === "win32" ? "gradle.bat" : "gradle";
    const child = spawn(cmd, ["clean", "build", "--refresh-dependencies"], {
      cwd: parentDir,
      stdio: "inherit",
      shell: true,
    });
    child.on("close", (code) => resolve(code ?? 1));
    child.on("error", () => resolve(1));
  });
}

async function main() {
  try {
    const resourcesDir = parseResourcesDir();
    if (!(await fs.pathExists(resourcesDir))) {
      console.error(`Resources path does not exist: ${resourcesDir}. Exiting gracefully.`);
      return; // graceful exit
    }

    const url = await findWin64ChromedriverUrl();
    if (!url) {
      console.error("No chromedriver download found for platform win64.");
      process.exit(1);
    }

    // Confirm it ends with win64/chromedriver-win64.zip
    if (!url.endsWith("win64/chromedriver-win64.zip")) {
      console.error(`Refusing to download: URL does not end with win64/chromedriver-win64.zip -> ${url}`);
      process.exit(1);
    }

    console.log(`Downloading: ${url}`);
    const tmpZip = path.join(os.tmpdir(), `chromedriver-win64-${Date.now()}.zip`);
    await downloadToFile(url, tmpZip);

    const exePath = path.join(resourcesDir, "chromedriver.exe");
    if (await fs.pathExists(exePath)) {
      const suffix = formatOldSuffix(new Date());
      const backupPath = path.join(resourcesDir, `chromedriver.exe.${suffix}`);
      console.log(`Existing chromedriver.exe found. Renaming to ${backupPath}`);
      await fs.move(exePath, backupPath, { overwrite: true });
    }

    console.log(`Extracting chromedriver.exe to ${resourcesDir}`);
    await extractChromedriverExe(tmpZip, exePath);
    await fs.remove(tmpZip).catch(() => {});
    console.log("chromedriver.exe installed successfully.")

    console.log("Running: gradle clean build --refresh-dependencies");
    const code = await runGradle(resourcesDir);
    if (code !== 0) {
      console.error(`Gradle build failed with exit code ${code}`);
      process.exit(code);
    }
    console.log("Gradle build completed successfully.");
  } catch (err: any) {
    console.error(`Error: ${err?.message || String(err)}`);
    process.exit(3);
  }
}

// Run if executed directly
main();
