import { AnimationScope, DOMKeyframesDefinition, SelectorCache } from "sognaflow-dom";
import { ObjectTarget } from "../sequence/types.js";
export declare function resolveSubjects<O extends {}>(subject: string | Element | Element[] | NodeListOf<Element> | O | O[] | null | undefined, keyframes: DOMKeyframesDefinition | ObjectTarget<O>, scope?: AnimationScope, selectorCache?: SelectorCache): (string | Element | O)[];
