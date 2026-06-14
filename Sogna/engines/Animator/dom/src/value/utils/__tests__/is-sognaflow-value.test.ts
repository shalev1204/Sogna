import { CreateSognaflowValue } from "../../"
import { IsSognaflowValue } from "../is-sognaflow-value.js"

describe("IsSognaflowValue", () => {
    test("correctly detects sognaflow values", () => {
        expect(IsSognaflowValue(CreateSognaflowValue(0))).toBe(true)
        expect(IsSognaflowValue(undefined)).toBe(false)
        expect(IsSognaflowValue("a")).toBe(false)
        expect(IsSognaflowValue(null)).toBe(false)
        expect(IsSognaflowValue(0)).toBe(false)
    })
})

