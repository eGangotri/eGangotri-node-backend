export const isoDateStringToDate = (isoDateString:string) => {
    const splitDate = isoDateString.split("T")
    return new Date(`${splitDate[0]} ${splitDate[1].substring(0,5)}`)
}
