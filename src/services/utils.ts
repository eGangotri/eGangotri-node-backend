export const ExcelHeaderToJSONMAPPING = {
    'Serial No.': 'serialNo',
    Link: 'link',
    'All Downloads Link Page': 'allDownloadsLinkPage',
    'Pdf Download Link': 'pdfDownloadLink',
    'Page Count': 'pageCount',
    'Original Title': 'originalTitle',
    'Title-Archive': 'titleArchive',
    Size: 'size',
    'Size Formatted': 'sizeFormatted',
    Subject: 'subject',
    Description: 'description',
    Date: 'date',
    Acct: 'acct',
    Identifier: 'identifier',
    Type: 'type',
    'Media Type': 'mediaType',
    'Email-User': 'emailUser'
}

export const replaceExcelHeadersWithJsonKeys = (data: Object[]) => {
    return data.map((row: Object) => {
        const newRow = {};
        Object.keys(row).forEach((key) => {
            const dataRowKeyCorrespondingValue = row[key]
            const jsonHeader = ExcelHeaderToJSONMAPPING[key]
            newRow[jsonHeader] = dataRowKeyCorrespondingValue;
            if (jsonHeader === 'pageCount') {
                newRow[jsonHeader] = newRow[jsonHeader] || 0;
            }
        });

        return newRow;
    });
}
