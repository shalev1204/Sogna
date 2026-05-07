"use client";
import { animateVisualElement, createBox, VisualElement, } from "sognaflow-dom";
import { useLayoutEffect, useState } from "react";
import { makeUseVisualState } from "../../motion/utils/use-visual-state";
import { useConstant } from "../../utils/use-constant.js";
const createObject = () => ({});
class StateVisualElement extends VisualElement {
    constructor() {
        super(...arguments);
        this.measureInstanceViewportBox = createBox;
    }
    build() { }
    resetTransform() { }
    restoreTransform() { }
    removeValueFromRenderState() { }
    renderInstance() { }
    scrapesognaflowValuesFromProps() {
        return createObject();
    }
    getBaseTargetFromProps() {
        return undefined;
    }
    readValueFromInstance(_state, key, options) {
        return options.initialState[key] || 0;
    }
    sortInstanceNodePosition() {
        return 0;
    }
}
const useVisualState = makeUseVisualState({
    scrapesognaflowValuesFromProps: createObject,
    createRenderState: createObject,
});
/**
 * This is not an officially supported API and may be removed
 * on any version.
 */
export function useAnimatedState(initialState) {
    const [animationState, setAnimationState] = useState(initialState);
    const visualState = useVisualState({}, false);
    const element = useConstant(() => {
        return new StateVisualElement({
            props: {
                onUpdate: (v) => {
                    setAnimationState({ ...v });
                },
            },
            visualState,
            presenceContext: null,
        }, { initialState });
    });
    useLayoutEffect(() => {
        element.mount({});
        return () => element.unmount();
    }, [element]);
    const startAnimation = useConstant(() => (animationDefinition) => {
        return animateVisualElement(element, animationDefinition);
    });
    return [animationState, startAnimation];
}
//# sourceMappingURL=use-animated-state.js.map