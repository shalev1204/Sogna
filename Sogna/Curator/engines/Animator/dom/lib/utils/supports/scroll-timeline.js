import { memoSupports } from "./memo.js";
export const supportsScrollTimeline = /* @__PURE__ */ memoSupports(() => window.ScrollTimeline !== undefined, "scrollTimeline");
export const supportsViewTimeline = /* @__PURE__ */ memoSupports(() => window.ViewTimeline !== undefined, "viewTimeline");
//# sourceMappingURL=scroll-timeline.js.map