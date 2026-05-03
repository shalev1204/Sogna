import { sognaflowValue } from "sognaflow-dom"
import { Lazysognaflow, domAnimation, domMax, m, sognaflow } from "../.."
import { render } from "../../jest.setup"

describe("Lazy feature loading", () => {
    test("Doesn't animate without loaded features", async () => {
        const promise = new Promise((resolve) => {
            const x = sognaflowValue(0)
            const onComplete = () => resolve(x.get())

            const Component = () => (
                <m.div
                    animate={{ x: 20 }}
                    transition={{ duration: 0.01 }}
                    style={{ x }}
                    onAnimationComplete={onComplete}
                />
            )

            const { rerender } = render(<Component />)
            rerender(<Component />)
            setTimeout(() => resolve(x.get()), 50)
        })

        return expect(promise).resolves.not.toBe(20)
    })

    test("Does animate with synchronously-loaded domAnimation", async () => {
        const promise = new Promise((resolve) => {
            const x = sognaflowValue(0)
            const onComplete = () => resolve(x.get())

            const Component = () => (
                <Lazysognaflow features={domAnimation}>
                    <m.div
                        animate={{ x: 20 }}
                        transition={{ duration: 0.01 }}
                        style={{ x }}
                        onAnimationComplete={onComplete}
                    />
                </Lazysognaflow>
            )

            const { rerender } = render(<Component />)
            rerender(<Component />)
        })

        return expect(promise).resolves.toBe(20)
    })

    test("Does animate with synchronously-loaded domMax", async () => {
        const promise = new Promise((resolve) => {
            const x = sognaflowValue(0)
            const onComplete = () => resolve(x.get())

            const Component = () => (
                <Lazysognaflow features={domMax}>
                    <m.div
                        animate={{ x: 20 }}
                        transition={{ duration: 0.01 }}
                        style={{ x }}
                        onAnimationComplete={onComplete}
                    />
                </Lazysognaflow>
            )

            const { rerender } = render(<Component />)
            rerender(<Component />)
        })

        return expect(promise).resolves.toBe(20)
    })

    test("Supports nested feature sets", async () => {
        const promise = new Promise((resolve) => {
            const x = sognaflowValue(0)
            const onComplete = () => resolve(x.get())

            const Component = () => (
                <Lazysognaflow features={domMax}>
                    <m.div
                        animate={{ x: 20 }}
                        transition={{ duration: 0.01 }}
                        style={{ x }}
                        onAnimationComplete={onComplete}
                    />
                </Lazysognaflow>
            )

            const { rerender } = render(<Component />)
            rerender(<Component />)
        })

        return expect(promise).resolves.toBe(20)
    })

    test("Doesn't throw without strict mode", async () => {
        const promise = new Promise((resolve) => {
            const x = sognaflowValue(0)
            const onComplete = () => resolve(x.get())

            const Component = () => (
                <Lazysognaflow features={domMax}>
                    <sognaflow.div
                        animate={{ x: 20 }}
                        transition={{ duration: 0.01 }}
                        style={{ x }}
                        onAnimationComplete={onComplete}
                    />
                </Lazysognaflow>
            )

            const { rerender } = render(<Component />)
            rerender(<Component />)
        })

        return expect(promise).resolves.toBe(20)
    })

    test("Throws in strict mode", async () => {
        const promise = new Promise((resolve) => {
            const x = sognaflowValue(0)
            const onComplete = () => resolve(x.get())

            const Component = () => (
                <Lazysognaflow features={domMax} strict>
                    <sognaflow.div
                        animate={{ x: 20 }}
                        transition={{ duration: 0.01 }}
                        style={{ x }}
                        onAnimationComplete={onComplete}
                    />
                </Lazysognaflow>
            )

            const { rerender } = render(<Component />)
            rerender(<Component />)
        })

        return expect(promise).rejects.toThrowError()
    })

    test("Animates after async loading", async () => {
        const promise = new Promise((resolve) => {
            const x = sognaflowValue(0)
            const onComplete = () => resolve(x.get())

            const Component = () => (
                <Lazysognaflow
                    features={() =>
                        import("./lazy-async-endpoint").then(
                            ({ domAnimation: features }: any) => features
                        )
                    }
                    strict
                >
                    <m.div
                        animate={{ x: 20 }}
                        transition={{ duration: 0.01 }}
                        style={{ x }}
                        onAnimationComplete={onComplete}
                    />
                </Lazysognaflow>
            )

            const { rerender } = render(<Component />)
            rerender(<Component />)
        })

        return expect(promise).resolves.toBe(20)
    })
})
