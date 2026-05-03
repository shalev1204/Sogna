import { CreateEffect as createEffect } from "../utils/create-effect";
export const PropEffect = /*@__PURE__*/ createEffect((subject, state, key, value) => {
    return state.set(key, value, () => {
        subject[key] = state.latest[key];
    }, undefined, false);
});
//# sourceMappingURL=index.js.map