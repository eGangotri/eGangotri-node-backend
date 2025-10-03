import 'dotenv/config';
import * as path from 'path';
import { getGoogleDriveInstance } from '../../googleapi/service/CreateGoogleDrive';
import { extractGoogleDriveId } from '../../../mirror/GoogleDriveUtilsCommonCode';

function buildNewName(
  originalName: string,
  fileId: string,
): string {

  const ext = path.extname(originalName) || '';
  const newName = `${fileId}`;

  
  return `${newName}${ext}`;
}

export async function renameDriveFileByLink(
  driveLinkOrId: string,
): Promise<{ fileId: string; oldName: string; newName: string }> {
  const drive = getGoogleDriveInstance();
  const fileId = extractGoogleDriveId(driveLinkOrId);

  // Get current name and mimeType
  const meta = await drive.files.get({ fileId, fields: 'id, name, mimeType', supportsAllDrives: true });
  const oldName = meta.data.name || 'unnamed';

  // Only allow common types (jpeg/pdf) unless you want to broaden support
  const mime = meta.data.mimeType || '';
  const allowed = ['application/pdf', 'image/jpeg', 'image/jpg'];
  if (!allowed.includes(mime)) {
    // Not blocking, but warn in log
    console.warn(`Warning: File mimeType ${mime} not in allowed list (${allowed.join(', ')}). Proceeding to rename anyway.`);
  }

  const newName = buildNewName(oldName, fileId);

  await drive.files.update({
    fileId,
    requestBody: { name: newName },
    fields: 'id, name',
    supportsAllDrives: true
  });

  return { fileId, oldName, newName };
}

// Simple CLI usage:
// ts-node renameGDRiveImgFiles.ts --link <driveLink> --pattern "Aml-1-Rack-2-Item-1" [--random]
async function cli() {
  const args = process.argv.slice(2);
  const getArg = (k: string) => {
    const idx = args.indexOf(k);
    if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
    return undefined;
  };

  const link = getArg('--link') || getArg('-l');

  if (!link) {
    console.log('Usage: ts-node renameGDRiveImgFiles.ts --link <gdrive_link_or_id>');
    process.exit(1);
  }

  try {
    const res = await renameDriveFileByLink(link);
    console.log(`Renamed file (${res.fileId})`);
    console.log(`Old Name: ${res.oldName}`);
    console.log(`New Name: ${res.newName}`);
  } catch (err: any) {
    console.error('Rename failed:', err?.message || err);
    process.exit(2);
  }
}

// Run only if executed directly
if (require.main === module) {
  cli();
}

/**
 * pnpm run rename-gdrive-img-files -- --link "https://drive.google.com/file/d/1RwSiTnZ6Jb1veKvZiclOInsf0khX42ah/view?usp=drive_link" --pattern "Aml-1-Rack-2-Item-1"
 */