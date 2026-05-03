import type { DynamicOption } from "../types";
import type { VisualElement } from "../../render/visualelement";
export declare function CalcChildStagger(children: Set<VisualElement>, child: VisualElement, delayChildren?: number | DynamicOption<number>, staggerChildren?: number, staggerDirection?: number): number;
