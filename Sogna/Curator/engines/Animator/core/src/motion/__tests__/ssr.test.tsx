import { sognaflowValue } from "sognaflow-dom"
import { ForwardedRef, forwardRef, Fragment, useRef, useState } from "react"
import { renderToStaticMarkup, renderToString } from "react-dom/server"
import { usesognaflowValue } from "../../"
import { AnimatePresence } from "../../components/AnimatePresence"
import { Reorder } from "../../components/Reorder"
import { sognaflow } from "../../render/components/sognaflow"
import { sognaflow as sognaflowProxy } from "../../render/components/sognaflow/proxy"

const sognaflowFragment = sognaflow.create(Fragment)

function runTests(render: (components: any) => string) {
    test("doesn't throw type or runtime errors", () => {
        interface CustomProps {
            foo: string
        }

        const CustomsognaflowComponent = sognaflow.create(
            forwardRef(
                (props: CustomProps, ref: ForwardedRef<HTMLDivElement>) => {
                    return <div ref={ref} {...props} />
                }
            )
        )
        const CustomsognaflowDiv = sognaflow.create("div")
        const CustomsognaflowCircle = sognaflow.create("circle")

        const ProxyCustomsognaflowComponent = sognaflowProxy.create(
            forwardRef(
                (props: CustomProps, ref: ForwardedRef<HTMLInputElement>) => {
                    return <input ref={ref} {...props} />
                }
            )
        )
        const ProxyCustomsognaflowDiv = sognaflowProxy.create("div")
        const ProxyCustomsognaflowCircle = sognaflowProxy.create("circle")

        function Component() {
            const divRef = useRef<HTMLDivElement>(null)
            const buttonRef = useRef<HTMLButtonElement>(null)
            const circleRef = useRef<SVGCircleElement>(null)
            const inputRef = useRef<HTMLInputElement>(null)
            const value = usesognaflowValue(0)
            return (
                <>
                    <sognaflow.div
                        ref={divRef}
                        initial={{ x: 100 }}
                        whileTap={{ opacity: 0 }}
                        drag
                        layout
                        layoutId="a"
                        style={{ opacity: 1 }}
                        data-testid="box"
                    />
                    <sognaflow.button ref={buttonRef} disabled />
                    <sognaflow.circle ref={circleRef} cx={1} cy={value} />
                    <sognaflowProxy.div
                        ref={divRef}
                        initial={{ x: 100 }}
                        whileTap={{ opacity: 0 }}
                        drag
                        layout
                        layoutId="a"
                        style={{ opacity: 1 }}
                        data-testid="box"
                    />
                    <sognaflowProxy.button ref={buttonRef} disabled />
                    <sognaflowProxy.circle ref={circleRef} cx={1} cy={value} />
                    <CustomsognaflowDiv
                        ref={divRef}
                        initial={{ x: 100 }}
                        whileTap={{ opacity: 0 }}
                        drag
                        layout
                        layoutId="a"
                        style={{ opacity: 1 }}
                        data-testid="box"
                    />
                    <CustomsognaflowComponent
                        ref={divRef}
                        foo="test"
                        whileTap={{ opacity: 0 }}
                    />
                    <CustomsognaflowCircle
                        ref={circleRef}
                        whileTap={{ opacity: 0 }}
                        cx={1}
                        cy={value}
                    />
                    <ProxyCustomsognaflowDiv
                        ref={divRef}
                        initial={{ x: 100 }}
                        whileTap={{ opacity: 0 }}
                        drag
                        layout
                        layoutId="a"
                        style={{ opacity: 1 }}
                        data-testid="box"
                    />
                    <ProxyCustomsognaflowComponent
                        ref={inputRef}
                        foo="test"
                        whileTap={{ opacity: 0 }}
                    />
                    <ProxyCustomsognaflowCircle
                        ref={circleRef}
                        whileTap={{ opacity: 0 }}
                        cx={1}
                        cy={value}
                    />
                </>
            )
        }
        render(<Component />)

        expect(true).toBe(true)
    })

    test("doesn't throw when rendering Fragment", () => {
        render(
            <sognaflowFragment
                initial={{ x: 100 }}
                whileTap={{ opacity: 0 }}
                drag
                layout
                layoutId="a"
                style={{ opacity: 1 }}
            />
        )

        expect(true).toBe(true)
    })
    test("correctly renders HTML", () => {
        const y = sognaflowValue(200)
        const div = render(
            <AnimatePresence>
                <sognaflow.div
                    initial={{ x: 100 }}
                    animate={{ x: 50 }}
                    style={{ y }}
                    exit={{ x: 0 }}
                    values={{ customValue: y }}
                />
            </AnimatePresence>
        )

        expect(div).toBe(
            '<div style="transform:translateX(100px) translateY(200px)"></div>'
        )
    })

    test("correctly renders custom HTML tag", () => {
        const y = sognaflowValue(200)
        const CustomComponent = sognaflow.create("element-test")
        const customElement = render(
            <AnimatePresence>
                <CustomComponent
                    initial={{ x: 100 }}
                    animate={{ x: 50 }}
                    style={{ y }}
                    exit={{ x: 0 }}
                />
            </AnimatePresence>
        )

        expect(customElement).toBe(
            '<element-test style="transform:translateX(100px) translateY(200px)"></element-test>'
        )
    })

    test("correctly renders SVG", () => {
        const cx = sognaflowValue(100)
        const pathLength = sognaflowValue(0.5)
        const circle = render(
            <sognaflow.circle
                cx={cx}
                initial={{ strokeWidth: 10 }}
                style={{
                    background: "#fff",
                    pathLength,
                    x: 100,
                }}
            />
        )

        expect(circle).toBe(
            '<circle cx="100" stroke-width="10" pathLength="1" stroke-dashoffset="0" stroke-dasharray="0.5 1" style="background:#fff;transform:translateX(100px);transform-origin:50% 50%;transform-box:fill-box"></circle>'
        )
        const rect = render(
            <AnimatePresence>
                <sognaflow.rect
                    initial={{ x: 0 }}
                    animate={{ x: 100 }}
                    exit={{ x: 0 }}
                    mask=""
                    style={{
                        background: "#fff",
                    }}
                    className="test"
                    onMouseMove={() => {}}
                />
            </AnimatePresence>
        )

        expect(rect).toBe(
            '<rect mask="" class="test" style="background:#fff;transform:none;transform-origin:50% 50%;transform-box:fill-box"></rect>'
        )

        const path = render(
            <AnimatePresence>
                <sognaflow.path
                    initial={{ x: 0 }}
                    animate={{ x: 100 }}
                    exit={{ x: 0 }}
                    mask=""
                    style={{
                        background: "#fff",
                        transformBox: "view-box",
                    }}
                    className="test"
                    onMouseMove={() => {}}
                />
            </AnimatePresence>
        )

        expect(path).toBe(
            '<path mask="" class="test" style="background:#fff;transform-box:view-box;transform:none;transform-origin:50% 50%"></path>'
        )
    })

    test("initial correctly overrides style", () => {
        const div = render(
            <sognaflow.div initial={{ x: 100 }} style={{ x: 200 }} />
        )

        expect(div).toBe(`<div style="transform:translateX(100px)"></div>`)
    })

    test("sets tabindex='0' if onTap is set", () => {
        const div = render(<sognaflow.div onTap={() => {}} />)

        expect(div).toBe(`<div tabindex="0"></div>`)
    })

    test("sets tabindex='0' if onTapStart is set", () => {
        const div = render(<sognaflow.div onTap={() => {}} />)

        expect(div).toBe(`<div tabindex="0"></div>`)
    })

    test("sets tabindex='0' if whileTap is set", () => {
        const div = render(<sognaflow.div whileTap={{ scale: 2 }} />)

        expect(div).toBe(`<div tabindex="0"></div>`)
    })

    test("doesn't override tabindex", () => {
        const div = render(<sognaflow.div tabIndex={2} whileTap={{ scale: 2 }} />)

        expect(div).toBe(`<div tabindex="2"></div>`)
    })

    test("initial correctly overrides style with keyframes and initial={false}", () => {
        const div = render(
            <sognaflow.div
                initial={false}
                animate={{ x: [0, 100] }}
                style={{ x: 200 }}
            />
        )

        expect(div).toBe(`<div style="transform:translateX(100px)"></div>`)
    })

    test("Reorder: Renders correct element", () => {
        function Component() {
            const [state, setState] = useState([0])
            return (
                <Reorder.Group onReorder={setState} values={state}>
                    <Reorder.Item value="a" />
                </Reorder.Group>
            )
        }
        const div = render(<Component />)

        expect(div).toBe(
            `<ul style="overflow-anchor:none"><li draggable="false" style="z-index:unset;transform:none;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;touch-action:pan-x"></li></ul>`
        )
    })

    test("Reorder: Doesn't render touch-scroll disabling styles if dragListener === false", () => {
        function Component() {
            const [state, setState] = useState([0])
            return (
                <Reorder.Group onReorder={setState} values={state}>
                    <Reorder.Item value="a" dragListener={false} />
                </Reorder.Group>
            )
        }
        const div = render(<Component />)

        expect(div).toBe(
            `<ul style="overflow-anchor:none"><li style="z-index:unset;transform:none"></li></ul>`
        )
    })

    test("Reorder: Renders provided element", () => {
        function Component() {
            const [state, setState] = useState([0])
            return (
                <Reorder.Group as="div" onReorder={setState} values={state}>
                    <Reorder.Item as="div" value="a" />
                </Reorder.Group>
            )
        }
        const div = render(<Component />)

        expect(div).toBe(
            `<div style="overflow-anchor:none"><div draggable="false" style="z-index:unset;transform:none;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;touch-action:pan-x"></div></div>`
        )
    })

    test("renders sognaflow value child", () => {
        function Component() {
            const value = usesognaflowValue(5)

            return <sognaflow.div>{value}</sognaflow.div>
        }

        const string = render(<Component />)

        expect(string).toBe("<div>5</div>")
    })
}

describe("render", () => {
    runTests(renderToString)
})

describe("renderToStaticMarkup", () => {
    runTests(renderToStaticMarkup)
})
