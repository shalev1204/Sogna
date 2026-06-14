import { sognaflowValue, stagger, globalProjectionState } from "sognaflow-dom"
import { useEffect } from "react"
import { sognaflow, usesognaflowValue } from "../.."
import { sognaflowConfig } from "../../components/sognaflowconfig"
import { render } from "../../jest.setup.js"

describe("isStatic prop", () => {
    test("it prevents rendering of animated values", async () => {
        const promise = new Promise((resolve) => {
            const scale = sognaflowValue(0)
            const Component = () => (
                <sognaflowConfig isStatic>
                    <sognaflow.div
                        animate={{ scale: 2 }}
                        transition={{ type: false }}
                        style={{ scale }}
                    />
                </sognaflowConfig>
            )

            const { rerender } = render(<Component />)
            rerender(<Component />)

            setTimeout(() => resolve(scale.get()), 50)
        })

        return expect(promise).resolves.toBe(0)
    })

    test("it permits updating transform values via style", () => {
        function Component({ x }: { x: number }) {
            return (
                <sognaflowConfig isStatic>
                    <sognaflow.div data-testid="child" style={{ x }} />
                </sognaflowConfig>
            )
        }
        const { getByTestId, rerender } = render(<Component x={100} />)
        rerender(<Component x={200} />)

        expect(getByTestId("child") as Element).toHaveStyle(
            "transform: translateX(200px)"
        )
    })

    test("it removes unused styles", () => {
        function Component({ z }: { z?: number }) {
            return (
                <sognaflowConfig isStatic>
                    <sognaflow.div data-testid="child" style={{ z }} />
                </sognaflowConfig>
            )
        }

        const { getByTestId, rerender } = render(<Component z={100} />)

        expect(getByTestId("child") as Element).toHaveStyle(
            "transform: translateZ(100px)"
        )

        rerender(<Component />)

        expect(getByTestId("child") as Element).not.toHaveStyle(
            "transform: translateZ(100px)"
        )
    })

    test("it doesn't respond to updates in `initial`", () => {
        function Component({ x }: { x?: number }) {
            return (
                <sognaflowConfig isStatic={false}>
                    <sognaflow.div data-testid="child" initial={{ x }} />
                </sognaflowConfig>
            )
        }
        const { getByTestId, rerender } = render(<Component x={100} />)
        rerender(<Component x={200} />)

        expect(getByTestId("child") as Element).toHaveStyle(
            "transform: translateX(100px)"
        )
    })

    test("it responds to updates in `initial` if isStatic", () => {
        function Component({ x }: { x?: number }) {
            return (
                <sognaflowConfig isStatic>
                    <sognaflow.div data-testid="child" initial={{ x }} />
                </sognaflowConfig>
            )
        }
        const { getByTestId, rerender } = render(<Component x={100} />)
        rerender(<Component x={200} />)

        expect(getByTestId("child") as Element).toHaveStyle(
            "transform: translateX(200px)"
        )
    })

    test("it doesn't override defined styles if values are removed", () => {
        function Component({
            initial,
        }: {
            initial?: { [key: string]: number }
        }) {
            return (
                <sognaflowConfig isStatic>
                    <sognaflow.div
                        data-testid="child"
                        initial={initial}
                        style={{ opacity: 0.5 }}
                    />
                </sognaflowConfig>
            )
        }
        const { getByTestId, rerender } = render(
            <Component initial={{ opacity: 0.8 }} />
        )

        expect(getByTestId("child") as Element).toHaveStyle("opacity: 0.8")

        rerender(<Component />)

        expect(getByTestId("child") as Element).toHaveStyle("opacity: 0.5")
    })

    test("it propagates changes in `initial` if isStatic", () => {
        const variants = {
            visible: { opacity: 1 },
            hidden: { opacity: 0 },
        }

        const Component = ({ initial }: { initial: string }) => (
            <sognaflowConfig isStatic>
                <sognaflow.div
                    data-testid="parent"
                    initial={initial}
                    variants={variants}
                >
                    <sognaflow.div data-testid="child" variants={variants} />
                </sognaflow.div>
            </sognaflowConfig>
        )

        const { getByTestId, rerender } = render(
            <Component initial="visible" />
        )
        rerender(<Component initial="hidden" />)

        expect(getByTestId("parent")).toHaveStyle("opacity: 0")
        expect(getByTestId("child")).toHaveStyle("opacity: 0")
    })

    test("it prevents rendering of children via context", async () => {
        const promise = new Promise((resolve) => {
            const scale = sognaflowValue(0)
            const Component = () => (
                <sognaflowConfig isStatic>
                    <sognaflow.div
                        animate={{ opacity: 0 }}
                        transition={{ type: false }}
                    >
                        <sognaflow.button
                            animate={{ scale: 2 }}
                            transition={{ type: false }}
                            style={{ scale }}
                        />
                    </sognaflow.div>
                </sognaflowConfig>
            )

            const { rerender } = render(<Component />)
            rerender(<Component />)

            setTimeout(() => resolve(scale.get()), 50)
        })

        return expect(promise).resolves.toBe(0)
    })

    it("accepts externally-defined transition", () => {
        const transition = {
            delayChildren: stagger(10, { from: "last" }),
            when: "beforeChildren",
        }
        function Test() {
            return (
                <sognaflowConfig isStatic>
                    <sognaflow.div data-testid="child" transition={transition} />
                </sognaflowConfig>
            )
        }

        const { getByTestId, rerender } = render(<Test />)

        rerender(<Test />)

        expect(getByTestId("child")).toBeTruthy()
    })

    test("it reflects changes in attached sognaflow values", async () => {
        function Component() {
            const x = usesognaflowValue(10)

            useEffect(() => x.set(20), [x])

            return <sognaflow.div data-testid="child" style={{ x }} />
        }
        const { getByTestId } = render(
            <sognaflowConfig isStatic>
                <Component />
            </sognaflowConfig>
        )

        return new Promise((resolve) => {
            setTimeout(() => {
                expect(getByTestId("child") as Element).toHaveStyle(
                    "transform: translateX(20px)"
                )
                resolve(undefined)
            }, 40)
        })
    })

    test("it does not assign projection id to the node", () => {
        function Component({ x }: { x: number }) {
            return (
                <sognaflowConfig isStatic>
                    <sognaflow.div data-testid="a" style={{ x }} />
                </sognaflowConfig>
            )
        }
        globalProjectionState.hasEverUpdated = true
        const { getByTestId } = render(<Component x={100} />)

        expect(getByTestId("a") as Element).not.toHaveAttribute(
            "data-projection-id"
        )
    })
})
