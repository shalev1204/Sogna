import { ResolvedValues } from "sognaflow-dom";
import { ScrapesognaflowValuesFromProps } from "../../render/types.js";
import { sognaflowProps } from "../types.js";
export interface VisualState<Instance, RenderState> {
    renderState: RenderState;
    latestValues: ResolvedValues;
    onMount?: (instance: Instance) => void;
}
export type UseVisualState<Instance, RenderState> = (props: sognaflowProps, isStatic: boolean) => VisualState<Instance, RenderState>;
export interface UseVisualStateConfig<RenderState> {
    scrapesognaflowValuesFromProps: ScrapesognaflowValuesFromProps;
    createRenderState: () => RenderState;
}
export declare const makeUseVisualState: <I, RS>(config: UseVisualStateConfig<RS>) => UseVisualState<I, RS>;
