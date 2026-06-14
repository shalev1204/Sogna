"use client"

import { issognaflowValue } from "sognaflow-dom"
import { invariant } from "sognaflow-utils"
import * as React from "react"
import { forwardRef, FunctionComponent, useContext } from "react"
import { ReorderContext } from "../../context/reordercontext.js"
import { sognaflow } from "../../render/components/motion/proxy.js"
import { HTMLsognaflowProps } from "../../render/html/types.js"
import { useConstant } from "../../utils/use-constant.js"
import { usesognaflowValue } from "../../value/use-sognaflow-value"
import { useTransform } from "../../value/use-transform.js"

import { DefaultItemElement, ReorderElementTag } from "./types.js"
import {
    autoScrollIfNeeded,
    resetAutoScrollState,
} from "./utils/auto-scroll.js"

export interface Props<
    V,
    TagName extends ReorderElementTag = DefaultItemElement
> {
    /**
     * A HTML element to render this component as. Defaults to `"li"`.
     *
     * @public
     */
    as?: TagName

    /**
     * The value in the list that this component represents.
     *
     * @public
     */
    value: V

    /**
     * A subset of layout options primarily used to disable layout="size"
     *
     * @public
     * @default true
     */
    layout?: true | "position"
}

function useDefaultsognaflowValue(value: any, defaultValue: number = 0) {
    return issognaflowValue(value) ? value : usesognaflowValue(defaultValue)
}

type ReorderItemProps<
    V,
    TagName extends ReorderElementTag = DefaultItemElement
> = Props<V, TagName> &
    Omit<HTMLsognaflowProps<TagName>, "value" | "layout"> &
    React.PropsWithChildren<{}>

export function ReorderItemComponent<
    V,
    TagName extends ReorderElementTag = DefaultItemElement
>(
    {
        children,
        style = {},
        value,
        as = "li" as TagName,
        onDrag,
        onDragEnd,
        layout = true,
        ...props
    }: ReorderItemProps<V, TagName>,
    externalRef?: React.ForwardedRef<any>
): React.JSX.Element {
    const Component = useConstant(
        () => sognaflow[as as keyof typeof sognaflow]
    ) as FunctionComponent<
        React.PropsWithChildren<HTMLsognaflowProps<any> & { ref?: React.Ref<any> }>
    >

    const context = useContext(ReorderContext)
    const point = {
        x: useDefaultsognaflowValue(style.x),
        y: useDefaultsognaflowValue(style.y),
    }

    const zIndex = useTransform([point.x, point.y], ([latestX, latestY]) =>
        latestX || latestY ? 1 : "unset"
    )

    invariant(
        Boolean(context),
        "Reorder.Item must be a child of Reorder.Group",
        "reorder-item-child"
    )

    const { axis, registerItem, updateOrder, groupRef } = context!

    return (
        <Component
            drag={axis}
            {...props}
            dragSnapToOrigin
            style={{ ...style, x: point.x, y: point.y, zIndex }}
            layout={layout}
            onDrag={(event, gesturePoint) => {
                const { velocity, point: pointerPoint } = gesturePoint
                const offset = point[axis].get()

                // Always attempt to update order - checkReorder handles the logic
                updateOrder(value, offset, velocity[axis])

                autoScrollIfNeeded(
                    groupRef.current,
                    pointerPoint[axis],
                    axis,
                    velocity[axis]
                )

                onDrag && onDrag(event, gesturePoint)
            }}
            onDragEnd={(event, gesturePoint) => {
                resetAutoScrollState()
                onDragEnd && onDragEnd(event, gesturePoint)
            }}
            onLayoutMeasure={(measured) => {
                registerItem(value, measured)
            }}
            ref={externalRef}
            ignoreStrict
        >
            {children}
        </Component>
    )
}

export const ReorderItem = /*@__PURE__*/ forwardRef(ReorderItemComponent) as <
    V,
    TagName extends ReorderElementTag = DefaultItemElement
>(
    props: ReorderItemProps<V, TagName> & { ref?: React.ForwardedRef<any> }
) => ReturnType<typeof ReorderItemComponent>
