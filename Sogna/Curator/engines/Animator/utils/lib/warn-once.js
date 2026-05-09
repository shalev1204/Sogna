import { formatErrorMessage } from "./format-error-message.js";
const warned = new Set();
export function hasWarned(message) {
    return warned.has(message);
}
export function warnOnce(condition, message, errorCode) {
    if (condition || warned.has(message))
        return;
    console.warn(formatErrorMessage(message, errorCode));
    warned.add(message);
}
//# sourceMappingURL=warn-once.js.map
