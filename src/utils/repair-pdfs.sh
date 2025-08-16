#!/bin/bash

# instead of pdftk use qpdf for fast repair
# Download qpdf from https://github.com/qpdf/qpdf/releases
# Look for qpdf-<version>-bin-msvc64.exe
# must run this 
# chmod +x src/utils/repair-pdfs.sh
# ./src/utils/repair-pdfs.sh /c/tmp/_tst

# Check if directory argument is provided
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <directory-with-pdfs>"
    exit 1
fi

PDF_DIR="$1"
echo "Processing PDFs in $PDF_DIR"

# Find all PDF files and process them
find "$PDF_DIR" -type f -name "*.pdf" -print0 | while IFS= read -r -d '' pdf; do
    echo "Repairing: $pdf"
    qpdf --replace-input --warning-exit-0 "$pdf"
done

echo "PDF repair completed!"
