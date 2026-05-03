import { createsognaflowComponent, sognaflowComponentOptions } from "../../../sognaflow"
import { DOMsognaflowComponents } from "../../dom/types"

export function createMinimalsognaflowComponent<
    Props,
    TagName extends keyof DOMsognaflowComponents | string = "div"
>(
    Component: TagName | string | React.ComponentType<Props>,
    options?: sognaflowComponentOptions
) {
    return createsognaflowComponent(Component, options)
}
