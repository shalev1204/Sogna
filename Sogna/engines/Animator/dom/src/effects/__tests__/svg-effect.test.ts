import { frame } from "../../frameloop"
import { CreateSognaflowValue } from "../../value"
import { SVGEffect } from "../svg"

async function nextFrame() {
    return new Promise<void>((resolve) => {
        frame.postRender(() => resolve())
    })
}

describe("SVGEffect", () => {
    it("sets feMorphology radius as unitless number (issue #2779)", async () => {
        const element = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "feMorphology"
        )

        // Create sognaflow value for radius
        const radius = CreateSognaflowValue(4)

        // Apply svg effect
        SVGEffect(element, {
            radius,
        })

        await nextFrame()

        // Verify radius is set as unitless number, not with "px" suffix
        // This was the bug - radius was being set as "4px" instead of "4"
        expect(element.getAttribute("radius")).toBe("4")
    })

    it("sets SVG attributes and styles after SVGEffect is applied", async () => {
        const element = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
        )

        // Create sognaflow values
        const cx = CreateSognaflowValue("100")
        const cy = CreateSognaflowValue("200")
        const fill = CreateSognaflowValue("red")
        const stroke = CreateSognaflowValue("blue")

        // Apply svg effect
        SVGEffect(element, {
            cx,
            cy,
            fill,
            stroke,
        })

        await nextFrame()

        // Verify attributes and styles are set
        expect(element.getAttribute("cx")).toBe("100")
        expect(element.getAttribute("cy")).toBe("200")
        expect(element.style.fill).toBe("red")
        expect(element.style.stroke).toBe("blue")
    })

    it("updates SVG attributes and styles when sognaflow values change", async () => {
        const element = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
        )

        // Create sognaflow values
        const cx = CreateSognaflowValue("100")
        const fill = CreateSognaflowValue("red")

        // Apply svg effect
        SVGEffect(element, {
            cx,
            fill,
        })

        await nextFrame()

        // Verify initial attributes and styles
        expect(element.getAttribute("cx")).toBe("100")
        expect(element.style.fill).toBe("red")

        // Change sognaflow values
        cx.set("200")
        fill.set("blue")

        // Updates should be scheduled for the next frame render
        // Attributes and styles should not have changed yet
        expect(element.getAttribute("cx")).toBe("100")
        expect(element.style.fill).toBe("red")

        await nextFrame()

        // Verify attributes and styles are updated
        expect(element.getAttribute("cx")).toBe("200")
        expect(element.style.fill).toBe("blue")
    })

    it("handles multiple SVG elements", async () => {
        // Create additional elements
        const element1 = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
        )
        const element2 = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
        )

        const cx = CreateSognaflowValue("100")
        const fill = CreateSognaflowValue("red")

        SVGEffect([element1, element2], {
            cx,
            fill,
        })

        await nextFrame()

        expect(element1.getAttribute("cx")).toBe("100")
        expect(element1.style.fill).toBe("red")
        expect(element2.getAttribute("cx")).toBe("100")
        expect(element2.style.fill).toBe("red")

        cx.set("200")
        fill.set("blue")

        await nextFrame()

        expect(element1.getAttribute("cx")).toBe("200")
        expect(element1.style.fill).toBe("blue")
        expect(element2.getAttribute("cx")).toBe("200")
        expect(element2.style.fill).toBe("blue")
    })

    it("returns cleanup function that stops updating SVG attributes and styles", async () => {
        const element = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
        )
        // Create sognaflow values
        const cx = CreateSognaflowValue("100")
        const fill = CreateSognaflowValue("red")

        // Apply svg effect and get cleanup function
        const cleanup = SVGEffect(element, {
            cx,
            fill,
        })

        await nextFrame()

        // Verify initial attributes and styles
        expect(element.getAttribute("cx")).toBe("100")
        expect(element.style.fill).toBe("red")

        // Change values and verify update on next frame
        cx.set("200")
        fill.set("blue")

        await nextFrame()

        // Verify update happened
        expect(element.getAttribute("cx")).toBe("200")
        expect(element.style.fill).toBe("blue")

        // Call cleanup function
        cleanup()

        // Change values again
        cx.set("300")
        fill.set("green")

        await nextFrame()

        // Verify attributes and styles didn't change after cleanup
        expect(element.getAttribute("cx")).toBe("200")
        expect(element.style.fill).toBe("blue")
    })

    it("handles both camelCase and kebab-case style properties", async () => {
        const element = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
        )

        // Create sognaflow values for both camelCase and kebab-case
        const transformBox = CreateSognaflowValue("fill-box")
        const transformOrigin = CreateSognaflowValue("center")

        // Apply svg effect
        SVGEffect(element, {
            transformBox,
            "transform-origin": transformOrigin,
        })

        await nextFrame()

        // Verify both properties are set via style
        expect(element.style.transformBox).toBe("fill-box")
        expect(element.style.transformOrigin).toBe("center")

        // Update values
        transformBox.set("view-box")
        transformOrigin.set("top left")

        await nextFrame()

        // Verify updates are applied via style
        expect(element.style.transformBox).toBe("view-box")
        expect(element.style.transformOrigin).toBe("top left")
    })

    it("handles path-related properties correctly", async () => {
        const element = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
        )

        // Create sognaflow values for path properties
        const pathOffset = CreateSognaflowValue("0.5")
        const pathLength = CreateSognaflowValue("2")
        const pathSpacing = CreateSognaflowValue("1")

        // Apply svg effect
        SVGEffect(element, {
            pathLength,
            pathOffset,
            pathSpacing,
        })

        await nextFrame()

        // Verify initial path properties (uses unitless values to avoid Safari zoom bug)
        expect(element.getAttribute("pathLength")).toBe("1")
        expect(element.getAttribute("stroke-dashoffset")).toBe("-0.5")
        expect(element.getAttribute("stroke-dasharray")).toBe("2 1")

        // Update values
        pathOffset.set("0.25")
        pathLength.set("3")
        pathSpacing.set("2")

        await nextFrame()

        // Verify updated path properties
        expect(element.getAttribute("pathLength")).toBe("1")
        expect(element.getAttribute("stroke-dashoffset")).toBe("-0.25")
        expect(element.getAttribute("stroke-dasharray")).toBe("3 2")
    })

    it("handles path properties with cleanup", async () => {
        const element = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
        )

        const pathOffset = CreateSognaflowValue("0.5")
        const pathLength = CreateSognaflowValue("2")
        const pathSpacing = CreateSognaflowValue("1")

        const cleanup = SVGEffect(element, {
            pathOffset,
            pathLength,
            pathSpacing,
        })

        await nextFrame()

        // Verify initial values (uses unitless values to avoid Safari zoom bug)
        expect(element.getAttribute("stroke-dashoffset")).toBe("-0.5")
        expect(element.getAttribute("stroke-dasharray")).toBe("2 1")

        // Update values
        pathOffset.set("0.25")
        pathLength.set("3")
        pathSpacing.set("2")

        await nextFrame()

        // Verify updates
        expect(element.getAttribute("stroke-dashoffset")).toBe("-0.25")
        expect(element.getAttribute("stroke-dasharray")).toBe("3 2")

        // Cleanup
        cleanup()

        // Update values again
        pathOffset.set("0.75")
        pathLength.set("4")
        pathSpacing.set("3")

        await nextFrame()

        // Verify values didn't change after cleanup
        expect(element.getAttribute("stroke-dashoffset")).toBe("-0.25")
        expect(element.getAttribute("stroke-dasharray")).toBe("3 2")
    })
})

