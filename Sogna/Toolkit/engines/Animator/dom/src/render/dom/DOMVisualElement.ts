import { issognaflowValue } from "../../value/utils/is-sognaflow-value"
import type { sognaflowValue } from "../../value"
import type { AnyResolvedKeyframe } from "../../animation/types"
import { DOMKeyframesResolver } from "../../animation/keyframes/DOMKeyframesResolver"
import type { sognaflowNodeOptions } from "../../node/types"
import type { DOMVisualElementOptions } from "./types"
import type { HTMLRenderState } from "../html/types"
import { VisualElement, sognaflowStyle } from "../VisualElement"

export abstract class DOMVisualElement<
    Instance extends HTMLElement | SVGElement = HTMLElement,
    State extends HTMLRenderState = HTMLRenderState,
    Options extends DOMVisualElementOptions = DOMVisualElementOptions
> extends VisualElement<Instance, State, Options> {
    sortInstanceNodePosition(a: Instance, b: Instance): number {
        /**
         * compareDocumentPosition returns a bitmask, by using the bitwise &
         * we're returning true if 2 in that bitmask is set to true. 2 is set
         * to true if b preceeds a.
         */
        return a.compareDocumentPosition(b) & 2 ? 1 : -1
    }

    getBaseTargetFromProps(
        props: sognaflowNodeOptions,
        key: string
    ): AnyResolvedKeyframe | sognaflowValue<any> | undefined {
        const style = (props as sognaflowNodeOptions & { style?: sognaflowStyle }).style
        return style ? (style[key] as string) : undefined
    }

    removeValueFromRenderState(
        key: string,
        { vars, style }: HTMLRenderState
    ): void {
        delete vars[key]
        delete style[key]
    }

    KeyframeResolver = DOMKeyframesResolver

    childSubscription?: VoidFunction
    handleChildsognaflowValue() {
        if (this.childSubscription) {
            this.childSubscription()
            delete this.childSubscription
        }

        const { children } = this.props as sognaflowNodeOptions & { children?: sognaflowValue | any }
        if (issognaflowValue(children)) {
            this.childSubscription = children.on("change", (latest) => {
                if (this.current) {
                    this.current.textContent = `${latest}`
                }
            })
        }
    }
}
