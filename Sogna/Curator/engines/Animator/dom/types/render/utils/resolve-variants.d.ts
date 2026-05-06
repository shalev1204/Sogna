import type { AnimationDefinition, SognaflowNodeOptions, TargetAndTransition, TargetResolver } from "../../node/types.js";
export declare function ResolveVariantFromProps(props: SognaflowNodeOptions, definition: TargetAndTransition | TargetResolver, custom?: any, visualElement?: any): TargetAndTransition;
export declare function ResolveVariantFromProps(props: SognaflowNodeOptions, definition?: AnimationDefinition, custom?: any, visualElement?: any): undefined | TargetAndTransition;
