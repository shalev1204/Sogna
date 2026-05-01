import { sognaflowValue, stagger, Variants } from "sognaflow-dom"
import { sognaflow } from "../.."
import { render } from "../../jest.setup"

describe("delay attr", () => {
    test("in transition prop", async () => {
        const promise = new Promise((resolve) => {
            const x = sognaflowValue(0)
            const Component = () => (
                <sognaflow.div
                    animate={{ x: 10 }}
                    transition={{ delay: 1, type: false }}
                    style={{ x }}
                />
            )

            const { rerender } = render(<Component />)
            rerender(<Component />)

            requestAnimationFrame(() => resolve(x.get()))
        })

        return expect(promise).resolves.toBe(0)
    })
    test("value-specific delay on instant transition", async () => {
        const promise = new Promise((resolve) => {
            const x = sognaflowValue(0)
            const Component = () => (
                <sognaflow.div
                    animate={{ x: 10 }}
                    transition={{ x: { delay: 1, type: false } }}
                    style={{ x }}
                />
            )

            const { rerender } = render(<Component />)
            rerender(<Component />)

            requestAnimationFrame(() => resolve(x.get()))
        })

        return expect(promise).resolves.toBe(0)
    })
    test("value-specific delay on animation", async () => {
        const promise = new Promise((resolve) => {
            const x = sognaflowValue(0)
            const Component = () => (
                <sognaflow.div
                    animate={{ x: 10 }}
                    transition={{ x: { delay: 1 } }}
                    style={{ x }}
                />
            )

            const { rerender } = render(<Component />)
            rerender(<Component />)

            requestAnimationFrame(() => resolve(x.get()))
        })

        return expect(promise).resolves.toBe(0)
    })
    test("in animate.transition", async () => {
        const promise = new Promise((resolve) => {
            const x = sognaflowValue(0)
            const Component = () => (
                <sognaflow.div
                    animate={{ x: 10, transition: { delay: 1, type: false } }}
                    style={{ x }}
                />
            )

            const { rerender } = render(<Component />)
            rerender(<Component />)

            requestAnimationFrame(() => resolve(x.get()))
        })

        return expect(promise).resolves.toBe(0)
    })
    test("in variant", async () => {
        const promise = new Promise((resolve) => {
            const x = sognaflowValue(0)
            const Component = () => (
                <sognaflow.div
                    variants={{
                        visible: {
                            x: 10,
                            transition: { delay: 1, type: false },
                        },
                    }}
                    animate="visible"
                    style={{ x }}
                />
            )

            const { rerender } = render(<Component />)
            rerender(<Component />)

            requestAnimationFrame(() => resolve(x.get()))
        })

        return expect(promise).resolves.toBe(0)
    })
    test("in variant children via delayChildren", async () => {
        const promise = new Promise((resolve) => {
            const x = sognaflowValue(0)

            const parent: Variants = {
                visible: {
                    x: 10,
                    transition: { delay: 0, delayChildren: 1, type: false },
                },
            }

            const child: Variants = {
                visible: {
                    x: 10,
                    transition: { type: false },
                },
            }

            const Component = () => (
                <sognaflow.div variants={parent} animate="visible">
                    <sognaflow.div variants={child} style={{ x }} />
                </sognaflow.div>
            )

            const { rerender } = render(<Component />)
            rerender(<Component />)

            requestAnimationFrame(() => resolve(x.get()))
        })

        return expect(promise).resolves.toBe(0)
    })
    test("in variant children via staggerChildren", async () => {
        const promise = new Promise((resolve) => {
            const x = sognaflowValue(0)

            const parent: Variants = {
                visible: {
                    x: 10,
                    transition: { delay: 0, staggerChildren: 1, type: false },
                },
            }

            const child: Variants = {
                visible: {
                    x: 10,
                    transition: { type: false },
                },
            }

            const Component = () => (
                <sognaflow.div variants={parent} animate="visible">
                    <sognaflow.div variants={child} />
                    <sognaflow.div variants={child} style={{ x }} />
                </sognaflow.div>
            )

            const { rerender } = render(<Component />)
            rerender(<Component />)

            requestAnimationFrame(() => resolve(x.get()))
        })

        return expect(promise).resolves.toBe(0)
    })
    test("in variant children via delayChildren: stagger(interval)", async () => {
        const promise = new Promise((resolve) => {
            const x = sognaflowValue(0)

            const parent: Variants = {
                visible: {
                    x: 10,
                    transition: {
                        delay: 0,
                        delayChildren: stagger(1),
                        type: false,
                    },
                },
            }

            const child: Variants = {
                visible: {
                    x: 10,
                    transition: { type: false },
                },
            }

            const Component = () => (
                <sognaflow.div variants={parent} animate="visible">
                    <sognaflow.div variants={child} />
                    <sognaflow.div variants={child} style={{ x }} />
                </sognaflow.div>
            )

            const { rerender } = render(<Component />)
            rerender(<Component />)

            requestAnimationFrame(() => resolve(x.get()))
        })

        return expect(promise).resolves.toBe(0)
    })
})
