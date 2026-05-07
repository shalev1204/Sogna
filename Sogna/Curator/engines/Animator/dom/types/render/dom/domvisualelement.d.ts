import type { SognaflowValue } from "../../value";
import type { AnyResolvedKeyframe } from "../../animation/types.js";
import { DOMKeyframesResolver } from "../../animation/keyframes/DOMKeyframesResolver.js";
import type { SognaflowNodeOptions } from "../../node/types.js";
import type { DOMVisualElementOptions } from "./types.js";
import type { HTMLRenderState } from "../html/types.js";
import { VisualElement } from "../VisualElement.js";
export declare abstract class DOMVisualElement<Instance extends HTMLElement | SVGElement = HTMLElement, State extends HTMLRenderState = HTMLRenderState, Options extends DOMVisualElementOptions = DOMVisualElementOptions> extends VisualElement<Instance, State, Options> {
    sortInstanceNodePosition(a: Instance, b: Instance): number;
    getBaseTargetFromProps(props: SognaflowNodeOptions, key: string): AnyResolvedKeyframe | SognaflowValue<any> | undefined;
    removeValueFromRenderState(key: string, { vars, style }: HTMLRenderState): void;
    KeyframeResolver: typeof DOMKeyframesResolver;
    childSubscription?: VoidFunction;
    handleChildSognaflowValue(): void;
}
