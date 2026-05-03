import { type AnyResolvedKeyframe } from "../../animation/types";
import { ResolvedValues } from "../../render/types";
export declare function hasScale({ scale, scaleX, scaleY }: ResolvedValues): boolean;
export declare function hasTransform(values: ResolvedValues): true | AnyResolvedKeyframe;
export declare function has2DTranslate(values: ResolvedValues): boolean | "" | 0 | undefined;
