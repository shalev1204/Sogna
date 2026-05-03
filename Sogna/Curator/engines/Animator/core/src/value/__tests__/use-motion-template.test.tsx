import { sognaflowValue, sognaflowValue } from "sognaflow-dom"
import { useEffect } from "react"
import { sognaflow } from "../../"
import { nextMicrotask } from "../../gestures/__tests__/utils"
import { render } from "../../jest.setup"
import { usesognaflowTemplate } from "../use-sognaflow-template"
import { usesognaflowValue } from "../use-sognaflow-value"

describe("usesognaflowTemplate", () => {
    test("sets initial value", async () => {
        const Component = () => {
            const x = usesognaflowValue(1)
            const y = usesognaflowValue(2)
            const transform = usesognaflowTemplate`translateX(${x}px) translateY(${y}px)`
            return <sognaflow.div style={{ transform }} />
        }

        const { container } = render(<Component />)

        expect(container.firstChild).toHaveStyle(
            `transform: translateX(1px) translateY(2px)`
        )
    })

    test("responds to manual setting from parent value", async () => {
        const Component = () => {
            const x = usesognaflowValue(1)
            const y = usesognaflowValue(2)
            const transform = usesognaflowTemplate`translateX(${x}px) translateY(${y}px)`

            useEffect(() => {
                x.set(10)
            }, [])

            return <sognaflow.div style={{ transform }} />
        }

        const { container, rerender } = render(<Component />)
        rerender(<Component />)
        const { firstChild } = container

        return new Promise<void>((resolve) => {
            requestAnimationFrame(() => {
                expect(firstChild).toHaveStyle(
                    `transform: translateX(10px) translateY(2px)`
                )
                resolve()
            })
        })
    })

    test("can be re-pointed to another `sognaflowValue`", async () => {
        const a = sognaflowValue(1)
        const b = sognaflowValue(2)
        const Component = ({ value }: { value: sognaflowValue }) => {
            const transform = usesognaflowTemplate`translateX(${value}px)`
            return <sognaflow.div style={{ transform }} />
        }

        const { container, rerender } = render(<Component value={a} />)

        expect(container.firstChild).toHaveStyle(`transform: translateX(1px)`)

        rerender(<Component value={b} />)

        await nextMicrotask()

        expect(container.firstChild).toHaveStyle(`transform: translateX(2px)`)
    })

    test("respects static values", async () => {
        const Component = ({ y }: { y: number }) => {
            const x = usesognaflowValue(1)
            const transform = usesognaflowTemplate`translateX(${x}px) translateY(${y}px)`
            return <sognaflow.div style={{ transform }} />
        }

        const { container, rerender } = render(<Component y={1} />)

        expect(container.firstChild).toHaveStyle(
            `transform: translateX(1px) translateY(1px)`
        )
        rerender(<Component y={2} />)
        await nextMicrotask()
        expect(container.firstChild).toHaveStyle(
            `transform: translateX(1px) translateY(2px)`
        )
    })
})
