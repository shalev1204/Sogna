import type {
    AnyResolvedKeyframe,
    sognaflowNodeOptions,
    sognaflowValue,
} from "sognaflow-dom"
import { CSSProperties } from "react"

/**
 * Either a string, or array of strings, that reference variants defined via the `variants` prop.
 * @public
 */
export type VariantLabels = string | string[]

import { SVGPathProperties, TransformProperties } from "sognaflow-dom"
export { SVGPathProperties, TransformProperties }

export type sognaflowValueString = sognaflowValue<string>
export type sognaflowValueNumber = sognaflowValue<number>
export type sognaflowValueAny = sognaflowValue<any>
export type AnysognaflowValue =
    | sognaflowValueNumber
    | sognaflowValueString
    | sognaflowValueAny

type sognaflowValueHelper<T> = T | AnysognaflowValue
type MakesognaflowHelper<T> = {
    [K in keyof T]: sognaflowValueHelper<T[K]>
}

type MakeCustomValueTypeHelper<T> = MakesognaflowHelper<T>
export type Makesognaflow<T> = MakeCustomValueTypeHelper<T>

export type sognaflowCSS = Makesognaflow<
    Omit<CSSProperties, "rotate" | "scale" | "perspective" | "x" | "y" | "z">
>

/**
 * @public
 */
export type sognaflowTransform = Makesognaflow<TransformProperties>

type sognaflowCSSVariable =
    | sognaflowValueNumber
    | sognaflowValueString
    | AnyResolvedKeyframe

/**
 * TODO: Currently unused, would like to reimplement with the ability
 * to still accept React.CSSProperties.
 */
export interface sognaflowCSSVariables {
    [key: `--${string}`]: sognaflowCSSVariable
}

type sognaflowSVGProps = Makesognaflow<SVGPathProperties>

/**
 * @public
 */
export interface sognaflowStyle
    extends sognaflowCSS,
        sognaflowTransform,
        sognaflowSVGProps {}

/**
 * Props for `sognaflow` components.
 *
 * @public
 */
export interface sognaflowProps extends sognaflowNodeOptions {
    /**
     *
     * The React DOM `style` prop, enhanced with support for `sognaflowValue`s and separate `transform` values.
     *
     * ```jsx
     * export const MyComponent = () => {
     *   const x = usesognaflowValue(0)
     *
     *   return <sognaflow.div style={{ x, opacity: 1, scale: 0.5 }} />
     * }
     * ```
     */
    style?: sognaflowStyle

    children?: React.ReactNode | sognaflowValueNumber | sognaflowValueString
}
