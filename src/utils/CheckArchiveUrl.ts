import { URL } from 'url';

interface ArchiveFile {
  name: string;
  format: string;
  size: string; // Archive.org returns sizes as strings
  encrypted?: string;
}

interface ArchiveMetadataResponse {
  files?: ArchiveFile[];
  error?: string;
}

const ARCHIVE_METADATA_RETRY_COUNT = 3;
const ARCHIVE_METADATA_TIMEOUT_MS = 30000;

const fetchArchiveMetadata = async (identifier: string): Promise<ArchiveMetadataResponse | null> => {
  const apiUrl = `https://archive.org/metadata/${encodeURIComponent(identifier)}`;

  for (let attempt = 1; attempt <= ARCHIVE_METADATA_RETRY_COUNT; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), ARCHIVE_METADATA_TIMEOUT_MS);

      const response = await fetch(apiUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'eGangotri Upload Verification Tool'
        }
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return (await response.json()) as ArchiveMetadataResponse;
      }

      console.log(`Archive metadata check failed for ${identifier}, attempt ${attempt}/${ARCHIVE_METADATA_RETRY_COUNT}, status ${response.status} ${response.statusText}`);
    } catch (error: any) {
      console.log(`Archive metadata check failed for ${identifier}, attempt ${attempt}/${ARCHIVE_METADATA_RETRY_COUNT}, error ${error?.message || error}`);
    }
  }

  return null;
}

/**
 * Validates an archive.org URL and verifies it contains a readable, non-empty PDF.
 * @param urlString The Archive.org item details URL
 * @returns Promise<boolean> True if valid and contains a non-empty, accessible PDF
 */
export async function validateArchivePdf(urlString: string): Promise<boolean> {
  try {
    const parsedUrl = new URL(urlString);
    
    // 1. Ensure it's a valid archive.org host
    if (!parsedUrl.hostname.endsWith('archive.org')) {
      return false;
    }

    // 2. Extract the identifier from the path (e.g., /details/identifier)
    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
    if (pathParts[0] !== 'details' || !pathParts[1]) {
      return false;
    }
    
    const identifier = pathParts[1];

    // 3. Query the Archive.org Metadata API
    const data = await fetchArchiveMetadata(identifier);

    // If the identifier doesn't exist, the API either returns an error or an empty object
    if (!data || data.error || !data.files || data.files.length === 0) {
      return false;
    }

    // 4. Look for a valid PDF file in the metadata
    const hasValidPdf = data.files.some((file) => {
      const isPdfFormat = file.format === 'Text PDF' || file.format === 'Additional Text PDF' || file.name.toLowerCase().endsWith('.pdf');
      const size = parseInt(file.size, 10);
      
      // Ensure the file size is greater than 0 (not empty) and it's not encrypted/restricted
      const isReadable = !file.encrypted && size > 0;

      return isPdfFormat && isReadable;
    });

    return hasValidPdf;

  } catch (error) {
    // If URL parsing fails or network error occurs, it's invalid
    return false;
  }
}

// --- Example Usage ---
(async () => {
  const targetUrl = "https://archive.org/details/pwkb_rusi-hindi-shabdakosh-russko-khindi-slovar-by-veer-rajendra-rishi-nagendra-";
  
  const isValid = await validateArchivePdf(targetUrl);
  console.log(`Is the URL valid with a readable PDF? ${isValid}`); 
  // Output: true
})();