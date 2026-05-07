import { OnScrollInfo, ScrollInfoOptions } from "./types.js";
export type ScrollTargets = Array<HTMLElement>;
export declare function scrollInfo(onScroll: OnScrollInfo, { container, trackContentSize, ...options }?: ScrollInfoOptions): VoidFunction;
