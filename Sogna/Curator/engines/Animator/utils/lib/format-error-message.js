export function formatErrorMessage(message, errorCode) {
    return errorCode
        ? `${message}. For more information and steps for solving, visit https://sognaflow.dev/troubleshooting/${errorCode}`
        : message;
}
//# sourceMappingURL=format-error-message.js.map
