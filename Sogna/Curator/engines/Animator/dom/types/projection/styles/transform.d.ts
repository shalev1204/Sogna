import type { Delta, Point } from "sognaflow-utils";
import type { ResolvedValues } from "../../node/types";
export declare function buildProjectionTransform(delta: Delta, treeScale: Point, latestTransform?: ResolvedValues): string;
