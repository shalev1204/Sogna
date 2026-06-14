import { StepNames } from "./order.js";
import { Step } from "./types.js";
export declare function CreateRenderStep(runNextFrame: () => void, stepName?: StepNames): Step;
