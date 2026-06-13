import type { NodeGroup } from "sognaflow-dom";
export interface LayoutGroupContextProps {
    id?: string;
    group?: NodeGroup;
    forceRender?: VoidFunction;
}
export declare const LayoutGroupContext: import("react").Context<LayoutGroupContextProps>;
