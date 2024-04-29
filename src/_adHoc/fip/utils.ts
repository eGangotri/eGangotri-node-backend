


export interface FipExcelOne {
    rowCounter: number;
    absPath: string;
    folder: string;
    fileName: string;
    ext: string;
}

export interface FipExcelTwo {
    identifier: string;
    material: string;
    handlist: string;
    title: string;
    subject: string;
    script: string;
}

export interface FipExcelThree {
    absPath?: string;
    subject?: string;
    description?: string;
    creator?: string;
}
