import { createBox, ResolvedValues, VisualElement } from "sognaflow-dom"
import { sognaflowProps, sognaflowStyle } from "../../../sognaflow/types"

export class StateVisualElement extends VisualElement<
    ResolvedValues,
    {},
    { initialState: ResolvedValues }
> {
    type: "state"
    build() {}
    measureInstanceViewportBox = createBox
    removeValueFromRenderState() {}
    renderInstance() {}
    scrapesognaflowValuesFromProps() {
        return {}
    }

    sortInstanceNodePosition() {
        return 0
    }

    getBaseTargetFromProps(props: sognaflowProps, key: string) {
        return props.style
            ? (props.style[key as keyof sognaflowStyle] as any)
            : undefined
    }

    readValueFromInstance(
        _state: {},
        key: string,
        options: { initialState: ResolvedValues }
    ) {
        return options.initialState[key] || 0
    }
}
