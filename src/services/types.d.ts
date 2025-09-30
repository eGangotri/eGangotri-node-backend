export interface ExcelV1Columns {
    absPath?: string;
    subject?: string;
    description?: string;
    creator?: string;
    uploadedFlag?: boolean;
}

// Types for Python extraction loop results
export interface ExtractionSuccessResult {
    msg: string;
    srcFolder: string;
    destRootDump: string;
    isReductionCountMatch: boolean;
    message: string;
    success: boolean;
    data?: {
        input_folder: string;
        output_folder: string;
        nFirstPages: number;
        nLastPages: number;
    };
}

export interface ExtractionErrorResult {
    err: unknown;
    msg: string;
    success: false;
    _srcFolder: string;
    destRoot: string;
}

export type PythonExtractionResult = ExtractionSuccessResult | ExtractionErrorResult;
