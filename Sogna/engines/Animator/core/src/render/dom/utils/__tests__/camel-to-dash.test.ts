import "../../../../jest.setup.js"
import { camelToDash } from "sognaflow-dom"

describe("camelToDash", () => {
    it("Converts camel case to dash case", () => {
        expect(camelToDash("camelCase")).toBe("camel-case")
    })
})
