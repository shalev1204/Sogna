import type { AnyResolvedKeyframe } from "../../animation/types";
import type { SognaflowValue } from "../../value";
import type { SognaflowNodeOptions } from "../../node/types";
import { DOMVisualElement } from "../dom/domvisualelement";
import type { DOMVisualElementOptions } from "../dom/types";
import type { ResolvedValues } from "../types";
import type { VisualElement, SognaflowStyle } from "../visualelement";
import { SVGRenderState } from "./types";
export declare class SVGVisualElement extends DOMVisualElement<SVGElement, SVGRenderState, DOMVisualElementOptions> {
    type: string;
    isSVGTag: boolean;
    getBaseTargetFromProps(props: SognaflowNodeOptions, key: string): AnyResolvedKeyframe | SognaflowValue<any> | undefined;
    readValueFromInstance(instance: SVGElement, key: string): any;
    measureInstanceViewportBox: () => import("sognaflow-utils").Box;
    ScrapeSognaflowValuesFromProps(props: SognaflowNodeOptions, prevProps: SognaflowNodeOptions, visualElement: VisualElement): {
        [key: string]: any;
    };
    build(renderState: SVGRenderState, latestValues: ResolvedValues, props: SognaflowNodeOptions): void;
    renderInstance(instance: SVGElement, renderState: SVGRenderState, styleProp?: SognaflowStyle | undefined, projection?: any): void;
    mount(instance: SVGElement): void;
}
