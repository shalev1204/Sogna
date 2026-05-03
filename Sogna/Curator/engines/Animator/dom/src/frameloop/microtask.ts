import { CreateRenderBatcher } from "./batcher"

export const { schedule: Microtask, cancel: CancelMicrotask } =
    /* @__PURE__ */ CreateRenderBatcher(queueMicrotask, false)
