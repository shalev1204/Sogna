import { Edge, NamedEdges } from "../types.js";
export declare const namedEdges: Record<NamedEdges, number>;
export declare function resolveEdge(edge: Edge, length: number, inset?: number): number;
