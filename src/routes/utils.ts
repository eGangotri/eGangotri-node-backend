import { Request } from "express";

export const getLimit = (req:Request):number => {
    const limit = req?.query?.limit as string;
    console.log(`req.query ${JSON.stringify(req.query)} ${limit}`);
    return parseInt(limit || "100");
}