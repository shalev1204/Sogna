import { type HTMLRenderState, type SVGRenderState, type VisualElement } from "sognaflow-dom";
import * as React from "react";
import { sognaflowConfigContext } from "../../context/MotionConfigContext.js";
import { sognaflowProps } from "../../motion/types";
import { DOMsognaflowComponents } from "../../render/dom/types.js";
import { CreateVisualElement } from "../../render/types.js";
import { VisualState } from "./use-visual-state.js";
export declare function useVisualElement<Props, TagName extends keyof DOMsognaflowComponents | string>(Component: TagName | string | React.ComponentType<Props>, visualState: VisualState<SVGElement, SVGRenderState> | VisualState<HTMLElement, HTMLRenderState>, props: sognaflowProps & Partial<sognaflowConfigContext>, createVisualElement?: CreateVisualElement<Props, TagName>, ProjectionNodeConstructor?: any, isSVG?: boolean): VisualElement<HTMLElement | SVGElement> | undefined;
