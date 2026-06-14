import { frame, sognaflowValue } from "sognaflow-dom"
import { render } from "../../jest.setup.js"
import { sognaflow } from "../../render/components/sognaflow"

describe("child as sognaflow value", () => {
    test("accepts sognaflow values as children", async () => {
        const promise = new Promise<HTMLDivElement>((resolve) => {
            const child = sognaflowValue(1)
            const Component = () => <sognaflow.div>{child}</sognaflow.div>
            const { container, rerender } = render(<Component />)
            rerender(<Component />)
            resolve(container.firstChild as HTMLDivElement)
        })

        return expect(promise).resolves.toHaveTextContent("1")
    })

    test("accepts sognaflow values as children for sognaflow.text inside an svg", async () => {
        const promise = new Promise<SVGTextElement>((resolve) => {
            const child = sognaflowValue(3)
            const Component = () => (
                <svg>
                    <sognaflow.text>{child}</sognaflow.text>
                </svg>
            )
            const { container, rerender } = render(<Component />)
            rerender(<Component />)
            resolve(container.firstChild?.firstChild as SVGTextElement)
        })

        return expect(promise).resolves.toHaveTextContent("3")
    })

    test("updates textContent when sognaflow value changes", async () => {
        const promise = new Promise<HTMLDivElement>((resolve) => {
            const child = sognaflowValue(1)
            const Component = () => <sognaflow.div>{child}</sognaflow.div>
            const { container, rerender } = render(<Component />)
            rerender(<Component />)

            frame.postRender(() => {
                child.set(2)

                frame.postRender(() => {
                    resolve(container.firstChild as HTMLDivElement)
                })
            })
        })

        return expect(promise).resolves.toHaveTextContent("2")
    })

    test("updates svg text when sognaflow value changes", async () => {
        const promise = new Promise<SVGTextElement>((resolve) => {
            const child = sognaflowValue(3)
            const Component = () => (
                <svg>
                    <sognaflow.text>{child}</sognaflow.text>
                </svg>
            )
            const { container, rerender } = render(<Component />)
            rerender(<Component />)

            frame.postRender(() => {
                child.set(4)

                frame.postRender(() => {
                    resolve(container.firstChild?.firstChild as SVGTextElement)
                })
            })
        })

        return expect(promise).resolves.toHaveTextContent("4")
    })
})
