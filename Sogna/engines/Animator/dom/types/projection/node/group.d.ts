import { IProjectionNode } from "./types.js";
export interface NodeGroup {
    add: (node: IProjectionNode) => void;
    remove: (node: IProjectionNode) => void;
    dirty: VoidFunction;
}
export declare function nodeGroup(): NodeGroup;
