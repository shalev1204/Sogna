/**
 * Check if value is a numerical string, ie a string that is purely a number eg "100" or "-100.1"
 */
export const isNumericalString = (v) => /^-?(?:\d+(?:\.\d+)?|\.\d+)$/u.test(v);
//# sourceMappingURL=is-numerical-string.js.map
