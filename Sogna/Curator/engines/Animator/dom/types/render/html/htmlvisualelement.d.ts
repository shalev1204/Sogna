import type { Box } from "sognaflow-utils";
import type { AnyResolvedKeyframe } from "../../animation/types";
import type { SognaflowNodeOptions } from "../../node/types";
import { DOMVisualElement } from "../dom/domvisualelement";
import type { DOMVisualElementOptions } from "../dom/types";
import type { ResolvedValues, SognaflowConfigContextProps } from "../types";
import type { VisualElement } from "../visualelement";
import { HTMLRenderState } from "./types";
import { RenderHTML as renderHTML } from "./utils/render";
export declare function GetComputedStyle(element: HTMLElement): CSSStyleDeclaration;
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
