import { noop } from "sognaflow-utils";
import { CreateRenderBatcher } from "./batcher";
export const { schedule: Frame, cancel: CancelFrame, state: FrameData, steps: FrameSteps, } = /* @__PURE__ */ CreateRenderBatcher(typeof requestAnimationFrame !== "undefined" ? requestAnimationFrame : noop, true);
//# sourceMappingURL=frame.js.map