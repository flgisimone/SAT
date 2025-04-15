let errorCount = 0;
let warningCount = 0;

const errorMessages: string[] = [];
const warningMessages: string[] = [];

export function logError(message: string) {
    errorCount++;
    errorMessages.push(message);
}

export function logWarning(message: string) {
    warningCount++;
    warningMessages.push(message);
}

export function getSatLogStats() {
    return {
        errors: errorCount,
        warnings: warningCount,
        errorMessages: [...errorMessages],
        warningMessages: [...warningMessages],
    };
}

export function resetSatLogStats() {
    errorCount = 0;
    warningCount = 0;
    errorMessages.length = 0;
    warningMessages.length = 0;
}
