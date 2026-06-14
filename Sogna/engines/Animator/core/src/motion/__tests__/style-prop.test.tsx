import { sognaflow, sognaflowConfig, usesognaflowValue } from "../.."
import { nextMicrotask } from "../../gestures/__tests__/utils.js"
import { render } from "../../jest.setup.js"

describe("style prop", () => {
    test("should remove non-set styles", () => {
        function Component({ style }: any) {
            return (
                <sognaflowConfig isStatic>
                    <sognaflow.div data-testid="child" style={style} />
                </sognaflowConfig>
            )
        }

        const { getByTestId, rerender } = render(
            <Component style={{ position: "absolute" }} />
        )

        expect(getByTestId("child")).toHaveStyle("position: absolute")

        rerender(<Component style={{}} />)

        expect(getByTestId("child")).not.toHaveStyle("position: absolute")
    })

    test("should update transforms when passed a new value", async () => {
        const Component = ({ x = 0 }) => {
            return <sognaflow.div style={{ x }} />
        }

        const { container, rerender } = render(<Component />)

        expect(container.firstChild as Element).toHaveStyle("transform: none")

        rerender(<Component x={1} />)

        await nextMicrotask()

        expect(container.firstChild as Element).toHaveStyle(
            "transform: translateX(1px)"
        )

        rerender(<Component x={0} />)

        await nextMicrotask()

        expect(container.firstChild as Element).toHaveStyle("transform: none")
    })

    test("doesn't update transforms that are handled by animation props", () => {
        const Component = ({ x = 0 }) => {
            return (
                <sognaflow.div
                    initial={{ x: 1 }}
                    animate={{ x: 200 }}
                    style={{ x }}
                />
            )
        }

        const { container, rerender } = render(<Component />)

        expect(container.firstChild as Element).toHaveStyle(
            "transform: translateX(1px)"
        )

        rerender(<Component x={2} />)

        expect(container.firstChild as Element).not.toHaveStyle(
            "transform: translateX(2px)"
        )
    })

    test("should update when passed new sognaflowValue", async () => {
        const Component = ({ useX = false }) => {
            const x = usesognaflowValue(1)
            const y = usesognaflowValue(2)
            const z = usesognaflowValue(3)

            return (
                <sognaflow.div
                    style={{
                        x: useX ? x : 0,
                        y: !useX ? y : 0,
                        z: !useX ? z : 0,
                    }}
                />
            )
        }

        const { container, rerender } = render(<Component />)
        expect(container.firstChild as Element).toHaveStyle(
            "transform: translateY(2px) translateZ(3px)"
        )

        rerender(<Component useX />)

        await nextMicrotask()

        expect(container.firstChild as Element).toHaveStyle(
            "transform: translateX(1px)"
        )

        rerender(<Component />)

        await nextMicrotask()

        expect(container.firstChild as Element).toHaveStyle(
            "transform: translateY(2px) translateZ(3px)"
        )
    })

    test("should update when swapping between sognaflow value and static value", async () => {
        const Component = ({ useBackgroundColor = false }) => {
            const backgroundColor = usesognaflowValue("#fff")

            return (
                <sognaflow.div
                    style={{
                        backgroundColor: useBackgroundColor
                            ? backgroundColor
                            : "#000",
                    }}
                />
            )
        }

        const { container, rerender } = render(<Component useBackgroundColor />)
        expect(container.firstChild as Element).toHaveStyle(
            "background-color: rgb(255, 255, 255)"
        )

        rerender(<Component />)

        await nextMicrotask()

        expect(container.firstChild as Element).toHaveStyle(
            "background-color: rgb(0, 0, 0)"
        )

        rerender(<Component useBackgroundColor />)

        await nextMicrotask()

        expect(container.firstChild as Element).toHaveStyle(
            "background-color: rgb(255, 255, 255)"
        )
    })
})
