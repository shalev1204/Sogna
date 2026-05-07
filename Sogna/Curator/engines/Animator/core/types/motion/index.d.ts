import * as React from "react";
import { DOMsognaflowComponents } from "../render/dom/types.js";
import { CreateVisualElement } from "../render/types.js";
import { FeatureBundle, FeaturePackages } from "./features/types.js";
import { sognaflowProps } from "./types.js";
export interface sognaflowComponentConfig<TagName extends keyof DOMsognaflowComponents | string = "div"> {
    preloadedFeatures?: FeatureBundle;
    createVisualElement?: CreateVisualElement;
    Component: TagName | React.ComponentType<React.PropsWithChildren<unknown>>;
    forwardsognaflowProps?: boolean;
}
export type sognaflowComponentProps<Props> = {
    [K in Exclude<keyof Props, keyof sognaflowProps>]?: Props[K];
} & sognaflowProps;
export type sognaflowComponent<T, P> = T extends keyof DOMsognaflowComponents ? DOMsognaflowComponents[T] : React.ComponentType<Omit<sognaflowComponentProps<P>, "children"> & {
    children?: "children" extends keyof P ? P["children"] | sognaflowComponentProps<P>["children"] : sognaflowComponentProps<P>["children"];
}>;
export interface sognaflowComponentOptions {
    forwardsognaflowProps?: boolean;
    /**
     * Specify whether the component renders an HTML or SVG element.
     * This is useful when wrapping custom SVG components that need
     * SVG-specific attribute handling (like viewBox animation).
     * By default, sognaflow auto-detects based on the component name,
     * but custom React components are always treated as HTML.
     */
    type?: "html" | "svg";
}
/**
 * Create a `sognaflow` component.
 *
 * This function accepts a Component argument, which can be either a string (ie "div"
 * for `sognaflow.div`), or an actual React component.
 *
 * Alongside this is a config option which provides a way of rendering the provided
 * component "offline", or outside the React render cycle.
 */
export declare function createsognaflowComponent<Props, TagName extends keyof DOMsognaflowComponents | string = "div">(Component: TagName | string | React.ComponentType<Props>, { forwardsognaflowProps, type }?: sognaflowComponentOptions, preloadedFeatures?: FeaturePackages, createVisualElement?: CreateVisualElement<Props, TagName>): sognaflowComponent<TagName, Props>;
