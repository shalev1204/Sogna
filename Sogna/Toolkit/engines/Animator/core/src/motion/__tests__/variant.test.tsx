import { sognaflowValue, stagger, Variants } from "sognaflow-dom"
import { Fragment, Suspense, act, memo, useEffect, useState } from "react"
import { frame, sognaflow, sognaflowConfig, usesognaflowValue, visualElementStore } from "../../"
import { nextFrame } from "../../gestures/__tests__/utils"
import { pointerDown, pointerEnter, pointerUp, render } from "../../jest.setup"

const sognaflowFragment = sognaflow.create(Fragment)

describe("animate prop as variant", () => {
    test("animates to set variant", async () => {
        const variants: Variants = {
            hidden: { opacity: 0, x: -100, transition: { type: false } },
            visible: { opacity: 1, x: 100, transition: { type: false } },
        }

        const promise = new Promise((resolve) => {
            const x = sognaflowValue(0)
            const onComplete = () => resolve(x.get())
            const { rerender } = render(
                <sognaflow.div
                    animate="visible"
                    variants={variants}
                    style={{ x }}
                    onAnimationComplete={onComplete}
                />
            )
            rerender(
                <sognaflow.div
                    animate="visible"
                    variants={variants}
                    style={{ x }}
                    onAnimationComplete={onComplete}
                />
            )
        })

        return expect(promise).resolves.toBe(100)
    })

    test("fires onAnimationStart when animation begins", async () => {
        const promise = new Promise((resolve) => {
            const onStart = jest.fn()
            const onComplete = () => resolve(onStart)
            const Component = () => (
                <sognaflow.div
                    animate="visible"
                    transition={{ type: false }}
                    onAnimationStart={onStart}
                    onAnimationComplete={onComplete}
                />
            )
            const { rerender } = render(<Component />)
            rerender(<Component />)
        })

        return expect(promise).resolves.toBeCalledTimes(1)
    })

    test("fires onAnimationStart with the animation definition", async () => {
        const promise = new Promise((resolve) => {
            const onStart = jest.fn()
            const onComplete = () => resolve(onStart)
            const Component = () => (
                <sognaflow.div
                    animate="visible"
                    transition={{ type: false }}
                    onAnimationStart={(definition) => onStart(definition)}
                    onAnimationComplete={onComplete}
                />
            )
            const { rerender } = render(<Component />)
            rerender(<Component />)
        })

        return expect(promise).resolves.toBeCalledWith("visible")
    })

    test("child animates to set variant", async () => {
        const variants: Variants = {
            hidden: { opacity: 0, x: -100, transition: { type: false } },
            visible: { opacity: 1, x: 100, transition: { type: false } },
        }

        const childVariants: Variants = {
            hidden: { opacity: 0, x: -100, transition: { type: false } },
            visible: { opacity: 1, x: 50, transition: { type: false } },
        }

        const promise = new Promise((resolve) => {
            const x = sognaflowValue(0)
            const onComplete = () => resolve(x.get())
            const Component = () => (
                <sognaflow.div
                    animate="visible"
                    variants={variants}
                    onAnimationComplete={onComplete}
                >
                    <sognaflow.div variants={childVariants} style={{ x }} />
                </sognaflow.div>
            )

            const { rerender } = render(<Component />)
            rerender(<Component />)
        })

        return expect(promise).resolves.toBe(50)
    })

    test("child animates to set variant even if variants are not found on parent", async () => {
        const childVariants: Variants = {
            hidden: { opacity: 0, x: -100, transition: { type: false } },
            visible: { opacity: 1, x: 50, transition: { type: false } },
        }

        const promise = new Promise((resolve) => {
            const x = sognaflowValue(0)
            const onComplete = () => resolve(x.get())
            const Component = () => (
                <sognaflow.div animate="visible" onAnimationComplete={onComplete}>
                    <sognaflow.div variants={childVariants} style={{ x }} />
                </sognaflow.div>
            )

            const { rerender } = render(<Component />)
            rerender(<Component />)
        })

        return expect(promise).resolves.toBe(50)
    })

    test("applies applyOnEnd if set on initial", () => {
        const variants: Variants = {
            visible: {
                background: "#f00",
                transitionEnd: { display: "none" },
            },
        }

        const { container } = render(
            <sognaflow.div variants={variants} initial="visible" />
        )
        expect(container.firstChild).toHaveStyle("display: none")
    })

    test("applies applyOnEnd and end of animation", async () => {
        const promise = new Promise((resolve) => {
            const variants: Variants = {
                hidden: { background: "#00f" },
                visible: {
                    background: "#f00",
                    transitionEnd: { display: "none" },
                },
            }
            const display = sognaflowValue("block")
            const onComplete = () => {
                frame.postRender(() => resolve(display.get()))
            }
            const Component = () => (
                <sognaflow.div
                    initial="hidden"
                    animate="visible"
                    variants={variants}
                    transition={{ type: false }}
                    onAnimationComplete={onComplete}
                    style={{ display }}
                />
            )

            const { rerender } = render(<Component />)
            rerender(<Component />)
        })

        return expect(promise).resolves.toBe("none")
    })

    test("accepts custom transition", async () => {
        const promise = new Promise((resolve) => {
            const variants: Variants = {
                hidden: { background: "#00f" },
                visible: {
                    background: "#f00",
                    transition: { from: "#555", ease: () => 0.5 },
                },
            }
            const background = sognaflowValue("#00f")
            const onComplete = () => resolve(background.get())
            const Component = () => (
                <sognaflow.div
                    initial="hidden"
                    animate="visible"
                    variants={variants}
                    transition={{ type: false }}
                    onUpdate={onComplete}
                    style={{ background }}
                />
            )

            const { rerender } = render(<Component />)
            rerender(<Component />)
        })

        return expect(promise).resolves.toBe("rgba(190, 60, 60, 1)")
    })

    test("respects orchestration props in transition prop", async () => {
        const promise = new Promise((resolve) => {
            const opacity = sognaflowValue(0)

            const { getByTestId } = render(
                <sognaflow.div
                    variants={{
                        visible: {
                            opacity: 1,
                        },
                        hidden: {
                            opacity: 0,
                        },
                    }}
                    initial="hidden"
                    animate="visible"
                    transition={{ type: false, delayChildren: 1 }}
                >
                    <sognaflow.div
                        data-testid="test"
                        variants={{
                            visible: {
                                opacity: 0.9,
                            },
                            hidden: {
                                opacity: 0,
                            },
                        }}
                        transition={{ type: false }}
                        style={{ opacity }}
                    />
                </sognaflow.div>
            )

            requestAnimationFrame(() => resolve(getByTestId("test")))
        })

        return expect(promise).resolves.toHaveStyle("opacity: 0")
    })

    test("delay propagates throughout children", async () => {
        const promise = new Promise((resolve) => {
            const opacity = sognaflowValue(0)
            const variants: Variants = {
                visible: {
                    opacity: 1,
                },
                hidden: {
                    opacity: 0,
                },
            }

            function Component() {
                return (
                    <sognaflow.div
                        variants={variants}
                        initial="hidden"
                        animate="visible"
                        transition={{ type: false, delayChildren: 1 }}
                    >
                        <sognaflow.div
                            variants={variants}
                            transition={{ type: false }}
                        >
                            <sognaflow.div
                                variants={variants}
                                style={{ opacity }}
                            />
                        </sognaflow.div>
                    </sognaflow.div>
                )
            }

            const { rerender } = render(<Component />)
            rerender(<Component />)

            setTimeout(() => resolve(opacity.get()), 300)
        })

        return expect(promise).resolves.toBe(0)
    })

    test("propagates through components with no `animate` prop", async () => {
        const promise = new Promise((resolve) => {
            const opacity = sognaflowValue(0)
            const variants: Variants = {
                visible: {
                    opacity: 1,
                },
            }

            render(
                <sognaflow.div
                    variants={variants}
                    initial="hidden"
                    animate="visible"
                    transition={{ type: false }}
                >
                    <sognaflow.div>
                        <sognaflow.div
                            variants={variants}
                            transition={{ type: false }}
                            style={{ opacity }}
                        />
                    </sognaflow.div>
                </sognaflow.div>
            )

            requestAnimationFrame(() => resolve(opacity.get()))
        })

        return expect(promise).resolves.toBe(1)
    })

    test("doesn't propagate to a component with its own `animate` prop", async () => {
        const promise = new Promise((resolve) => {
            const opacity = sognaflowValue(1)

            const parentVariants = {
                initial: {
                    x: 0,
                },
                animate: {
                    x: 100,
                },
            }

            const childVariants = {
                initial: {
                    opacity: 0,
                },
                animate: {
                    opacity: 1,
                },
            }

            render(
                <sognaflow.div
                    initial="initial"
                    animate="animate"
                    variants={parentVariants}
                    transition={{ duration: 0.05 }}
                >
                    <sognaflow.div
                        animate="initial"
                        variants={childVariants}
                        style={{ opacity }}
                        transition={{ duration: 0.05 }}
                    />
                </sognaflow.div>
            )

            setTimeout(() => resolve(opacity.get()), 100)
        })

        return expect(promise).resolves.toBe(0)
    })

    test("when: beforeChildren works correctly", async () => {
        const promise = new Promise((resolve) => {
            const opacity = sognaflowValue(0.1)
            const variants: Variants = {
                visible: {
                    opacity: 1,
                    transition: { duration: 1, when: "beforeChildren" },
                },
            }

            render(
                <sognaflow.div
                    variants={variants}
                    initial="hidden"
                    animate="visible"
                >
                    <sognaflow.div>
                        <sognaflow.div variants={variants} style={{ opacity }} />
                    </sognaflow.div>
                </sognaflow.div>
            )

            setTimeout(() => resolve(opacity.get()), 200)
        })

        return expect(promise).resolves.toBe(0.1)
    })

    test("when: afterChildren works correctly", async () => {
        const parentOpacity = sognaflowValue(0.1)
        const childOpacity = sognaflowValue(0.1)
        const variants: Variants = {
            hidden: {
                opacity: 0,
                display: "block",
            },
            visible: {
                opacity: 1,
                transitionEnd: {
                    display: "none",
                },
            },
        }
        const Component = ({
            animate,
            onAnimationComplete,
        }: {
            animate: string
            onAnimationComplete?: VoidFunction
        }) => {
            return (
                <sognaflow.div
                    variants={variants}
                    initial={false}
                    transition={{ duration: 0.1, when: "afterChildren" }}
                    animate={animate}
                    style={{ opacity: parentOpacity }}
                    onAnimationComplete={onAnimationComplete}
                >
                    <sognaflow.div>
                        <sognaflow.div
                            variants={variants}
                            transition={{ duration: 0.1 }}
                            style={{ opacity: childOpacity }}
                        />
                    </sognaflow.div>
                </sognaflow.div>
            )
        }

        return await new Promise<void>(async (resolve) => {
            const { rerender } = render(<Component animate="hidden" />)
            rerender(
                <Component
                    animate="visible"
                    onAnimationComplete={() => {
                        expect(parentOpacity.get()).toBe(1)
                        expect(childOpacity.get()).toBe(1)

                        rerender(
                            <Component
                                animate="hidden"
                                onAnimationComplete={() => {
                                    expect(parentOpacity.get()).toBe(0)
                                    expect(childOpacity.get()).toBe(0)

                                    resolve()
                                }}
                            />
                        )
                        setTimeout(() => {
                            expect(parentOpacity.get()).toBe(1)
                            expect(childOpacity.get()).not.toBe(1)
                        }, 50)
                    }}
                />
            )
            setTimeout(() => {
                expect(parentOpacity.get()).toBe(0)
                expect(childOpacity.get()).not.toBe(0)
            }, 50)
        })
    })

    /**
     * This test enshrines the behaviour that when a value is removed from an element as the result of a parent variant,
     * it should fallback to the style prop. This is a bug in sognaflow - the desired behaviour is that it falls
     * back to the defined variant in initial. However, changing this behaviour would break generated code in Framer
     * so we can't fix it until we find a migration path out of that.
     */
    test("FRAMER BUG: When a value is removed from an element as the result of a parent variant, fallback to style", async () => {
        const Component = ({ animate }: { animate?: string }) => {
            return (
                <sognaflowFragment initial="a" animate={animate}>
                    <sognaflow.div
                        data-testid="child"
                        variants={{
                            a: { opacity: 0.5 },
                            b: { opacity: 1 },
                            c: {},
                        }}
                        transition={{ type: false }}
                        style={{ opacity: 0 }}
                    />
                </sognaflowFragment>
            )
        }

        const { getByTestId, rerender } = render(<Component />)
        const element = getByTestId("child")
        expect(element).toHaveStyle("opacity: 0.5")

        rerender(<Component animate="a" />)
        rerender(<Component animate="a" />)

        await nextFrame()

        expect(element).toHaveStyle("opacity: 0.5")

        rerender(<Component animate="b" />)
        rerender(<Component animate="b" />)

        await nextFrame()
        expect(element).toHaveStyle("opacity: 1")

        rerender(<Component animate="c" />)
        rerender(<Component animate="c" />)

        await nextFrame()
        expect(element).toHaveStyle("opacity: 0") // Contained in variant a, which is set as initial
    })

    test("initial: false correctly propagates", async () => {
        const promise = new Promise((resolve) => {
            const opacity = sognaflowValue(0.5)

            render(
                <sognaflow.div initial={false} animate="visible">
                    <sognaflow.div>
                        <sognaflow.div
                            variants={{
                                visible: { opacity: 0.9 },
                                hidden: { opacity: 0 },
                            }}
                            style={{ opacity }}
                        />
                    </sognaflow.div>
                </sognaflow.div>
            )

            setTimeout(() => resolve(opacity.get()), 200)
        })

        return expect(promise).resolves.toBe(0.9)
    })

    test("initial=false doesn't propagate to props", async () => {
        const { getByTestId } = render(
            <sognaflow.div initial={false} animate="test">
                <sognaflow.div data-testid="child" animate={{ opacity: 0.4 }} />
            </sognaflow.div>
        )

        expect(getByTestId("child")).not.toHaveStyle("opacity: 0.4")
    })

    test("nested controlled variants switch correctly", async () => {
        const promise = new Promise(async (resolve) => {
            const parentOpacity = sognaflowValue(0.2)
            const childOpacity = sognaflowValue(0.1)

            const Component = ({ isOpen }: { isOpen: boolean }) => {
                return (
                    <sognaflow.div
                        variants={{
                            visible: { opacity: 0.3 },
                            hidden: { opacity: 0.4 },
                        }}
                        initial="hidden"
                        animate={isOpen ? "visible" : "hidden"}
                        transition={{ type: false }}
                        style={{ opacity: parentOpacity }}
                    >
                        <sognaflow.div
                            variants={{
                                visible: { opacity: 0.5 },
                                hidden: { opacity: 0.6 },
                            }}
                            initial="hidden"
                            transition={{ type: false }}
                            animate={isOpen ? "visible" : "hidden"}
                            style={{ opacity: childOpacity }}
                        />
                    </sognaflow.div>
                )
            }

            const { rerender } = render(<Component isOpen={false} />)

            await nextFrame()

            expect(parentOpacity.get()).toBe(0.4)
            expect(childOpacity.get()).toBe(0.6)

            rerender(<Component isOpen />)

            await nextFrame()

            resolve([parentOpacity.get(), childOpacity.get()])
        })

        return expect(promise).resolves.toEqual([0.3, 0.5])
    })

    test("Child variants correctly calculate delay based on delayChildren: stagger()", async () => {
        const isCorrectlyStaggered = await new Promise((resolve) => {
            const childVariants = {
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { duration: 0.1 } },
            }

            function Component() {
                const a = usesognaflowValue(0)
                const b = usesognaflowValue(0)

                useEffect(
                    () =>
                        a.on("change", (latest) => {
                            if (latest >= 1 && b.get() === 0) resolve(true)
                        }),
                    [a, b]
                )

                return (
                    <sognaflow.div
                        variants={{
                            hidden: {},
                            visible: {
                                x: 100,
                                transition: { delayChildren: stagger(0.15) },
                            },
                        }}
                        initial="hidden"
                        animate="visible"
                    >
                        <sognaflow.div
                            variants={childVariants}
                            style={{ opacity: a }}
                        />
                        <sognaflow.div
                            variants={childVariants}
                            style={{ opacity: b }}
                        />
                    </sognaflow.div>
                )
            }

            const { rerender } = render(<Component />)
            rerender(<Component />)
        })

        expect(isCorrectlyStaggered).toBe(true)
    })

    test("Child variants with value-specific transitions correctly calculate delay based on delayChildren: stagger()", async () => {
        const isCorrectlyStaggered = await new Promise((resolve) => {
            const childVariants = {
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: { opacity: { duration: 0.1 } },
                },
            }

            function Component() {
                const a = usesognaflowValue(0)
                const b = usesognaflowValue(0)

                useEffect(
                    () =>
                        a.on("change", (latest) => {
                            if (latest >= 1 && b.get() === 0) resolve(true)
                        }),
                    [a, b]
                )

                return (
                    <sognaflow.div
                        variants={{
                            hidden: {},
                            visible: {
                                x: 100,
                                transition: { delayChildren: stagger(0.15) },
                            },
                        }}
                        initial="hidden"
                        animate="visible"
                    >
                        <sognaflow.div
                            variants={childVariants}
                            style={{ opacity: a }}
                        />
                        <sognaflow.div
                            variants={childVariants}
                            style={{ opacity: b }}
                        />
                    </sognaflow.div>
                )
            }

            const { rerender } = render(<Component />)
            rerender(<Component />)
        })

        expect(isCorrectlyStaggered).toBe(true)
    })

    test("Child variants correctly calculate delay based on staggerChildren (deprecated)", async () => {
        const isCorrectlyStaggered = await new Promise((resolve) => {
            const childVariants = {
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { duration: 0.1 } },
            }

            function Component() {
                const a = usesognaflowValue(0)
                const b = usesognaflowValue(0)

                useEffect(
                    () =>
                        a.on("change", (latest) => {
                            if (latest >= 1 && b.get() === 0) resolve(true)
                        }),
                    [a, b]
                )

                return (
                    <sognaflow.div
                        variants={{
                            hidden: {},
                            visible: {
                                x: 100,
                                transition: { staggerChildren: 0.15 },
                            },
                        }}
                        initial="hidden"
                        animate="visible"
                    >
                        <sognaflow.div
                            variants={childVariants}
                            style={{ opacity: a }}
                        />
                        <sognaflow.div
                            variants={childVariants}
                            style={{ opacity: b }}
                        />
                    </sognaflow.div>
                )
            }

            const { rerender } = render(<Component />)
            rerender(<Component />)
        })

        expect(isCorrectlyStaggered).toBe(true)
    })

    test("Child variants with value-specific transitions correctly calculate delay based on staggerChildren (deprecated)", async () => {
        const isCorrectlyStaggered = await new Promise((resolve) => {
            const childVariants = {
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: { opacity: { duration: 0.1 } },
                },
            }

            function Component() {
                const a = usesognaflowValue(0)
                const b = usesognaflowValue(0)

                useEffect(
                    () =>
                        a.on("change", (latest) => {
                            if (latest >= 1 && b.get() === 0) resolve(true)
                        }),
                    [a, b]
                )

                return (
                    <sognaflow.div
                        variants={{
                            hidden: {},
                            visible: {
                                x: 100,
                                transition: { staggerChildren: 0.15 },
                            },
                        }}
                        initial="hidden"
                        animate="visible"
                    >
                        <sognaflow.div
                            variants={childVariants}
                            style={{ opacity: a }}
                        />
                        <sognaflow.div
                            variants={childVariants}
                            style={{ opacity: b }}
                        />
                    </sognaflow.div>
                )
            }

            const { rerender } = render(<Component />)
            rerender(<Component />)
        })

        expect(isCorrectlyStaggered).toBe(true)
    })

    test("components without variants are transparent to stagger order", async () => {
        const [recordedOrder, staggeredEqually] = await new Promise<
            [number[], boolean]
        >((resolve) => {
            const order: number[] = []
            const delayedBy: number[] = []
            const staggerDuration = 0.1

            const updateDelayedBy = (i: number) => {
                if (delayedBy[i]) return
                delayedBy[i] = performance.now()
            }

            // Checking a rough equidistance between stagger times allows us to see
            // if any of the supposedly invisible interim `sognaflow.div`s were considered part of the
            // stagger order (which would mess up the timings)
            const checkStaggerEquidistance = () => {
                let isEquidistant = true
                let prev = 0
                for (let i = 0; i < delayedBy.length; i++) {
                    if (prev) {
                        const timeSincePrev = prev - delayedBy[i]
                        if (
                            Math.round(timeSincePrev / 100) * 100 !==
                            staggerDuration * 1000
                        ) {
                            isEquidistant = false
                        }
                    }
                    prev = delayedBy[i]
                }

                return isEquidistant
            }

            const parentVariants: Variants = {
                visible: {
                    transition: {
                        staggerChildren: staggerDuration,
                        staggerDirection: -1,
                    },
                },
            }

            const variants: Variants = {
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: {
                        duration: 0.000001,
                    },
                },
            }

            render(
                <sognaflow.div
                    initial="hidden"
                    animate="visible"
                    variants={parentVariants}
                    onAnimationComplete={() =>
                        requestAnimationFrame(() =>
                            resolve([order, checkStaggerEquidistance()])
                        )
                    }
                >
                    <sognaflow.div>
                        <sognaflow.div />
                        <sognaflow.div
                            variants={variants}
                            onUpdate={() => {
                                updateDelayedBy(0)
                                order.push(1)
                            }}
                            style={{ willChange: "auto" }}
                        />
                        <sognaflow.div
                            variants={variants}
                            onUpdate={() => {
                                updateDelayedBy(1)
                                order.push(2)
                            }}
                            style={{ willChange: "auto" }}
                        />
                    </sognaflow.div>
                    <sognaflow.div>
                        <sognaflow.div
                            variants={variants}
                            onUpdate={() => {
                                updateDelayedBy(2)
                                order.push(3)
                            }}
                            style={{ willChange: "auto" }}
                        />
                        <sognaflow.div
                            variants={variants}
                            onUpdate={() => {
                                updateDelayedBy(3)
                                order.push(4)
                            }}
                            style={{ willChange: "auto" }}
                        />
                    </sognaflow.div>
                </sognaflow.div>
            )
        })

        expect(recordedOrder).toEqual([4, 3, 2, 1])
        expect(staggeredEqually).toEqual(true)
    })

    test("onUpdate", async () => {
        const promise = new Promise((resolve) => {
            let latest = {}

            const onUpdate = (l: { [key: string]: number | string }) => {
                latest = l
            }

            const Component = () => (
                <sognaflow.div
                    onUpdate={onUpdate}
                    initial={{ x: 0, y: 0 }}
                    animate={{ x: 100, y: 100 }}
                    transition={{ duration: 0.1 }}
                    onAnimationComplete={() => {
                        frame.postRender(() => resolve(latest))
                    }}
                />
            )

            const { rerender } = render(<Component />)
            rerender(<Component />)
        })

        return expect(promise).resolves.toEqual({
            x: 100,
            y: 100,
        })
    })

    test("onUpdate doesnt fire if no values have changed", async () => {
        const onUpdate = jest.fn()

        await new Promise<void>((resolve) => {
            const x = sognaflowValue(0)

            const Component = ({ xTarget = 0 }) => (
                <sognaflow.div
                    animate={{ x: xTarget }}
                    transition={{ type: false }}
                    onUpdate={(latest) => {
                        expect(latest.willChange).not.toBe("auto")
                        onUpdate(latest)
                    }}
                    // Manually setting willChange to avoid triggering onUpdate
                    style={{ x, willChange: "transform" }}
                />
            )

            const { rerender } = render(<Component xTarget={0} />)
            setTimeout(() => rerender(<Component xTarget={1} />), 30)
            setTimeout(() => rerender(<Component xTarget={1} />), 60)
            setTimeout(() => resolve(), 90)
        })

        expect(onUpdate).toHaveBeenCalledTimes(1)
    })

    test("new child items animate from initial to animate", async () => {
        const x = sognaflowValue(0)
        const Component = ({ length }: { length: number }) => {
            const variants: Variants = {
                hidden: { opacity: 0, x: -100, transition: { type: false } },
                visible: { opacity: 1, x: 100, transition: { type: false } },
            }

            const items = []
            for (let i = 0; i < length; i++) {
                items.push(
                    <sognaflow.div
                        key={i}
                        variants={variants}
                        style={{ x: i === 1 ? x : 0 }}
                    />
                )
            }

            return (
                <sognaflow.div initial="hidden" animate="visible">
                    <sognaflow.div>{items}</sognaflow.div>
                </sognaflow.div>
            )
        }

        const { rerender } = render(<Component length={1} />)
        rerender(<Component length={1} />)
        rerender(<Component length={2} />)
        rerender(<Component length={2} />)

        await nextFrame()

        expect(x.get()).toBe(100)
    })

    test("style is used as fallback when a variant is removed from animate", async () => {
        const Component = ({ animate }: { animate?: string }) => {
            return (
                <sognaflow.div
                    animate={animate}
                    variants={{ a: { opacity: 1 } }}
                    transition={{ type: false }}
                    style={{ opacity: 0 }}
                />
            )
        }

        const { container, rerender } = render(<Component />)
        const element = container.firstChild as Element
        expect(element).toHaveStyle("opacity: 0")

        rerender(<Component animate="a" />)
        rerender(<Component animate="a" />)

        await nextFrame()
        expect(element).toHaveStyle("opacity: 1")

        rerender(<Component />)
        rerender(<Component />)

        await nextFrame()
        expect(element).toHaveStyle("opacity: 0")
    })

    test("style is active once value has been removed from animate", async () => {
        const Component = ({
            animate,
            opacity = 0,
        }: {
            animate?: string
            opacity?: number
        }) => {
            return (
                <sognaflow.div
                    animate={animate}
                    variants={{ a: { opacity: 1, rotate: 1 } }}
                    transition={{ type: false }}
                    style={{ opacity, rotate: opacity }}
                />
            )
        }

        const { container, rerender } = render(<Component />)
        const element = container.firstChild as Element
        expect(element).toHaveStyle("opacity: 0")
        expect(element).toHaveStyle("transform: none")

        rerender(<Component animate="a" />)
        rerender(<Component animate="a" />)

        await nextFrame()
        expect(element).toHaveStyle("opacity: 1")
        expect(element).toHaveStyle("transform: rotate(1deg)")

        rerender(<Component />)
        rerender(<Component />)

        await nextFrame()
        expect(element).toHaveStyle("opacity: 0")
        expect(element).toHaveStyle("transform: none")

        rerender(<Component opacity={0.5} />)
        rerender(<Component opacity={0.5} />)

        await nextFrame()
        expect(element).toHaveStyle("opacity: 0.5")
        expect(element).toHaveStyle("transform: rotate(0.5deg)")

        // Re-adding value to animated stack will animate value correctly
        rerender(<Component animate="a" opacity={0.5} />)
        rerender(<Component animate="a" opacity={0.5} />)

        await nextFrame()
        expect(element).toHaveStyle("opacity: 1")
        expect(element).toHaveStyle("transform: rotate(1deg)")

        // While animate is active, changing style doesn't change value
        rerender(<Component animate="a" opacity={0.75} />)
        rerender(<Component animate="a" opacity={0.75} />)

        await nextFrame()
        expect(element).toHaveStyle("opacity: 1")
        expect(element).toHaveStyle("transform: rotate(1deg)")
    })

    test("variants work the same whether defined inline or not", async () => {
        const variants = {
            foo: { opacity: [1, 0, 1] },
        }
        const outputA: number[] = []
        const outputB: number[] = []
        const Component = ({
            activeVariants,
        }: {
            activeVariants: string[]
        }) => {
            return (
                <>
                    <sognaflow.div
                        className="box bg-blue"
                        animate={activeVariants}
                        variants={{
                            foo: {
                                opacity: [1, 0, 1],
                            },
                        }}
                        transition={{ duration: 0.1 }}
                        onUpdate={({ opacity }) =>
                            outputA.push(opacity as number)
                        }
                    />
                    <sognaflow.div
                        className="box bg-green"
                        animate={activeVariants}
                        variants={variants}
                        transition={{ duration: 0.1 }}
                        onUpdate={({ opacity }) =>
                            outputB.push(opacity as number)
                        }
                    />
                </>
            )
        }

        const { rerender } = render(<Component activeVariants={["foo"]} />)
        rerender(<Component activeVariants={["foo"]} />)
        await new Promise((resolve) => {
            setTimeout(() => {
                rerender(<Component activeVariants={["foo", "bar"]} />)
                setTimeout(resolve, 100)
            }, 100)
        })

        expect(outputA.length).toEqual(outputB.length)
    })

    test("style is used as fallback when a variant changes to not contain that style", async () => {
        const Component = ({ animate }: { animate?: string }) => {
            return (
                <sognaflow.div
                    animate={animate}
                    variants={{ a: { opacity: 1 }, b: { x: 100 } }}
                    transition={{ type: false }}
                    style={{ opacity: 0 }}
                />
            )
        }

        const { container, rerender } = render(<Component />)
        const element = container.firstChild as Element
        expect(element).toHaveStyle("opacity: 0")

        rerender(<Component animate="a" />)
        rerender(<Component animate="a" />)

        await nextFrame()

        expect(element).toHaveStyle("opacity: 1")

        rerender(<Component animate="b" />)
        rerender(<Component animate="b" />)

        await nextFrame()
        expect(element).toHaveStyle("opacity: 0")
    })

    test("Children correctly animate to removed values even when not rendering along with parents", async () => {
        const Child = memo(() => (
            <sognaflow.div
                variants={{
                    visible: { x: 100, opacity: 1 },
                    hidden: { opacity: 0 },
                }}
                transition={{ type: false }}
            />
        ))

        const Parent = ({ isVisible }: { isVisible: boolean }) => {
            return (
                <sognaflow.div
                    initial={{ x: 0 }}
                    animate={isVisible ? "visible" : "hidden"}
                >
                    <Child />
                </sognaflow.div>
            )
        }

        const { container, rerender } = render(<Parent isVisible={false} />)
        const element = container.firstChild?.firstChild as Element

        rerender(<Parent isVisible={true} />)

        await nextFrame()

        expect(element).toHaveStyle("transform: translateX(100px)")
        rerender(<Parent isVisible={false} />)

        await nextFrame()

        expect(element).toHaveStyle("transform: none")
    })

    test("Protected keys don't persist after setActive fires", async () => {
        const Component = () => {
            const [isHover, setIsHover] = useState(false)
            const [_, setIsPressed] = useState(false)
            const [variant, setVariant] = useState("a")

            const variants = [variant]
            if (isHover) variants.push(variant + "-hover")

            return (
                <sognaflowConfig transition={{ type: false }}>
                    <sognaflow.div
                        data-testid="parent"
                        animate={variants}
                        onHoverStart={() => setIsHover(true)}
                        onHoverEnd={() => setIsHover(false)}
                        onTapStart={() => setIsPressed(true)}
                        onTap={() => setIsPressed(false)}
                        onTapCancel={() => setIsPressed(false)}
                    >
                        <sognaflow.div
                            data-testid="variant-trigger"
                            onTap={() => setVariant("b")}
                            style={{
                                width: 300,
                                height: 300,
                                backgroundColor: "rgb(255,255,0)",
                            }}
                            variants={{
                                b: {
                                    backgroundColor: "rgb(0,255,255)",
                                },
                            }}
                        >
                            <sognaflow.div
                                data-testid="inner"
                                style={{
                                    width: 100,
                                    height: 100,
                                    backgroundColor: "rgb(255,255,0)",
                                }}
                                variants={{
                                    // This state lingers too long.
                                    "a-hover": {
                                        backgroundColor: "rgb(150,150,0)",
                                    },
                                    b: {
                                        backgroundColor: "rgb(0,255,255)",
                                    },
                                    "b-hover": {
                                        backgroundColor: "rgb(0, 150,150)",
                                    },
                                }}
                            />
                        </sognaflow.div>
                    </sognaflow.div>
                </sognaflowConfig>
            )
        }

        const { getByTestId } = render(<Component />)
        const inner = getByTestId("inner")
        expect(inner).toHaveStyle("background-color: rgb(255,255,0)")

        pointerEnter(getByTestId("parent"))

        await nextFrame()
        await nextFrame()
        await nextFrame()

        expect(inner).toHaveStyle("background-color: rgb(150,150,0)")

        pointerDown(getByTestId("variant-trigger"))
        pointerUp(getByTestId("variant-trigger"))

        await nextFrame()
        await nextFrame()
        await nextFrame()

        expect(inner).toHaveStyle("background-color: rgb(0, 150,150)")
    })

    test("child onAnimationComplete triggers from parent animations", async () => {
        const variants: Variants = {
            hidden: { opacity: 0, x: -100, transition: { type: false } },
            visible: { opacity: 1, x: 100, transition: { type: false } },
        }

        const childVariants: Variants = {
            hidden: { opacity: 0, x: -100, transition: { type: false } },
            visible: { opacity: 1, x: 50, transition: { type: false } },
        }

        const promise = new Promise<string>((resolve) => {
            const onStart = (name: string) => resolve(name)
            const Component = () => (
                <sognaflow.div animate="visible" variants={variants}>
                    <sognaflow.div
                        variants={childVariants}
                        onAnimationStart={onStart}
                    />
                </sognaflow.div>
            )

            const { rerender } = render(<Component />)
            rerender(<Component />)
        })

        return expect(promise).resolves.toBe("visible")
    })

    test("child onAnimationComplete triggers from parent animations", async () => {
        const variants: Variants = {
            hidden: { opacity: 0, x: -100, transition: { type: false } },
            visible: { opacity: 1, x: 100, transition: { type: false } },
        }

        const childVariants: Variants = {
            hidden: { opacity: 0, x: -100, transition: { type: false } },
            visible: { opacity: 1, x: 50, transition: { type: false } },
        }

        const promise = new Promise<string>((resolve) => {
            const onComplete = (name: string) => resolve(name)
            const Component = () => (
                <sognaflow.div animate="visible" variants={variants}>
                    <sognaflow.div
                        variants={childVariants}
                        onAnimationComplete={onComplete}
                    />
                </sognaflow.div>
            )

            const { rerender } = render(<Component />)
            rerender(<Component />)
        })

        return expect(promise).resolves.toBe("visible")
    })

    test("changing values within an inherited variant triggers an animation", async () => {
        const Component = ({ x }: { x: number }) => {
            return (
                <sognaflow.div initial={false} animate="variant">
                    <sognaflow.div
                        data-testid="element"
                        variants={{ variant: { x } }}
                        transition={{ type: false }}
                    />
                </sognaflow.div>
            )
        }

        const { rerender, getByTestId } = render(<Component x={0} />)

        await nextFrame()

        const element = getByTestId("element")

        expect(element).toHaveStyle("transform: none")

        rerender(<Component x={100} />)

        await nextFrame()

        expect(element).toHaveStyle("transform: translateX(100px)")
    })

    test("transitionEnd from instant animation does not override subsequent variant", async () => {
        /**
         * This test targets the race condition from
         * https://github.com/sognaflowdivision/sognaflow/issues/1668
         *
         * When using type: false (instant transitions), the animation
         * completion is deferred to frame.update() but returns no
         * animation object. When a new variant switch happens before
         * that frame.update fires, the old transitionEnd can override
         * the new variant's values because there's no animation object
         * to cancel.
         */
        const Component = ({ variant }: { variant: string }) => (
            <sognaflow.div
                data-testid="target"
                animate={variant}
                initial="off"
                variants={{
                    on: {
                        opacity: 1,
                        transition: { type: false },
                        transitionEnd: { display: "flex" },
                    },
                    off: {
                        opacity: 0.5,
                        display: "none",
                        transition: { type: false },
                    },
                }}
                style={{ display: "none" }}
            />
        )

        const { getByTestId, rerender } = render(
            <Component variant="off" />
        )
        const element = getByTestId("target")

        await nextFrame()

        // Switch to "on" - with type:false, animation completes instantly
        // but onComplete is deferred to frame.update
        rerender(<Component variant="on" />)
        rerender(<Component variant="on" />)

        // Switch to "off" BEFORE the frame fires - the "on" variant's
        // transitionEnd (display: "flex") should NOT override "off"'s
        // display: "none"
        rerender(<Component variant="off" />)
        rerender(<Component variant="off" />)

        await nextFrame()
        await nextFrame()

        expect(element).toHaveStyle("display: none")
    })

    test("staggerChildren is calculated correctly for new children", async () => {
        const Component = ({ items }: { items: string[] }) => {
            return (
                <sognaflow.div
                    animate="enter"
                    variants={{
                        enter: { transition: { delayChildren: stagger(0.1) } },
                    }}
                >
                    {items.map((item) => (
                        <sognaflow.div
                            key={item}
                            id={item}
                            className="item"
                            variants={{ enter: { opacity: 1 } }}
                            initial={{ opacity: 0 }}
                        />
                    ))}
                </sognaflow.div>
            )
        }

        const { rerender } = render(<Component items={["1", "2"]} />)

        await nextFrame()
        await nextFrame()
        await nextFrame()
        await nextFrame()

        rerender(<Component items={["1", "2", "3", "4", "5"]} />)

        await nextFrame()
        await nextFrame()
        await nextFrame()
        await nextFrame()
        await nextFrame()
        await nextFrame()
        await nextFrame()
        await nextFrame()
        await nextFrame()
        await nextFrame()

        const elements = document.querySelectorAll(".item")

        // Check that none of the opacities are the same
        const opacities = Array.from(elements).map((el) =>
            parseFloat(window.getComputedStyle(el).opacity)
        )

        // All opacities should be unique
        const uniqueOpacities = new Set(opacities)
        expect(uniqueOpacities.size).toBe(opacities.length)
    })
})

