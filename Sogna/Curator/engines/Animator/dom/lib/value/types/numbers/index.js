import { clamp } from "sognaflow-utils";
export const NumberType = {
    test: (v) => typeof v === "number",
    parse: parseFloat,
    transform: (v) => v,
};
export const Alpha = {
    ...NumberType,
    transform: (v) => clamp(0, 1, v),
};
export const Scale = {
    ...NumberType,
    default: 1,
};
//# sourceMappingURL=index.js.map