import { AnimationPlaybackControls } from "sognaflow-dom";
import { OnScroll, ScrollOptions } from "./types.js";
export declare function scroll(onScroll: OnScroll | AnimationPlaybackControls, { axis, container, ...options }?: ScrollOptions): VoidFunction;
