import { transformProps } from "sognaflow-dom";
export const appearStoreId = (elementId, valueName) => {
    const key = transformProps.has(valueName) ? "transform" : valueName;
    return `${elementId}: ${key}`;
};
//# sourceMappingURL=store-id.js.map
