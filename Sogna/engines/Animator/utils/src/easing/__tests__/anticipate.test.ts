import { anticipate } from "../anticipate.js"

describe("anticipate easing", () => {
    test("anticipate(0) returns 0", () => {
        expect(anticipate(0)).toBe(0)
    })

    test("anticipate(1) returns 1", () => {
        expect(anticipate(1)).toBe(1)
    })
})
