export const validateDateRange = (dateRange: string) => {
    const parsedDateRange: [number, number] = [0, 0]

    if (dateRange) {
        let [startDate, endDate] = [undefined, undefined];
        const dateFilters = dateRange?.includes("-");
        if (dateFilters) {
            try {
                [startDate, endDate] = dateRange.split("-");
                if (!isValidDate(startDate) || !isValidDate(endDate)) {
                    return {
                        "status": "failed",
                        "success": false,
                        "msg": `One of Start Date(${startDate})or End Date(${endDate}) not in proper format`
                    }
                }
                const _startDate = new Date(startDate + " 00:01").getTime()
                const _endDate = new Date(endDate + " 23:59").getTime()
                if (_startDate > _endDate) {
                    return {
                        "status": "failed",
                        "success": false,
                        "msg": `Start Date(${startDate}) cannot be greater than End Date(${endDate})`
                    }
                }
                parsedDateRange[0] = _startDate;
                parsedDateRange[1] = _endDate;
            }
            catch (e) {
                return {
                    "status": "failed",
                    "success": false,
                    "msg": "Pls. provide valid date range" + e.message
                }
            }
        }
        else {
            return {
                "status": "failed",
                "success": false,
                "msg": `Invalid Date Range ${dateRange}`
            }
        }

    }
    
    return {
        "status": "success",
        "success": true,
        "parsedDateRange": parsedDateRange
    }
}

const isValidDate = (dateString: string): boolean => {

    // Check if the date string matches the format YYYY/MM/DD
    let isValidFormat = /^\d{4}\/\d{2}\/\d{2}$/.test(dateString);

    let date = new Date(dateString);

    // Check if the date is valid
    let isValidDate = !isNaN(date.getTime());

    return (isValidFormat && isValidDate)
}