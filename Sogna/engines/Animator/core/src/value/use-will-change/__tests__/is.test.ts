import { isWillChangesognaflowValue, sognaflowValue } from "sognaflow-dom"
import { WillChangesognaflowValue } from "../willchangesognaflowvalue"

describe("isWillChangesognaflowValue", () => {
    test("Correctly detects WillChangesognaflowValue", () => {
        expect(isWillChangesognaflowValue(new WillChangesognaflowValue("auto"))).toBe(
            true
        )
        expect(isWillChangesognaflowValue(1)).toBe(false)
        expect(isWillChangesognaflowValue(undefined)).toBe(false)
        expect(isWillChangesognaflowValue(new sognaflowValue(0))).toBe(false)
    })
})
