import { type TransformOrigin, type HTMLRenderState } from "sognaflow-dom";
import { PropsWithoutRef, RefAttributes, JSX } from "react";
import { sognaflowProps } from "../../motion/types";
import { HTMLElements } from "./supported-elements.js";
export type { TransformOrigin, HTMLRenderState };
/**
 * @public
 */
export type ForwardRefComponent<T, P> = {
    readonly $$typeof: symbol;
} & ((props: PropsWithoutRef<P> & RefAttributes<T>) => JSX.Element);
type AttributesWithoutsognaflowProps<Attributes> = {
    [K in Exclude<keyof Attributes, keyof sognaflowProps>]?: Attributes[K];
};
/**
 * @public
 */
export type HTMLsognaflowProps<Tag extends keyof HTMLElements> = AttributesWithoutsognaflowProps<JSX.IntrinsicElements[Tag]> & sognaflowProps;
/**
 * sognaflow-optimised versions of React's HTML components.
 *
 * @public
 */
export type HTMLsognaflowComponents = {
    [K in keyof HTMLElements]: ForwardRefComponent<HTMLElements[K], HTMLsognaflowProps<K>>;
};
