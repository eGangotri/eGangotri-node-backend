import logger from "./index";

// Override console.log
console.log = (message?: any, ...optionalParams: any[]): void => {
    logger.info(message, ...optionalParams);
};

// Override console.error
console.error = (message?: any, ...optionalParams: any[]): void => {
    logger.error(message, ...optionalParams);
};

// Override console.warn
console.warn = (message?: any, ...optionalParams: any[]): void => {
    logger.warn(message, ...optionalParams);
};
