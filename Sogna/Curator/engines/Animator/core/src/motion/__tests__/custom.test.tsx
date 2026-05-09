import * as React from "react"
import { ForwardedRef, SVGProps } from "react"
import { sognaflow, usesognaflowValue } from "../.."
import { nextFrame } from "../../gestures/__tests__/utils.js"
import { render } from "../../jest.setup.js"
import { sognaflowProps } from "../types.js"

interface Props {
    foo: boolean
}

function runTests(name: string, sognaflowFactory: typeof sognaflow.create) {
describe(name, () => {
        test("accepts custom types", () => {
            const BaseComponent = React.forwardRef(
                (_props: Props, ref: ForwardedRef<HTMLDivElement>) => {
                    return <div ref={ref} />
                }
            )

            const sognaflowComponent = sognaflowFactory(BaseComponent)

            const Component = () => <sognaflowComponent foo />

            render(<Component />)
        })

        test("accepts normal component", () => {
            const sognaflowComponent = sognaflowFactory((props: Props) =>
                props.foo ? <div /> : null
            )

            const Component = () => <sognaflowComponent foo />

            render(<Component />)
        })

        test("doesn't forward sognaflow props but does forward custom props", () => {
            let animate: any
            let foo: boolean = false
            const BaseComponent = React.forwardRef(
                (props: Props, ref: ForwardedRef<HTMLDivElement>) => {
                    animate = (props as any).animate
                    foo = props.foo
                    return <div ref={ref} />
                }
            )

            const sognaflowComponent = sognaflowFactory(BaseComponent)

            const Component = () => <sognaflowComponent foo animate={{ x: 100 }} />

            render(<Component />)

            expect(animate).toBeUndefined()
            expect(foo).toBe(true)
        })

        test("forwards sognaflowProps if forwardsognaflowProps is defined", () => {
            let animate: any
            let foo: boolean = false
            const BaseComponent = React.forwardRef(
                (
                    props: React.PropsWithChildren<Props & sognaflowProps>,
                    ref: ForwardedRef<HTMLDivElement>
                ) => {
                    animate = props.animate
                    foo = props.foo
                    return <div ref={ref} />
                }
            )

            const sognaflowComponent = sognaflowFactory(BaseComponent, {
                forwardsognaflowProps: true,
            })

            const Component = () => <sognaflowComponent foo animate={{ x: 100 }} />

            render(<Component />)

            expect(animate).toEqual({ x: 100 })
            expect(foo).toBe(true)
        })

        test("forwards sognaflowValue children as raw values", () => {
            let children: number
            const BaseComponent = React.forwardRef(
                (
                    props: React.PropsWithChildren<Props & sognaflowProps>,
                    ref: ForwardedRef<HTMLDivElement>
                ) => {
                    children = props.children as any
                    return <div ref={ref} />
                }
            )

            const sognaflowComponent = sognaflowFactory(BaseComponent)

            const Component = () => (
                <sognaflowComponent foo>{usesognaflowValue(5)}</sognaflowComponent>
            )

            render(<Component />)

            expect(children!).toEqual(5)
        })

        test("Accepts children as a function if original component accepts children as a function", () => {
            const BaseComponent = React.forwardRef(
                (
                    props: Props & {
                        children:
                            | React.ReactNode
                            | (({
                                  isServer,
                              }: {
                                  isServer: boolean
                              }) => React.ReactNode)
                    },
                    ref: ForwardedRef<HTMLDivElement>
                ) => {
                    return (
                        <div ref={ref}>
                            {typeof props.children === "function"
                                ? props.children({ isServer: false })
                                : props.children}
                        </div>
                    )
                }
            )

            const sognaflowComponent = sognaflowFactory(BaseComponent)

            const Component = () => (
                <sognaflowComponent foo>{() => <div />}</sognaflowComponent>
            )

            render(<Component />)
        })
    })
}

runTests("sognaflow.create()", sognaflow.create)

describe("sognaflow.create() with type: 'svg'", () => {
    test("animates SVG-specific attributes like viewBox when type is 'svg'", async () => {
        // Custom SVG component that wraps an <svg> element
        const CustomSVG = React.forwardRef(
            (
                props: SVGProps<SVGSVGElement>,
                ref: ForwardedRef<SVGSVGElement>
            ) => {
                return <svg ref={ref} {...props} />
            }
        )

        // Without type: "svg", viewBox won't animate correctly
        // because sognaflow treats custom components as HTML by default
        const sognaflowCustomSVG = sognaflow.create(CustomSVG, { type: "svg" })

        const Component = () => {
            return (
                <sognaflowCustomSVG
                    data-testid="custom-svg"
                    viewBox="0 0 100 100"
                    transition={{ type: false }}
                    animate={{ viewBox: "100 100 200 200" }}
                />
            )
        }

        const { getByTestId } = render(<Component />)

        await nextFrame()

        expect(getByTestId("custom-svg")).toHaveAttribute(
            "viewBox",
            "100 100 200 200"
        )
    })
})
