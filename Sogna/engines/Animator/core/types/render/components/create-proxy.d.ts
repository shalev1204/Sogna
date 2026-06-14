import { createsognaflowComponent } from "../../motion";
import { FeaturePackages } from "../../motion/features/types";
import { sognaflowProps } from "../../motion/types";
import { DOMsognaflowComponents } from "../dom/types.js";
import { CreateVisualElement } from "../types.js";
/**
 * I'd rather the return type of `custom` to be implicit but this throws
 * incorrect relative paths in the exported types and API Extractor throws
 * a wobbly.
 */
type ComponentProps<Props> = React.PropsWithoutRef<Props & sognaflowProps> & React.RefAttributes<SVGElement | HTMLElement>;
export type CustomDomComponent<Props> = React.ComponentType<ComponentProps<Props>>;
type sognaflowProxy = typeof createsognaflowComponent & DOMsognaflowComponents & {
    create: typeof createsognaflowComponent;
};
export declare function createsognaflowProxy(preloadedFeatures?: FeaturePackages, createVisualElement?: CreateVisualElement<any, any>): sognaflowProxy;
export {};
