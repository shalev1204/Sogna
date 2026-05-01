import { sognaflowValue } from "../../"
import { frame } from "../../frameloop"
import { transformValue } from "../transform-value"

async function nextFrame() {
    return new Promise<void>((resolve) => {
        frame.render(() => resolve())
    })
}

describe("transformValue", () => {
    test("sets initial value", () => {
        const x = sognaflowValue(100)
        const y = transformValue(() => -x.get())

        expect(y.get()).toBe(-100)
    })

    test("updates when source value changes", async () => {
        const x = sognaflowValue(100)
        const y = transformValue(() => -x.get())

        x.set(200)
        await nextFrame()
        expect(y.get()).toBe(-200)
    })

    test("transforms multiple values", async () => {
        const x = sognaflowValue(4)
        const y = sognaflowValue(5)
        const z = transformValue(() => x.get() * y.get())

        expect(z.get()).toBe(20)

        x.set(10)
        await nextFrame()
        expect(z.get()).toBe(50)

        y.set(2)
        await nextFrame()
        expect(z.get()).toBe(20)
    })

    test("works with string values", async () => {
        const x = sognaflowValue(4)
        const y = sognaflowValue("5px")
        const z = transformValue(() => x.get() * parseFloat(y.get()))

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
        const z = transformValue(() => a * b)

        expect(z.get()).toBe(50)
    })

    test("can use multiple sognaflow values with complex transformations", async () => {
        const x = sognaflowValue(10)
        const y = sognaflowValue(20)
        const z = sognaflowValue(5)

        const result = transformValue(() => {
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
