import { hasReducedsognaflowListener } from "sognaflow-dom"
import { render } from "../../../jest.setup.js"
import { sognaflow } from "../../../render/components/sognaflow"
import { sognaflowConfig } from "../../../components/sognaflowconfig"

describe("reduced sognaflow listener initialization", () => {
    beforeEach(() => {
        // Reset the listener state before each test
        hasReducedsognaflowListener.current = false
    })

    test("should not initialize listener when reducedsognaflowConfig is 'never'", () => {
        const Component = () => (
            <sognaflowConfig reducedsognaflow="never">
                <sognaflow.div animate={{ opacity: 1 }} />
            </sognaflowConfig>
        )

        render(<Component />)

        // When reducedsognaflowConfig is "never", the listener should not be initialized
        expect(hasReducedsognaflowListener.current).toBe(false)
    })

    test("should not initialize listener when reducedsognaflowConfig is 'always'", () => {
        const Component = () => (
            <sognaflowConfig reducedsognaflow="always">
                <sognaflow.div animate={{ opacity: 1 }} />
            </sognaflowConfig>
        )

        render(<Component />)

        // When reducedsognaflowConfig is "always", the listener should not be initialized
        expect(hasReducedsognaflowListener.current).toBe(false)
    })

    test("should initialize listener when reducedsognaflowConfig is 'user'", () => {
        const Component = () => (
            <sognaflowConfig reducedsognaflow="user">
                <sognaflow.div animate={{ opacity: 1 }} />
            </sognaflowConfig>
        )

        render(<Component />)

        // When reducedsognaflowConfig is "user", the listener should be initialized
        // to detect the user's prefers-reduced-sognaflow setting
        expect(hasReducedsognaflowListener.current).toBe(true)
    })

    test("should not initialize listener with default config (defaults to 'never')", () => {
        // The default sognaflowConfigContext has reducedsognaflow: "never"
        const Component = () => <sognaflow.div animate={{ opacity: 1 }} />

        render(<Component />)

        // Default context has reducedsognaflow: "never", so no listener
        expect(hasReducedsognaflowListener.current).toBe(false)
    })

    test("should initialize listener only once across multiple components with 'user' config", () => {
        hasReducedsognaflowListener.current = false

        const Component = () => (
            <sognaflowConfig reducedsognaflow="user">
                <sognaflow.div animate={{ opacity: 1 }} />
                <sognaflow.div animate={{ x: 100 }} />
                <sognaflow.div animate={{ scale: 1.5 }} />
            </sognaflowConfig>
        )

        render(<Component />)

        // The listener should have been initialized once
        expect(hasReducedsognaflowListener.current).toBe(true)
    })

    test("mixed configurations - 'never' and 'always' do not trigger listener", () => {
        hasReducedsognaflowListener.current = false

        const Component = () => (
            <>
                <sognaflowConfig reducedsognaflow="never">
                    <sognaflow.div data-testid="never" animate={{ opacity: 1 }} />
                </sognaflowConfig>
                <sognaflowConfig reducedsognaflow="always">
                    <sognaflow.div data-testid="always" animate={{ opacity: 1 }} />
                </sognaflowConfig>
            </>
        )

        render(<Component />)

        // Neither "never" nor "always" should trigger listener initialization
        expect(hasReducedsognaflowListener.current).toBe(false)
    })

    test("'user' config triggers listener, explicit 'never'/'always' do not", () => {
        hasReducedsognaflowListener.current = false

        const ComponentWithNever = () => (
            <sognaflowConfig reducedsognaflow="never">
                <sognaflow.div animate={{ opacity: 1 }} />
            </sognaflowConfig>
        )

        const ComponentWithUser = () => (
            <sognaflowConfig reducedsognaflow="user">
                <sognaflow.div animate={{ opacity: 1 }} />
            </sognaflowConfig>
        )

        // First render with "never" - should not initialize listener
        const { unmount: unmount1 } = render(<ComponentWithNever />)
        expect(hasReducedsognaflowListener.current).toBe(false)
        unmount1()

        // Then render with "user" - should initialize listener
        hasReducedsognaflowListener.current = false
        render(<ComponentWithUser />)
        expect(hasReducedsognaflowListener.current).toBe(true)
    })
})
