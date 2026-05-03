import { StepNames } from "./order";
import { Step } from "./types";
export declare function CreateRenderStep(runNextFrame: () => void, stepName?: StepNames): Step;
