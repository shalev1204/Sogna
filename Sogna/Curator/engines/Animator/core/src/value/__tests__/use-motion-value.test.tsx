import { sognaflowValue, sognaflowValue } from "sognaflow-dom"
import { sognaflow } from "../../"
import { nextMicrotask } from "../../gestures/__tests__/utils.js"
import { render } from "../../jest.setup.js"
import { usesognaflowValue } from "../use-sognaflow-value"

describe("usesognaflowValue", () => {
    test("sets initial value", async () => {
        const Component = () => {
            const x = usesognaflowValue(100)
            return <sognaflow.div style={{ x }} />
        }

        const { container } = render(<Component />)
        expect(container.firstChild).toHaveStyle("transform: translateX(100px)")
    })

    test("can be set manually", async () => {
        const Component = () => {
            const x = usesognaflowValue(100)

            x.set(500)

            return <sognaflow.div style={{ x }} />
        }

        const { container } = render(<Component />)
        expect(container.firstChild).toHaveStyle("transform: translateX(500px)")
    })

    test("accepts new sognaflow values", async () => {
        const a = sognaflowValue(0)
        const b = sognaflowValue(5)
        const Component = ({ x }: { x: sognaflowValue<number> }) => {
            return <sognaflow.div style={{ x }} />
        }

        const { container, rerender } = render(<Component x={a} />)
        expect(container.firstChild).toHaveStyle("transform: none")

        rerender(<Component x={b} />)

        await nextMicrotask()

        expect(container.firstChild).toHaveStyle("transform: translateX(5px)")
    })

    test("fires callbacks", async () => {
        const onChange = jest.fn()
        const Component = () => {
            const x = usesognaflowValue(100)
            x.on("change", onChange)

            x.set(500)

            return <sognaflow.div style={{ x }} />
        }

        render(<Component />)
        expect(onChange).toHaveBeenCalled()
    })

    test("is typed", async () => {
        const Component = () => {
            const x = usesognaflowValue(100)
            return <sognaflow.div style={{ x }} />
        }

        const { container } = render(<Component />)
        expect(container.firstChild).toHaveStyle("transform: translateX(100px)")
    })
})
