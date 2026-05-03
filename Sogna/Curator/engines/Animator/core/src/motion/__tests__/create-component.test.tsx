import { sognaflowValue } from "sognaflow-dom"
import { render } from "../../jest.setup"
import { sognaflow as sognaflowProxy } from "../../render/components/sognaflow/proxy"

const sognaflow = { div: sognaflowProxy.create("div") }

describe("Create DOM sognaflow component", () => {
    test("Animates", async () => {
        const promise = new Promise((resolve) => {
            const x = sognaflowValue(0)
            const onComplete = () => resolve(x.get())
            const Component = () => (
                <sognaflow.div
                    animate={{ x: 20 }}
                    style={{ x }}
                    onAnimationComplete={onComplete}
                />
            )
            const { rerender } = render(<Component />)
            rerender(<Component />)
        })

        return expect(promise).resolves.toBe(20)
    })
})
