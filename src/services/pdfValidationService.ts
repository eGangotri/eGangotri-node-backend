import { isPDFCorrupted } from '../utils/pdfValidator';

export interface PdfValidationResult {
  path: string;
  isValid: boolean;
  error?: string;
}

/**
 * Quick corruption check for up to N PDF paths.
 * Returns aggregate as well as per-file results.
 */
export async function anyPdfCorruptedQuick(paths: string[]): Promise<{ anyCorrupted: boolean;
   results: string[] }> {
  const uniquePaths = (paths || []).filter(Boolean);
  const checks = uniquePaths.map(async (p) => {
    const res = await isPDFCorrupted(p, { quickCheck: true });
    return { path: p, isValid: res.isValid, error: res.error } as PdfValidationResult;
  });
  const results = await Promise.all(checks);
  const corruptedPdfs = results.filter(r => !r.isValid) || [];
  return { anyCorrupted: corruptedPdfs.length > 0, results: corruptedPdfs.map((p) => p.path) };
}
