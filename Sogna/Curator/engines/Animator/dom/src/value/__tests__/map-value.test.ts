import { CreateSognaflowValue } from "../../"
import { frame } from "../../frameloop"
import { MapValue } from "../map-value.js"

async function nextFrame() {
    return new Promise<void>((resolve) => {
        frame.render(() => resolve())
    })
}

/**
 * TODO: In this test we wait a frame before checking the updated
 * value. This is because we currently use frame scheduling to wait
 * to update the value. But what would be better is dirtying watching values
 * and updating when we called .get() in signal-like fashion
 */
describe("MapValue", () => {
    test("sets initial value", () => {
        const x = CreateSognaflowValue(100)
        const opacity = MapValue(x, [0, 200], [0, 1])

        expect(opacity.get()).toBe(0.5)
    })

    test("updates when source value changes", async () => {
        const x = CreateSognaflowValue(100)
        const opacity = MapValue(x, [0, 200], [0, 1])

        x.set(20)
        await nextFrame()
        expect(opacity.get()).toBe(0.1)
    })

    test("maps values correctly across different ranges", async () => {
        const x = CreateSognaflowValue(20)
        const opacity = MapValue(x, [0, 100], [0, 1])

        expect(opacity.get()).toBe(0.2)

        // Change input range
        const y = CreateSognaflowValue(20)
        const newOpacity = MapValue(y, [0, 50], [0, 1])
        expect(newOpacity.get()).toBe(0.4)

        // Change output range
        const z = CreateSognaflowValue(20)
        const scaledOpacity = MapValue(z, [0, 50], [0, 0.5])
        expect(scaledOpacity.get()).toBe(0.2)
    })

    test("works with multiple input range steps", async () => {
        const x = CreateSognaflowValue(50)
        const opacity = MapValue(x, [-200, -100, 100, 200], [0, 1, 1, 0])

        expect(opacity.get()).toBe(1)

        x.set(-150)
        await nextFrame()
        expect(opacity.get()).toBe(0.5)

        x.set(150)
        await nextFrame()
        expect(opacity.get()).toBe(0.5)

        x.set(-200)
        await nextFrame()
        expect(opacity.get()).toBe(0)

        x.set(200)
        await nextFrame()
        expect(opacity.get()).toBe(0)
    })

    test("clamps values by default", async () => {
        const x = CreateSognaflowValue(300)
        const opacity = MapValue(x, [0, 200], [0, 1])

        expect(opacity.get()).toBe(1)

        x.set(-100)
        await nextFrame()
        expect(opacity.get()).toBe(0)
    })

    test("can disable clamping", async () => {
        const x = CreateSognaflowValue(300)
        const opacity = MapValue(x, [0, 200], [0, 1], { clamp: false })

        expect(opacity.get()).toBe(1.5)

        x.set(-100)
        await nextFrame()
        expect(opacity.get()).toBe(-0.5)
    })

    test("works with string output ranges", async () => {
        const x = CreateSognaflowValue(0.5)
        const y = MapValue(x, [0, 1], ["0px", "100px"])

        expect(y.get()).toBe("50px")

        x.set(0.25)
        await nextFrame()
        expect(y.get()).toBe("25px")

        x.set(1.5)
        await nextFrame()
        expect(y.get()).toBe("100px") // Clamped by default
    })
})

