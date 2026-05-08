import { IsSognaflowValue } from "../../value/utils/is-sognaflow-value.js"
import type { SognaflowValue } from "../../value"
import type { AnyResolvedKeyframe } from "../../animation/types.js"
import { DOMKeyframesResolver } from "../../animation/keyframes/domkeyframesresolver.js"
import type { SognaflowNodeOptions } from "../../node/types.js"
import type { DOMVisualElementOptions } from "./types.js"
import type { HTMLRenderState } from "../html/types.js"
import { VisualElement, SognaflowStyle } from "../visualelement.js"

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
        props: SognaflowNodeOptions,
        key: string
    ): AnyResolvedKeyframe | SognaflowValue<any> | undefined {
        const style = (props as SognaflowNodeOptions & { style?: SognaflowStyle }).style
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
    handleChildSognaflowValue() {
        if (this.childSubscription) {
            this.childSubscription()
            delete this.childSubscription
        }

        const { children } = this.props as SognaflowNodeOptions & { children?: SognaflowValue | any }
        if (IsSognaflowValue(children)) {
            this.childSubscription = children.on("change", (latest) => {
                if (this.current) {
                    this.current.textContent = `${latest}`
                }
            })
        }
    }
}

