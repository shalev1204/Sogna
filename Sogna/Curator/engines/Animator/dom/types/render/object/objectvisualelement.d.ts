import { ResolvedValues } from "../types.js";
import { VisualElement } from "../visualelement.js";
interface ObjectRenderState {
    output: ResolvedValues;
}
export declare class ObjectVisualElement extends VisualElement<Object, ObjectRenderState> {
    type: string;
    readValueFromInstance(instance: Object, key: string): undefined;
    getBaseTargetFromProps(): undefined;
    removeValueFromRenderState(key: string, renderState: ObjectRenderState): void;
    measureInstanceViewportBox(): import("sognaflow-utils").Box;
    build(renderState: ObjectRenderState, latestValues: ResolvedValues): void;
    renderInstance(instance: Object, { output }: ObjectRenderState): void;
    sortInstanceNodePosition(): number;
}
export {};
