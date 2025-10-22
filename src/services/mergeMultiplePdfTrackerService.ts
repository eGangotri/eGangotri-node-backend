import { MergeMultiplePdfTracker } from '../models/mergeMultiplePdfTracker';

export interface SaveMergeMultiplePdfTrackerParams {
  commonRunId: any;
  pdfPathsToMergeCount: number;
  runId: any;
  first_pdf_path: string;
  second_pdf_path: string;
  third_pdf_path?: string;
  operationResult: any;
  moveResults: Array<{ sourcePath: string; movedToPath: string }>;
}

export async function saveMergeMultiplePdfTracker(params: SaveMergeMultiplePdfTrackerParams): Promise<void> {
  try {
    const { third_pdf_path, ...rest } = params;
    await MergeMultiplePdfTracker.create({
      ...rest,
      ...(third_pdf_path ? { third_pdf_path } : {}),
    });
  } catch (e) {
    console.warn('Failed to persist MERGE_MULTIPLE_PDF_TRACKER doc', e);
  }
}

export async function getCommonRuns() {
  return MergeMultiplePdfTracker.aggregate([
    {
      $group: {
        _id: '$commonRunId',
        oldestCreatedAt: { $min: '$createdAt' },
        anyCount: { $first: '$pdfPathsToMergeCount' },
      },
    },
    {
      $project: {
        _id: 0,
        commonRunId: '$_id',
        createdAt: '$oldestCreatedAt',
        pdfPathsToMergeCount: '$anyCount',
      },
    },
    { $sort: { createdAt: -1 } },
  ]);
}

export async function getByCommonRun(commonRunId: any) {
  return MergeMultiplePdfTracker.find({ commonRunId }).sort({ createdAt: 1 }).lean();
}
