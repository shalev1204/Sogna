import { render } from "../../jest.setup.js"
import { usesognaflowValue } from "../../value/use-sognaflow-value"
import { usesognaflowValueEvent } from "../use-sognaflow-value-event"

describe("usesognaflowValueEvent", () => {
    test("usesognaflowValueEvent infers type for change callback", () => {
        const Component = () => {
            const x = usesognaflowValue(0)
            usesognaflowValueEvent(x, "change", (latest) => latest / 2)
            return null
        }

        render(<Component />)
    })
})
