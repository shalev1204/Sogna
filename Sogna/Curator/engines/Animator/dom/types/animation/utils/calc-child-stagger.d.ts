import type { DynamicOption } from "../types.js";
import type { VisualElement } from "../../render/VisualElement.js";
export declare function CalcChildStagger(children: Set<VisualElement>, child: VisualElement, delayChildren?: number | DynamicOption<number>, staggerChildren?: number, staggerDirection?: number): number;
