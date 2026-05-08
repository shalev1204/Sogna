import type { Feature } from "sognaflow-dom";
import { CreateVisualElement } from "../../render/types.js";
import { sognaflowProps } from "../types.js";
import { MeasureLayout } from "./layout/measurelayout.js";
interface FeatureClass<Props = unknown> {
    new (props: Props): Feature<Props>;
}
export interface HydratedFeatureDefinition {
    isEnabled: (props: sognaflowProps) => boolean;
    Feature: FeatureClass<unknown>;
    ProjectionNode?: any;
    MeasureLayout?: typeof MeasureLayout;
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
    MeasureLayout?: HydratedFeatureDefinition["MeasureLayout"];
}
export type FeatureDefinitions = {
    [K in keyof HydratedFeatureDefinitions]: FeatureDefinition;
};
export interface FeaturePackage {
    Feature?: HydratedFeatureDefinition["Feature"];
    ProjectionNode?: HydratedFeatureDefinition["ProjectionNode"];
    MeasureLayout?: HydratedFeatureDefinition["MeasureLayout"];
}
export type FeaturePackages = {
    [K in keyof HydratedFeatureDefinitions]: FeaturePackage;
};
export interface FeatureBundle extends FeaturePackages {
    renderer: CreateVisualElement;
}
export type LazyFeatureBundle = () => Promise<FeatureBundle>;
export {};
