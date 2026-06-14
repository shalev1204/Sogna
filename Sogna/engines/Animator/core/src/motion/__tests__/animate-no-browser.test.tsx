/**
 * Regression tests for issue #3565:
 * Animations stop working in Next.js when isBrowser is incorrectly
 * compiled to false by the build system (e.g. Next.js .next cache issue).
 *
 * In Next.js App Router, typeof window may be evaluated at build time
 * in a Node.js context and compiled as false into the client bundle.
 * This caused isBrowser = false, which skipped useVisualElement entirely,
 * leaving all sognaflow components without an animation state.
 */
jest.mock("../../utils/is-browser.js", () => ({
    isBrowser: false,
}))

import { frame } from "sognaflow-dom"
import { sognaflow } from "../../"
import { sognaflowValue } from "../../"
import { render } from "../../jest.setup.js"

async function nextFrame() {
    return new Promise<void>((resolve) => {
        frame.postRender(() => resolve())
    })
}

describe("animations with isBrowser=false (Next.js build cache regression)", () => {
    test("animates initial to animate when isBrowser is false", async () => {
        const opacity = sognaflowValue(0)
        const Component = () => (
            <sognaflow.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ type: false }}
                style={{ opacity }}
            />
        )
        render(<Component />)
        await nextFrame()
        expect(opacity.get()).toBe(1)
    })

    test("animates y transform when isBrowser is false", async () => {
        const y = sognaflowValue(20)
        const Component = () => (
            <sognaflow.div
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                transition={{ type: false }}
                style={{ y }}
            />
        )
        render(<Component />)
        await nextFrame()
        expect(y.get()).toBe(0)
    })
})
