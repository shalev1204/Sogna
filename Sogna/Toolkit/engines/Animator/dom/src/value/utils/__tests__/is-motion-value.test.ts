import { sognaflowValue } from "../../"
import { issognaflowValue } from "../is-sognaflow-value"

describe("issognaflowValue", () => {
    test("correctly detects sognaflow values", () => {
        expect(issognaflowValue(sognaflowValue(0))).toBe(true)
        expect(issognaflowValue(undefined)).toBe(false)
        expect(issognaflowValue("a")).toBe(false)
        expect(issognaflowValue(null)).toBe(false)
        expect(issognaflowValue(0)).toBe(false)
    })
})