describe("Variant propagation to asynchronously mounted children", () => {
    /**
     * Simulates a child that is inside a Suspense boundary and mounts
     * asynchronously — after the parent variant animation has already started.
     *
     * Uses the same throw-a-Promise pattern that React.lazy uses internally,
     * which gives us reliable act() flushing without the scheduling ambiguity
     * of React.lazy's module-loading machinery.
     */
    test("child inside Suspense boundary should animate from initial variant when parent is already animating", async () => {
        const childOpacity = sognaflowValue(0)
        const onAnimationStart = jest.fn()

        // resolveChild() lets us control exactly when the Suspense boundary resolves
        let resolveChild!: () => void
        let isSuspended = true

        function SuspendingChild() {
            if (isSuspended) {
                // Throw a promise to trigger Suspense — same mechanism as React.lazy
                throw new Promise<void>((resolve) => {
                    resolveChild = () => {
                        isSuspended = false
                        resolve()
                    }
                })
            }

            return (
                <sognaflow.div
                    variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1, transition: { type: false } },
                    }}
                    style={{ opacity: childOpacity }}
                    onAnimationStart={onAnimationStart}
                />
            )
        }

        render(
            <sognaflow.div
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1, transition: { type: false } },
                }}
            >
                <Suspense fallback={null}>
                    <SuspendingChild />
                </Suspense>
            </sognaflow.div>
        )

        // Let the parent commit and fire its effects — animateChanges runs,
        // parent animation starts, isInitialRender flips to false
        await act(async () => {
            await nextFrame()
        })

        // Resolve the Suspense boundary — child mounts into an already-animated
        // parent tree, exactly as with React.lazy on first load
        await act(async () => {
            resolveChild()
        })

        // Let the child's animation run to completion
        await act(async () => {
            await nextFrame()
            await nextFrame()
        })

        // Child should have fired its own initial→animate transition
        expect(onAnimationStart).toHaveBeenCalled()
        expect(childOpacity.get()).toBe(1)
    })

    test("child inside Suspense boundary should not skip directly to animate variant values", async () => {
        const childOpacity = sognaflowValue(1) // start at 1 so we can detect if it's wrongly skipped

        let resolveChild!: () => void
        let isSuspended = true

        function SuspendingChild() {
            if (isSuspended) {
                throw new Promise<void>((resolve) => {
                    resolveChild = () => {
                        isSuspended = false
                        resolve()
                    }
                })
            }

            return (
                <sognaflow.div
                    variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1, transition: { duration: 10 } },
                    }}
                    style={{ opacity: childOpacity }}
                />
            )
        }

        render(
            <sognaflow.div
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1, transition: { duration: 10 } },
                }}
            >
                <Suspense fallback={null}>
                    <SuspendingChild />
                </Suspense>
            </sognaflow.div>
        )

        // Let parent commit and start its animation
        await act(async () => {
            await nextFrame()
        })

        // Resolve the Suspense boundary
        await act(async () => {
            resolveChild()
        })

        // One frame into a 10-second animation — should be near 0, not 1
        await act(async () => {
            await nextFrame()
        })

        // Bug scenario: child jumps straight to opacity:1 (animate state)
        // Fix: child starts at opacity:0 (initial state) and is animating
        expect(childOpacity.get()).toBeLessThan(0.5)
    })

    test("child inside Suspense boundary should re-animate after animationState reset (StrictMode remount)", async () => {
        /**
         * Simulates React StrictMode's double-invocation: after the initial mount
         * and animation, AnimationFeature.unmount() calls animationState.reset(),
         * then a second animateChanges() fires. The child should animate again
         * because wasReset=true preserves the manuallyAnimateOnMount override.
         */
        const childOpacity = sognaflowValue(0)
        const onAnimationStart = jest.fn()

        let resolveChild!: () => void
        let isSuspended = true

        function SuspendingChild() {
            if (isSuspended) {
                throw new Promise<void>((resolve) => {
                    resolveChild = () => {
                        isSuspended = false
                        resolve()
                    }
                })
            }

            return (
                <sognaflow.div
                    id="reset-test-child"
                    variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1, transition: { type: false } },
                    }}
                    style={{ opacity: childOpacity }}
                    onAnimationStart={onAnimationStart}
                />
            )
        }

        const { container } = render(
            <sognaflow.div
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1, transition: { type: false } },
                }}
            >
                <Suspense fallback={null}>
                    <SuspendingChild />
                </Suspense>
            </sognaflow.div>
        )

        await act(async () => {
            await nextFrame()
        })
        await act(async () => {
            resolveChild()
        })
        await act(async () => {
            await nextFrame()
            await nextFrame()
        })

        expect(childOpacity.get()).toBe(1)

        // Simulate StrictMode remount: reset animation state (as AnimationFeature.unmount() does)
        const childEl = container.querySelector("#reset-test-child")
        const ve = childEl && visualElementStore.get(childEl as Element)
        expect(ve?.animationState).toBeDefined()

        ve!.animationState!.reset()
        childOpacity.set(0) // Simulate DOM reset to initial value

        await act(async () => {
            ve!.animationState!.animateChanges()
        })

        await act(async () => {
            await nextFrame()
            await nextFrame()
        })

        // After reset + re-animate, the child should have animated to 1 again
        expect(childOpacity.get()).toBe(1)
    })
})
