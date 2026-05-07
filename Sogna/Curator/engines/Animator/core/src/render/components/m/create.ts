import { createsognaflowComponent, sognaflowComponentOptions } from "../../../motion"
import { DOMsognaflowComponents } from "../../dom/types.js"

export function createMinimalsognaflowComponent<
    Props,
    TagName extends keyof DOMsognaflowComponents | string = "div"
>(
    Component: TagName | string | React.ComponentType<Props>,
    options?: sognaflowComponentOptions
) {
    return createsognaflowComponent(Component, options)
}
