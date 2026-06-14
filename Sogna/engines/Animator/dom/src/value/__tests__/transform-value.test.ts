import { CreateSognaflowValue } from "../../"
import { frame } from "../../frameloop"
import { TransformValue } from "../transform-value.js"

async function nextFrame() {
    return new Promise<void>((resolve) => {
        frame.render(() => resolve())
    })
}

describe("TransformValue", () => {
    test("sets initial value", () => {
        const x = CreateSognaflowValue(100)
        const y = TransformValue(() => -x.get())

        expect(y.get()).toBe(-100)
    })

    test("updates when source value changes", async () => {
        const x = CreateSognaflowValue(100)
        const y = TransformValue(() => -x.get())

        x.set(200)
        await nextFrame()
        expect(y.get()).toBe(-200)
    })

    test("transforms multiple values", async () => {
        const x = CreateSognaflowValue(4)
        const y = CreateSognaflowValue(5)
        const z = TransformValue(() => x.get() * y.get())

        expect(z.get()).toBe(20)

        x.set(10)
        await nextFrame()
        expect(z.get()).toBe(50)

        y.set(2)
        await nextFrame()
        expect(z.get()).toBe(20)
    })

    test("works with string values", async () => {
        const x = CreateSognaflowValue(4)
        const y = CreateSognaflowValue("5px")
        const z = TransformValue(() => x.get() * parseFloat(y.get()))

        expect(z.get()).toBe(20)

        x.set(5)
        await nextFrame()
        expect(z.get()).toBe(25)

        y.set("10px")
        await nextFrame()
        expect(z.get()).toBe(50)
    })

    test("works with non-sognaflow values", () => {
        const a = 5
        const b = 10
        const z = TransformValue(() => a * b)

        expect(z.get()).toBe(50)
    })

    test("can use multiple sognaflow values with complex transformations", async () => {
        const x = CreateSognaflowValue(10)
        const y = CreateSognaflowValue(20)
        const z = CreateSognaflowValue(5)

        const result = TransformValue(() => {
            const xVal = x.get()
            const yVal = y.get()
            const zVal = z.get()

            return (xVal + yVal) * zVal
        })

        expect(result.get()).toBe(150)

        x.set(5)
        await nextFrame()
        expect(result.get()).toBe(125)

        y.set(15)
        await nextFrame()
        expect(result.get()).toBe(100)

        z.set(10)
        await nextFrame()
        expect(result.get()).toBe(200)
    })
})

