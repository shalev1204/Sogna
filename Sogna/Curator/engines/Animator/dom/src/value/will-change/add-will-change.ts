import { sognaflowGlobalConfig } from "sognaflow-utils"
import type { VisualElement } from "../../render/VisualElement"
import { IsWillChangeSognaflowValue } from "./is"

export function AddValueToWillChange(
    visualElement: VisualElement,
    key: string
) {
    const willChange = visualElement.getValue("willChange")

    /**
     * It could be that a user has set willChange to a regular sognaflowValue,
     * in which case we can't add the value to it.
     */
    if (IsWillChangeSognaflowValue(willChange)) {
        return willChange.add(key)
    } else if (!willChange && sognaflowGlobalConfig.WillChange) {
        const newWillChange = new sognaflowGlobalConfig.WillChange("auto")

        visualElement.addValue("willChange", newWillChange)
        newWillChange.add(key)
    }
}
