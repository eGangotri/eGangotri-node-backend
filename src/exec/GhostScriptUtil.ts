//Based  on  
//http://dcm684.us/wp/2013/10/pdf-shrink/

//GhostScript Location 
//https://ghostscript.com/releases/gsdnld.html
//https://github.com/ArtifexSoftware/ghostpdl-downloads/releases/download/gs9550/gs9550w64.exe

import * as fs from 'fs';

export const BATCH_FILE_PATH = "C:\\Users\\manee\\eGangotri\\shrinkpdf.bat";
const GSPATH = "C:\\progra~1\\gs\\gs9.55.0\\bin\\gswin64c.exe";
const SHRUNK_FILE_PATH = "shrunk"
const  SHRINK_PDF_SCRIPT = `@echo on
 
REM Shrinks PDFs and puts them in a subdirectory of the first file
REM Usage: shrinkpdf.bat file1 file2 ...
 
REM Location of the Ghostscript exectuble
set GSPATH=${GSPATH}
 
REM Name of the subdirectory to store the shrunk files to
set OUTSUBDIR=${SHRUNK_FILE_PATH}
 
if "%~1"=="" (
 echo Usage: shrinkpdf.bat file1 file2 ...
 goto end
)
 
REM Take the path of the first file and use it as the folder
REM to create the shrunk directory under
set OUTDIR=%~dp1\%OUTSUBDIR%
 
REM Create the output folder if it doesn't exist
if not exist "%OUTDIR%" mkdir "%OUTDIR%"
 
:shrinkPDF
set OUTNAME=%OUTDIR%\%~nx1
 
@echo "Processing %~nx1"
 
REM Work the shrinking magic
REM Based on http://www.alfredklomp.com/programming/shrinkpdf/
%GSPATH% -q -dNOPAUSE -dBATCH -dSAFER ^
-sDEVICE=pdfwrite ^
-dCompatibilityLevel=1.3 ^
-dPDFSETTINGS=/screen ^
-dEmbedAllFonts=true ^
-dSubsetFonts=true ^
-dColorImageDownsampleType=/Bicubic ^
-dColorImageResolution=72 ^
-dGrayImageDownsampleType=/Bicubic ^
-dGrayImageResolution=72 ^
-dMonoImageDownsampleType=/Bicubic ^
-dMonoImageResolution=72 ^
-sOutputFile="%OUTNAME%" ^
"%~1"
 
REM Load the next file
shift
 
REM Are there any more files to shrink?
if "%~1"=="" goto end
 
goto shrinkPDF
 
:end`

export function createBatchFileIfNotExists(){
    if (!fs.existsSync(BATCH_FILE_PATH)) {
        console.log("creating Batch File ${BATCH_FILE_PATH}")
        fs.writeFileSync(BATCH_FILE_PATH, SHRINK_PDF_SCRIPT);
    }
}