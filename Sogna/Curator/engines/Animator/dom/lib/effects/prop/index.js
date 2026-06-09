import { createEffect } from "../utils/create-effect.js";
export const PropEffect = /*@__PURE__*/ createEffect((subject, state, key, value) => {
    return state.set(key, value, () => {
        subject[key] = state.latest[key];
    }, undefined, false);
});
export const propEffect = PropEffect;
//# sourceMappingURL=index.js.map