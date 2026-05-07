import type { Box } from "sognaflow-utils";
import type { AnyResolvedKeyframe } from "../../animation/types.js";
import type { SognaflowNodeOptions } from "../../node/types.js";
import { DOMVisualElement } from "../dom/DOMVisualElement.js";
import type { DOMVisualElementOptions } from "../dom/types.js";
import type { ResolvedValues, SognaflowConfigContextProps } from "../types.js";
import type { VisualElement } from "../VisualElement.js";
import { HTMLRenderState } from "./types.js";
import { renderHTML } from "./utils/render.js";
export declare function getComputedStyle(element: HTMLElement): CSSStyleDeclaration;
export declare class HTMLVisualElement extends DOMVisualElement<HTMLElement, HTMLRenderState, DOMVisualElementOptions> {
    type: string;
    readValueFromInstance(instance: HTMLElement, key: string): AnyResolvedKeyframe | null | undefined;
    measureInstanceViewportBox(instance: HTMLElement, { transformPagePoint }: SognaflowNodeOptions & Partial<SognaflowConfigContextProps>): Box;
    build(renderState: HTMLRenderState, latestValues: ResolvedValues, props: SognaflowNodeOptions): void;
    ScrapeSognaflowValuesFromProps(props: SognaflowNodeOptions, prevProps: SognaflowNodeOptions, visualElement: VisualElement): {
        [key: string]: any;
    };
    renderInstance: typeof renderHTML;
}
