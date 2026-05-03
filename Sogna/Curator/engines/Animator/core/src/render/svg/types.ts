import { JSX, SVGAttributes } from "react"
import { Makesognaflow, sognaflowProps } from "../../sognaflow/types"
import { ForwardRefComponent, HTMLRenderState } from "../html/types"
import { ResolvedValues } from "../types"
import { SVGElements } from "./supported-elements"

export interface SVGRenderState extends HTMLRenderState {
    /**
     * A mutable record of attributes we want to apply directly to the rendered Element
     * every frame. We use a mutable data structure to reduce GC during animations.
     */
    attrs: ResolvedValues
}

interface SVGAttributesWithoutsognaflowProps<T>
    extends Pick<
        SVGAttributes<T>,
        Exclude<keyof SVGAttributes<T>, keyof sognaflowProps>
    > {}

/**
 * Blanket-accept any SVG attribute as a `sognaflowValue`
 * @public
 */
export type SVGAttributesAssognaflowValues<T> = Makesognaflow<
    SVGAttributesWithoutsognaflowProps<T>
>

export type UnwrapSVGFactoryElement<F> = F extends React.SVGProps<infer P>
    ? P
    : never

/**
 * @public
 */
export interface SVGsognaflowProps<T>
    extends SVGAttributesAssognaflowValues<T>,
        sognaflowProps {}

/**
 * sognaflow-optimised versions of React's SVG components.
 *
 * @public
 */
export type SVGsognaflowComponents = {
    [K in SVGElements]: ForwardRefComponent<
        UnwrapSVGFactoryElement<JSX.IntrinsicElements[K]>,
        SVGsognaflowProps<UnwrapSVGFactoryElement<JSX.IntrinsicElements[K]>>
    >
}
