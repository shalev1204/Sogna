import { type AnyResolvedKeyframe } from "../../animation/types.js";
import { ResolvedValues } from "../../render/types.js";
export declare function hasScale({ scale, scaleX, scaleY }: ResolvedValues): boolean;
export declare function hasTransform(values: ResolvedValues): true | AnyResolvedKeyframe;
export declare function has2DTranslate(values: ResolvedValues): boolean | "" | 0 | undefined;
