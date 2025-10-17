import 'dotenv/config';
import * as path from 'path';
import { getGoogleDriveInstance } from '../../googleapi/service/CreateGoogleDrive';
import { extractGoogleDriveId } from '../../../mirror/GoogleDriveUtilsCommonCode';
import { ALLOWED_MIME_TYPES_FOR_RENAMING } from '../../googleapi/_utils/constants';
import { convertBufferToBasicEncodedString, processFileForAIRenaming } from './utils';
import { SIMPLE_TITLE_AUTHOR_PROMPT } from './constants';
import { GDRIVE_CP_EXTRACTED_METADATA_RES } from '../../../routes/utils';

export async function renameDriveFileByLink(
  driveLinkOrId: string,
): Promise<{ fileId: string; oldName: string; newName: string }> {
  const drive = getGoogleDriveInstance();
  const fileId = extractGoogleDriveId(driveLinkOrId);

  // Get current name and mimeType
  const meta = await drive.files.get({ fileId, fields: 'id, name, mimeType', supportsAllDrives: true });


  const oldName = meta.data.name || 'unnamed';

  // Fetch Drive bytes in-memory (no local file IO)
  const mediaResp = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  );

  const buf = Buffer.from(mediaResp.data as ArrayBuffer);
  const base64EncodedFile = convertBufferToBasicEncodedString(buf, oldName);

  // You now have:
  // - base64EncodedFile
  // - mime (from meta.data.mimeType)
  // Build your AI request payload with inline_data using the correct mime:
  // inline_data: { mime_type: mime, data: base64EncodedFile }


  // Only allow common types (jpeg/pdf/gif/png) unless you want to broaden support
  const mime = meta.data.mimeType || '';
  if (!ALLOWED_MIME_TYPES_FOR_RENAMING.includes(mime)) {
    // Not blocking, but warn in log
    console.warn(`Warning: File mimeType ${mime} not in allowed list (${ALLOWED_MIME_TYPES_FOR_RENAMING.join(', ')}). Proceeding to rename anyway.`);
  }

  GDRIVE_CP_EXTRACTED_METADATA_RES.processedCount++;
  const { extractedMetadata, error } = await processFileForAIRenaming(base64EncodedFile, mime, SIMPLE_TITLE_AUTHOR_PROMPT);
  if (error || extractedMetadata === 'NIL') {
    console.log(`Failed to process file ${oldName}: ${error}`);
    return { fileId, oldName, newName: oldName };
  }

  const ext = path.extname(extractedMetadata) || '';

  if (extractedMetadata.length - ext.length > 3) {
    await drive.files.update({
      fileId,
      requestBody: { name: extractedMetadata },
      fields: 'id, name',
      supportsAllDrives: true
    });
  }

  return { fileId, oldName, newName: extractedMetadata };
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
 * pnpm run rename-gdrive-img-files -- --link "https://drive.google.com/file/d/1FhU5LGLSImhFILSSObrcfXGMsFHbGFNY/view?usp=drive_link"
 */

// https://drive.google.com/drive/folders/1CK6QWUJFkNrBl7BK8lA8ZM7970tXvmjJ?usp=drive_link