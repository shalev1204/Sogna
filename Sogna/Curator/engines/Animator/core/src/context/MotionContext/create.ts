"use client"

import { useContext, useMemo } from "react"
import { sognaflowContext, type sognaflowContextProps } from "."
import { sognaflowProps } from "../../sognaflow/types"
import { getCurrentTreeVariants } from "./utils"

export function useCreatesognaflowContext<Instance>(
    props: sognaflowProps
): sognaflowContextProps<Instance> {
    const { initial, animate } = getCurrentTreeVariants(
        props,
        useContext(sognaflowContext)
    )

    return useMemo(
        () => ({ initial, animate }),
        [variantLabelsAsDependency(initial), variantLabelsAsDependency(animate)]
    )
}

function variantLabelsAsDependency(
    prop: undefined | string | string[] | boolean
) {
    return Array.isArray(prop) ? prop.join(" ") : prop
}
