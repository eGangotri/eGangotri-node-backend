
export const getLimit = (res:any):number => {
    const limit = res?.query?.limit || "100"
    console.log(`req.query ${JSON.stringify(res.query)} ${limit}`);
    return parseInt(limit);
}