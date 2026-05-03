import { sognaflowValue } from "sognaflow-dom"
import { renderToStaticMarkup, renderToString } from "react-dom/server"
import { sognaflowConfig, sognaflow } from "../../../"

function runTests(render: (components: any) => string) {
    test("will-change not applied", () => {
        const div = render(
            <sognaflow.div
                initial={
                    {
                        x: 100,
                        clipPath: "inset(10px)",
                        "--color": "#000",
                    } as any
                }
                animate={
                    {
                        x: 200,
                        clipPath: "inset(20px)",
                        "--color": "#fff",
                    } as any
                }
            />
        )

        expect(div).toBe(
            `<div style="--color:#000;clip-path:inset(10px);transform:translateX(100px)"></div>`
        )
    })

    test("will-change not set in static mode", () => {
        const div = render(
            <sognaflowConfig isStatic>
                <sognaflow.div
                    initial={{ x: 100, clipPath: "inset(10px)" } as any}
                    animate={{ x: 200, clipPath: "inset(20px)" } as any}
                />
            </sognaflowConfig>
        )

        expect(div).toBe(
            `<div style="clip-path:inset(10px);transform:translateX(100px)"></div>`
        )
    })

    test("will-change manually set", () => {
        const div = render(
            <sognaflow.div
                initial={{ x: 100, "--color": "#000" } as any}
                animate={{ x: 200 }}
                style={{ willChange: "opacity" }}
            />
        )

        expect(div).toBe(
            `<div style="will-change:opacity;--color:#000;transform:translateX(100px)"></div>`
        )
    })

    test("will-change manually set without animated values", () => {
        const div = render(<sognaflow.div style={{ willChange: "opacity" }} />)

        expect(div).toBe(`<div style="will-change:opacity"></div>`)
    })

    test("will-change not set without animated values", () => {
        const div = render(<sognaflow.div style={{}} />)

        expect(div).toBe(`<div></div>`)
    })

    test("Externally defined sognaflowValues not automatically added to will-change", () => {
        const opacity = sognaflowValue(0.5)
        const div = render(<sognaflow.div style={{ opacity }} />)

        expect(div).toBe(`<div style="opacity:0.5"></div>`)
    })

    test("will-change manually set by sognaflowValue", () => {
        const willChange = sognaflowValue("opacity")
        const div = render(
            <sognaflow.div
                initial={{ x: 100, "--color": "#000" } as any}
                animate={{ x: 200 }}
                style={{ willChange }}
            />
        )

        expect(div).toBe(
            `<div style="--color:#000;will-change:opacity;transform:translateX(100px)"></div>`
        )
    })

    test("will-change correctly not applied when isStatic", () => {
        const div = render(
            <sognaflowConfig isStatic>
                <sognaflow.div
                    initial={{ x: 100, "--color": "#000" } as any}
                    animate={{ x: 200 }}
                />
            </sognaflowConfig>
        )

        expect(div).toBe(
            `<div style="--color:#000;transform:translateX(100px)"></div>`
        )
    })
}

describe("render", () => {
    runTests(renderToString)
})

describe("renderToStaticMarkup", () => {
    runTests(renderToStaticMarkup)
})
