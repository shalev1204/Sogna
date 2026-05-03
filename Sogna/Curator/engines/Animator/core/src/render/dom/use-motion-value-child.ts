"use client"

import { sognaflowValue, type VisualElement } from "sognaflow-dom"
import { useConstant } from "../../utils/use-constant"
import { usesognaflowValueEvent } from "../../utils/use-sognaflow-value-event"

export function usesognaflowValueChild(
    children: sognaflowValue<number | string>,
    visualElement?: VisualElement<HTMLElement | SVGElement>
) {
    const render = useConstant(() => children.get())

    usesognaflowValueEvent(children, "change", (latest) => {
        if (visualElement && visualElement.current) {
            visualElement.current.textContent = `${latest}`
        }
    })

    return render
}
