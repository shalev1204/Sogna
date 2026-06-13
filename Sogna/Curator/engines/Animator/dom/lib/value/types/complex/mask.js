import { Complex } from ".";
export const Mask = {
    ...Complex,
    getAnimatableNone: (v) => {
        const parsed = Complex.parse(v);
        const transformer = Complex.createTransformer(v);
        return transformer(parsed.map((v) => typeof v === "number" ? 0 : typeof v === "object" ? { ...v, alpha: 1 } : v));
    },
};
export const mask = Mask;
//# sourceMappingURL=mask.js.map