
export const CSV_HEADER = [
    {
      key: "dateOfReport",
      label: "DATE",
    },
    {
      key: "operatorName",
      label: "NAME",
    },
    {
      key: "center",
      label: "Center",
    },
    {
      key: "lib",
      label: "Lib",
    },
    {
      key: "totalPdfCount",
      label: "TOTAL PDF COUNT",
    },
    {
      key: "totalPageCount",
      label: "TOTAL PAGE COUNT(Pages)",
    },
    {
      key: "totalSize",
      label: "TOTAL SIZE",
    },
    {
      key: "totalSizeRaw",
      label: "TOTAL SIZE (Raw)",
    },
    {
      key: "workFromHome",
      label: "Work From Home",
    },
    
  ];
  
  export const CSV_HEADER_API2_SUBSET = [    {
    id: "operatorName",
    title: "Operator Name",
  },
  {
    id: "center",
    title: "Center",
  },
  {
    id: "lib",
    title: "Lib",
  },
  {
    id: "totalPdfCount",
    title: "TOTAL PDF COUNT",
  },
  {
    id: "totalPageCount",
    title: "TOTAL PAGE COUNT(Pages)",
  },
  {
    id: "totalSize",
    title: "TOTAL SIZE",
  },
  {
    id: "totalSizeRaw",
    title: "TOTAL SIZE (Raw)",
  },
  {
    id: "workFromHome",
    title: "Work From Home",
  }]
  
  export const CSV_HEADER_API2_FOR_AGGREGATES = 
  [
    {
      id: "numEntries",
      title: "Number of Entries",
    },
    ...CSV_HEADER_API2_SUBSET
  ]

  export const CSV_HEADER_API2 = 
  [
    
    {
      id: "dateOfReport",
      title: "Date of Report",
    },
    ...CSV_HEADER_API2_SUBSET
  ]

  export const CSV_HEADER_THREE_FIELDS_ONLYAPI2 = 
  [
    {
      id: "operatorName",
      title: "Operator Name",
    },
    {
      id: "totalPdfCount",
      title: "TOTAL PDF COUNT",
    },
    {
      id: "totalPageCount",
      title: "TOTAL PAGE COUNT(Pages)",
    },
  ]
  export const dailyDetailReportHeader = [
    {
      key: "operatorName",
      label: "Operator Name",
    },
    {
      key: "fileName",
      label: "File Name",
    },
    {
      key: "pageCount",
      label: "PAGE COUNT(Pages)",
    },
    {
      key: "fileSize",
      label: "File Size",
    },
  ];
  

  export const CAT_CSV_HEADER = [
    {
      key: "timeOfRequest",
      label: "DATE",
    },
    {
      key: "operatorName",
      label: "NAME",
    },
    {
      key: "catalogProfile",
      label: "catalogProfile",
    },
    {
      key: "entryFrom",
      label: "entryFrom",
    },
    {
      key: "entryTo",
      label: "entryTo",
    },
    {
      key: "skipped",
      label: "skipped",
    },
    {
      key: "entryCount",
      label: "entryCount",
    },
    {
      key: "link",
      label: "link",
    },
    {
      key: "notes",
      label: "notes",
    },
  ];
  
  export const CSV_CAT_HEADER_API2 = 
  [
    {
      id: "timeOfRequest",
      title: "Date of Report",
    },
    {
      id: "operatorName",
      title: "Operator Name",
    },
    {
      id: "catalogProfile",
      title: "catalogProfile",
    },
    {
      id: "entryFrom",
      title: "Entry From",
    },
    {
      id: "entryTo",
      title: "Entry To ",
    },
    {
      id: "skipped",
      title: "Skipped",
    },
    {
      id: "entryCount",
      title: "Entry Count",
    },
    {
      id: "link",
      title: "link",
    },
    {
      id: "notes",
      title: "notes",
    }
  ]

  export const CSV_CAT_HEADER_FOR_OPERATOR_NAME_AND_ENTRY_COUNT_API2 = [
    {
      id: "operatorName",
      title: "Operator Name",
    },
    
    {
      id: "entryCount",
      title: "Entry Count",
    }
  ]