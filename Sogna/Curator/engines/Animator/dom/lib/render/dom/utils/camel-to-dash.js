export function camelToDash(str) {
    return str.replace(/([A-Z])/g, (match) => `-${match.toLowerCase()}`);
}
//# sourceMappingURL=camel-to-dash.js.map
