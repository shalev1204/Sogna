import { CreateRenderBatcher } from "./batcher.js";
export const { schedule: Microtask, cancel: CancelMicrotask } = 
/* @__PURE__ */ CreateRenderBatcher(queueMicrotask, false);
//# sourceMappingURL=microtask.js.map