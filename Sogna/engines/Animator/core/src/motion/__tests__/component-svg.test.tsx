import { useRef } from "react"
import {
    sognaflow,
    sognaflowValue,
    TargetAndTransition,
    usesognaflowValue,
    useTransform,
} from "../../"
import { nextFrame } from "../../gestures/__tests__/utils.js"
import { render } from "../../jest.setup.js"

describe("SVG", () => {
    test("doesn't add translateZ", () => {
        const { getByTestId } = render(
            <svg>
                <sognaflow.g data-testid="g" initial={{ x: 100 }} />
                <sognaflow.g data-testid="h" style={{ x: 100 }} />
            </svg>
        )

        expect(getByTestId("g")).toHaveStyle("transform: translateX(100px)")
        expect(getByTestId("h")).toHaveStyle("transform: translateX(100px)")
    })

    test("accepts attrX/attrY/attrScale in types", () => {
        render(<sognaflow.circle animate={{ attrX: 1, attrY: 2, attrScale: 3 }} />)
    })

    test("recognises sognaflowValues in attributes", async () => {
        let r = sognaflowValue(0)
        let fill = sognaflowValue("#000")

        const Component = () => {
            r = usesognaflowValue(40)
            fill = useTransform(r, [40, 100], ["#00f", "#f00"])

            return (
                <svg>
                    <sognaflow.circle
                        cx={125}
                        cy={125}
                        r={r}
                        fill={fill}
                        animate={{ r: 100 }}
                        transition={{ type: false }}
                    />
                </svg>
            )
        }

        const { rerender } = render(<Component />)
        rerender(<Component />)

        await nextFrame()

        expect(r.get()).toBe(100)
        expect(fill.get()).toBe("rgba(255, 0, 0, 1)")
    })

    test("sognaflow svg elements should be able to set correct type of ref", () => {
        const Component = () => {
            const ref = useRef<SVGTextElement>(null)
            return (
                <svg>
                    <sognaflow.text ref={ref}>sognaflow</sognaflow.text>
                </svg>
            )
        }
        render(<Component />)
    })

    test("doesn't calculate transformOrigin for <svg /> elements", async () => {
        const Component = () => {
            return <sognaflow.svg animate={{ rotate: 100 }} />
        }
        const { container } = render(<Component />)

        await nextFrame()

        expect(container.firstChild as Element).not.toHaveStyle(
            "transform-origin: 0px 0px"
        )
    })

    // // https://github.com/sognaflowdivision/sognaflow/issues/216
    test("doesn't throw if animating unencounterd value", () => {
        const animation: TargetAndTransition = {
            strokeDasharray: ["1px, 200px", "100px, 200px", "100px, 200px"],
            strokeDashoffset: [0, -15, -125],
            transition: { duration: 1.4, ease: "linear" },
        }

        const Component = () => {
            return (
                <sognaflow.svg animate={{ rotate: 100 }}>
                    <sognaflow.circle animate={animation} />
                </sognaflow.svg>
            )
        }
        render(<Component />)
    })

    test("doesn't read viewBox as '0 0 0 0'", async () => {
        const Component = () => {
            return (
                <sognaflow.svg
                    viewBox="0 0 100 100"
                    transition={{ delay: 1 }}
                    animate={{ viewBox: "100 100 200 200" }}
                />
            )
        }
        const { container } = render(<Component />)

        await nextFrame()

        expect(container.firstChild as Element).toHaveAttribute(
            "viewBox",
            "0 0 100 100"
        )
    })

    test("sognaflowValue can be used for transform attribute on g element", async () => {
        const Component = () => {
            const transformValue = usesognaflowValue("translate(50, 50)")

            return (
                <svg>
                    <sognaflow.g transform={transformValue as any}>
                        <sognaflow.rect width={50} height={50} />
                    </sognaflow.g>
                </svg>
            )
        }

        const { container } = render(<Component />)

        await nextFrame()

        const gElement = container.querySelector("g")!
        // The transform should NOT be rendered as "[object Object]"
        expect(gElement.getAttribute("transform")).not.toBe("[object Object]")
        // It should be applied as a CSS style transform
        expect(gElement).toHaveStyle("transform: translate(50, 50)")
    })

    test("animates viewBox", async () => {
        const Component = () => {
            return (
                <sognaflow.svg
                    viewBox="0 0 100 100"
                    transition={{ type: false }}
                    animate={{ viewBox: "100 100 200 200" }}
                />
            )
        }
        const { container } = render(<Component />)

        await nextFrame()

        expect(container.firstChild as Element).toHaveAttribute(
            "viewBox",
            "100 100 200 200"
        )
    })
})
