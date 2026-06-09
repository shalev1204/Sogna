import { ProgressTimeline } from "../animation/types.js";
type Update = (progress: number) => void;
export declare function observeTimeline(update: Update, timeline: ProgressTimeline): () => void;
export {};
