import { sognaflowProps } from "../../motion/types";
import { VisualState } from "../../motion/utils/use-visual-state";
import { HTMLRenderState } from "../html/types.js";
import { SVGRenderState } from "../svg/types.js";
import { DOMsognaflowComponents } from "./types.js";
export declare function useRender<Props = {}, TagName extends keyof DOMsognaflowComponents | string = "div">(Component: TagName | string | React.ComponentType<Props>, props: sognaflowProps, ref: React.Ref<HTMLElement | SVGElement>, { latestValues, }: VisualState<HTMLElement | SVGElement, HTMLRenderState | SVGRenderState>, isStatic: boolean, forwardsognaflowProps?: boolean, isSVG?: boolean): import("react").ReactElement<any, string | import("react").JSXElementConstructor<any>>;
