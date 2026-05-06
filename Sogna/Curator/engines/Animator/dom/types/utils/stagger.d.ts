import { Easing } from "sognaflow-utils";
import { DynamicOption } from "../animation/types.js";
export type StaggerOrigin = "first" | "last" | "center" | number;
export type StaggerOptions = {
    startDelay?: number;
    from?: StaggerOrigin;
    ease?: Easing;
};
export declare function GetOriginIndex(from: StaggerOrigin, total: number): number;
export declare function Stagger(duration?: number, { startDelay, from, ease }?: StaggerOptions): DynamicOption<number>;
