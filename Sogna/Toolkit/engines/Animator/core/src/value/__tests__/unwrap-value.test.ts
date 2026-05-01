import { sognaflowValue, resolvesognaflowValue } from "sognaflow-dom"

describe("resolvesognaflowValue", () => {
    it("should leave non-sognaflow values alone", () => {
        let value: any = { test: "foo" }
        expect(resolvesognaflowValue(value)).toBe(value)
        value = 4
        expect(resolvesognaflowValue(value)).toBe(4)
    })
    it("should should unwrap a sognaflow value", () => {
        let sognaflowValue: sognaflowValue<any> = new sognaflowValue(3)
        expect(resolvesognaflowValue(sognaflowValue)).toBe(3)
        const value = { test: "bar" }
        sognaflowValue = new sognaflowValue(value)
        expect(resolvesognaflowValue(sognaflowValue)).toBe(value)
    })
})
