import { issognaflowComponent, sognaflow, unwrapsognaflowComponent } from "../.."
import { forwardRef } from "react"

const CustomComp = forwardRef(() => <div />)

describe("issognaflowComponent", () => {
    it("returns true for sognaflow components", () => {
        expect(issognaflowComponent(sognaflow.div)).toBe(true)
        expect(issognaflowComponent(sognaflow.create(CustomComp))).toBe(true)
    })

    it("returns false for other components", () => {
        expect(issognaflowComponent("div")).toBe(false)
        expect(issognaflowComponent(CustomComp)).toBe(false)
    })
})

describe("unwrapsognaflowComponent", () => {
    it("returns the wrapped component for sognaflow components", () => {
        expect(unwrapsognaflowComponent(sognaflow.div)).toBe("div")
        expect(unwrapsognaflowComponent(sognaflow.create(CustomComp))).toBe(
            CustomComp
        )
    })

    it("returns undefined for other components", () => {
        expect(unwrapsognaflowComponent("div")).toBe(undefined)
        expect(unwrapsognaflowComponent(CustomComp)).toBe(undefined)
    })
})
