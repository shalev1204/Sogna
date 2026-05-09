import type { Feature } from "sognaflow-dom";
import { CreateVisualElement } from "../../render/types.js";
import { sognaflowProps } from "../types.js";
import { Measuhubout } from "./layout/measuhubout.js";
interface FeatureClass<Props = unknown> {
    new (props: Props): Feature<Props>;
}
export interface HydratedFeatureDefinition {
    isEnabled: (props: sognaflowProps) => boolean;
    Feature: FeatureClass<unknown>;
    ProjectionNode?: any;
    Measuhubout?: typeof Measuhubout;
}
export interface HydratedFeatureDefinitions {
    animation?: HydratedFeatureDefinition;
    exit?: HydratedFeatureDefinition;
    drag?: HydratedFeatureDefinition;
    tap?: HydratedFeatureDefinition;
    focus?: HydratedFeatureDefinition;
    hover?: HydratedFeatureDefinition;
    pan?: HydratedFeatureDefinition;
    inView?: HydratedFeatureDefinition;
    layout?: HydratedFeatureDefinition;
}
export interface FeatureDefinition {
    isEnabled: HydratedFeatureDefinition["isEnabled"];
    Feature?: HydratedFeatureDefinition["Feature"];
    ProjectionNode?: HydratedFeatureDefinition["ProjectionNode"];
    Measuhubout?: HydratedFeatureDefinition["Measuhubout"];
}
export type FeatureDefinitions = {
    [K in keyof HydratedFeatureDefinitions]: FeatureDefinition;
};
export interface FeaturePackage {
    Feature?: HydratedFeatureDefinition["Feature"];
    ProjectionNode?: HydratedFeatureDefinition["ProjectionNode"];
    Measuhubout?: HydratedFeatureDefinition["Measuhubout"];
}
export type FeaturePackages = {
    [K in keyof HydratedFeatureDefinitions]: FeaturePackage;
};
export interface FeatureBundle extends FeaturePackages {
    renderer: CreateVisualElement;
}
export type LazyFeatureBundle = () => Promise<FeatureBundle>;
export {};
