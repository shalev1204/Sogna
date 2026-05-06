import { reverseEasing } from "../reverse.js"
import { easeOut } from "../../ease.js"

describe("reverseEasing", () => {
    test("correctly reverses an easing curve", () => {
        expect(reverseEasing(easeOut)(0.25)).toEqual(1 - easeOut(0.75))
    })
})
