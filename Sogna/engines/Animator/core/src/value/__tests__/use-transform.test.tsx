import { sognaflowValue, sognaflowValue } from "sognaflow-dom"
import { useEffect } from "react"
import { cancelFrame, frame, sognaflow } from "../../"
import { nextFrame, nextMicrotask } from "../../gestures/__tests__/utils.js"
import { render } from "../../jest.setup.js"
import { usesognaflowValue } from "../use-sognaflow-value"
import { useTransform } from "../use-transform.js"

describe("as function", () => {
    test("sets initial value", async () => {
        const Component = () => {
            const x = usesognaflowValue(100)
            const y = useTransform(x, (v) => -v)
            return <sognaflow.div style={{ x, y }} />
        }

        const { container } = render(<Component />)
        expect(container.firstChild).toHaveStyle(
            "transform: translateX(100px) translateY(-100px)"
        )
    })
})

describe("as function with multiple values", () => {
    test("sets initial value", async () => {
        const Component = () => {
            const x = usesognaflowValue(4)
            const y = usesognaflowValue("5px")
            const z = useTransform(
                [x, y],
                ([latestX, latestY]: [number, string]) =>
                    latestX * parseFloat(latestY)
            )
            return <sognaflow.div style={{ x, y, z }} />
        }

        const { container } = render(<Component />)
        expect(container.firstChild).toHaveStyle(
            "transform: translateX(4px) translateY(5px) translateZ(20px)"
        )
    })
})

describe("as function with no passed sognaflowValues", () => {
    test("sets initial value", async () => {
        const x = sognaflowValue(4)
        const Component = () => {
            const y = usesognaflowValue("5px")
            const z = useTransform(() => x.get() * parseFloat(y.get()))
            return <sognaflow.div style={{ x, y, z }} />
        }

        const { container } = render(<Component />)
        expect(container.firstChild).toHaveStyle(
            "transform: translateX(4px) translateY(5px) translateZ(20px)"
        )

        x.set(5)

        await new Promise<void>((resolve) => {
            frame.postRender(() => {
                expect(container.firstChild).toHaveStyle(
                    "transform: translateX(5px) translateY(5px) translateZ(25px)"
                )
                resolve()
            })
        })
    })
})

describe("as input/output range", () => {
    test("sets initial value", async () => {
        const Component = () => {
            const x = usesognaflowValue(100)
            const opacity = useTransform(x, [0, 200], [0, 1])
            return <sognaflow.div style={{ x, opacity }} />
        }

        const { container } = render(<Component />)
        expect(container.firstChild).toHaveStyle("opacity: 0.5")
    })

    test("responds to manual setting from parent value", async () => {
        const Component = () => {
            const x = usesognaflowValue(100)
            const opacity = useTransform(x, [0, 200], [0, 1])

            useEffect(() => {
                x.set(20)
            }, [])

            return <sognaflow.div style={{ x, opacity }} />
        }

        const { container, rerender } = render(<Component />)
        rerender(<Component />)

        await nextFrame()

        expect(container.firstChild).toHaveStyle("opacity: 0.1")
    })

    test("updates when values change", async () => {
        const x = sognaflowValue(20)
        let o = sognaflowValue(0)
        const Component = ({ a = 0, b = 100, c = 0, d = 1 }: any) => {
            const opacity = useTransform(x, [a, b], [c, d])
            o = opacity
            return <sognaflow.div style={{ x, opacity }} />
        }

        const { container, rerender } = render(<Component />)
        rerender(<Component />)

        await nextMicrotask()
        expect(container.firstChild).toHaveStyle("opacity: 0.2")
        rerender(<Component b={50} />)
        rerender(<Component b={50} />)
        await nextMicrotask()
        expect(container.firstChild).toHaveStyle("opacity: 0.4")
        rerender(<Component b={50} d={0.5} />)
        rerender(<Component b={50} d={0.5} />)
        await nextMicrotask()
        expect(container.firstChild).toHaveStyle("opacity: 0.2")
        x.set(40)

        return new Promise<void>((resolve) => {
            setTimeout(() => {
                expect(o.get()).toBe(0.4)
                resolve()
            }, 20)
        })
    })
})

test("is correctly typed", async () => {
    const Component = () => {
        const x = usesognaflowValue(0)
        const y = useTransform(x, [0, 1], ["0px", "1px"])
        const z = useTransform(x, (v) => v * 2)
        return <sognaflow.div style={{ x, y, z }} />
    }

    render(<Component />)
})

test("frame scheduling", async () => {
    return new Promise<void>((resolve) => {
        const Component = () => {
            const x = usesognaflowValue(0)
            const y = usesognaflowValue(0)
            const z = useTransform(() => x.get() + y.get())

            useEffect(() => {
                const setX = () => {
                    x.set(1)
                    frame.update(setY)
                }
                const setY = () => y.set(2)

                const checkFrame = () => {
                    expect(container.firstChild as Element).toHaveStyle(
                        "transform: translateX(1px) translateY(2px) translateZ(3px)"
                    )

                    resolve()
                }

                frame.read(setX)
                frame.postRender(checkFrame)

                return () => {
                    cancelFrame(setY)
                    cancelFrame(checkFrame)
                }
            }, [])

            return <sognaflow.div style={{ x, y, z }} />
        }

        const { container, rerender } = render(<Component />)
        rerender(<Component />)
    })
})

test("can be re-pointed to another `sognaflowValue`", async () => {
    const a = sognaflowValue(1)
    const b = sognaflowValue(2)
    let x = sognaflowValue(0)

    const Component = ({ target }: { target: sognaflowValue<number> }) => {
        x = useTransform(target, [0, 1], [0, 2], { clamp: false })
        return <sognaflow.div style={{ x }} />
    }

    const { container, rerender } = render(<Component target={a} />)
    rerender(<Component target={b} />)

    await nextMicrotask()
    expect(container.firstChild as Element).toHaveStyle(
        "transform: translateX(4px)"
    )

    rerender(<Component target={a} />)
    await nextMicrotask()
    expect(container.firstChild as Element).toHaveStyle(
        "transform: translateX(2px)"
    )
})

describe("CSS logical properties", () => {
    test("support numeric values with useTransform", async () => {
        const Component = () => {
            const scrollY = usesognaflowValue(0)
            const paddingBlock = useTransform(scrollY, [0, 100], [0, 100])
            return <sognaflow.div style={{ paddingBlock }} />
        }

        const { container } = render(<Component />)
        expect(container.firstChild).toHaveStyle("padding-block: 0px")
    })

    test("updates paddingBlock when sognaflowValue changes", async () => {
        const scrollY = sognaflowValue(0)

        const Component = () => {
            const paddingBlock = useTransform(scrollY, [0, 100], [0, 100])
            return <sognaflow.div style={{ paddingBlock }} />
        }

        const { container } = render(<Component />)

        await nextFrame()
        expect(container.firstChild).toHaveStyle("padding-block: 0px")

        scrollY.set(50)
        await nextFrame()
        expect(container.firstChild).toHaveStyle("padding-block: 50px")
    })

    test("supports other CSS logical properties", async () => {
        const Component = () => {
            const v = usesognaflowValue(25)

            return (
                <sognaflow.div
                    style={{
                        paddingInline: useTransform(v, [0, 100], [0, 100]),
                        marginBlock: useTransform(v, [0, 100], [0, 100]),
                    }}
                />
            )
        }

        const { container } = render(<Component />)

        expect(container.firstChild).toHaveStyle("padding-inline: 25px")
        expect(container.firstChild).toHaveStyle("margin-block: 25px")
    })

    test("supports inset shorthand with numeric values", async () => {
        const Component = () => {
            const scrollY = usesognaflowValue(0)
            const inset = useTransform(scrollY, [0, 100], [0, 100])
            return <sognaflow.div style={{ inset }} />
        }

        const { container } = render(<Component />)
        expect(container.firstChild).toHaveStyle("inset: 0px")
    })

    test("updates inset when sognaflowValue changes", async () => {
        const scrollY = sognaflowValue(0)

        const Component = () => {
            const inset = useTransform(scrollY, [0, 100], [0, 100])
            return <sognaflow.div style={{ inset }} />
        }

        const { container } = render(<Component />)

        await nextFrame()
        expect(container.firstChild).toHaveStyle("inset: 0px")

        scrollY.set(50)
        await nextFrame()
        expect(container.firstChild).toHaveStyle("inset: 50px")
    })

    test("supports other inset logical properties", async () => {
        const Component = () => {
            const v = usesognaflowValue(30)

            return (
                <sognaflow.div
                    style={{
                        insetBlock: useTransform(v, [0, 100], [0, 100]),
                        insetInline: useTransform(v, [0, 100], [0, 100]),
                    }}
                />
            )
        }

        const { container } = render(<Component />)

        expect(container.firstChild).toHaveStyle("inset-block: 30px")
        expect(container.firstChild).toHaveStyle("inset-inline: 30px")
    })
})

describe("as output map", () => {
    test("sets initial values", async () => {
        const Component = () => {
            const x = usesognaflowValue(100)
            const { opacity, scale } = useTransform(x, [0, 200], {
                opacity: [0, 1],
                scale: [0.5, 1],
            })
            return <sognaflow.div style={{ x, opacity, scale }} />
        }

        const { container } = render(<Component />)
        expect(container.firstChild).toHaveStyle("opacity: 0.5")
        expect(container.firstChild).toHaveStyle(
            "transform: translateX(100px) scale(0.75)"
        )
    })

    test("updates values when input changes", async () => {
        const x = sognaflowValue(100)

        const Component = () => {
            const { opacity, scale } = useTransform(x, [0, 200], {
                opacity: [0, 1],
                scale: [0.5, 1.5],
            })
            return <sognaflow.div style={{ x, opacity, scale }} />
        }

        const { container } = render(<Component />)
        expect(container.firstChild).toHaveStyle("opacity: 0.5")
        expect(container.firstChild).toHaveStyle(
            "transform: translateX(100px)"
        )

        x.set(200)

        await nextFrame()
        expect(container.firstChild).toHaveStyle("opacity: 1")
        expect(container.firstChild).toHaveStyle(
            "transform: translateX(200px) scale(1.5)"
        )
    })

    test("works with color values", async () => {
        const Component = () => {
            const progress = usesognaflowValue(0.5)
            const { backgroundColor, borderColor } = useTransform(
                progress,
                [0, 1],
                {
                    backgroundColor: ["#ff0000", "#0000ff"],
                    borderColor: ["#000000", "#ffffff"],
                }
            )
            return (
                <sognaflow.div style={{ backgroundColor, borderColor }} />
            )
        }

        const { container } = render(<Component />)
        // Colors are interpolated
        expect(container.firstChild).toHaveStyle(
            "background-color: rgba(180, 0, 180, 1)"
        )
    })

    test("supports transform options", async () => {
        const Component = () => {
            const x = usesognaflowValue(250)
            const { opacity } = useTransform(
                x,
                [0, 200],
                {
                    opacity: [0, 0.5],
                },
                { clamp: false }
            )
            return <sognaflow.div style={{ opacity }} />
        }

        const { container } = render(<Component />)
        // Value exceeds 0.5 because clamp is false (250/200 * 0.5 = 0.625)
        expect(container.firstChild).toHaveStyle("opacity: 0.625")
    })

    test("maintains keys across renders even if outputMap keys change", async () => {
        let capturedKeys: string[] = []

        const Component = ({ includeExtra }: { includeExtra: boolean }) => {
            const x = usesognaflowValue(100)

            // Note: In practice, users should not change keys, but the hook
            // should handle this gracefully by using the original keys
            const outputMap: { [key: string]: number[] } = includeExtra
                ? { opacity: [0, 1], scale: [0.5, 1], rotation: [0, 360] }
                : { opacity: [0, 1], scale: [0.5, 1] }

            const result = useTransform(x, [0, 200], outputMap)

            if (capturedKeys.length === 0) {
                capturedKeys = Object.keys(result)
            }

            return <sognaflow.div style={{ opacity: result.opacity }} />
        }

        const { rerender } = render(<Component includeExtra={false} />)

        // The keys should be captured on first render
        expect(capturedKeys).toEqual(["opacity", "scale"])

        // Even if we try to add a new key, it won't be in the result
        rerender(<Component includeExtra={true} />)
    })

    test("responds to input range changes", async () => {
        const x = sognaflowValue(100)

        const Component = ({ max }: { max: number }) => {
            const { opacity } = useTransform(x, [0, max], {
                opacity: [0, 1],
            })
            return <sognaflow.div style={{ opacity }} />
        }

        const { container, rerender } = render(<Component max={200} />)
        expect(container.firstChild).toHaveStyle("opacity: 0.5")

        rerender(<Component max={100} />)
        await nextMicrotask()
        expect(container.firstChild).toHaveStyle("opacity: 1")
    })

    test("is correctly typed", async () => {
        const Component = () => {
            const x = usesognaflowValue(0)
            const { opacity, scale } = useTransform(x, [0, 1], {
                opacity: [0, 1],
                scale: [0.5, 1],
            })

            return <sognaflow.div style={{ x, opacity, scale }} />
        }

        render(<Component />)
    })

    test("works with mixed types (string and number outputs)", async () => {
        const progress = sognaflowValue(50)

        const Component = () => {
            const { filter, scale, opacity } = useTransform(
                progress,
                [0, 100],
                {
                    filter: ["blur(10px)", "blur(0px)"],
                    scale: [0.5, 1],
                    opacity: [0.5, 1],
                }
            )
            return <sognaflow.div style={{ filter, scale, opacity }} />
        }

        const { container } = render(<Component />)
        expect(container.firstChild).toHaveStyle("filter: blur(5px)")
        expect(container.firstChild).toHaveStyle("opacity: 0.75")
        expect(container.firstChild).toHaveStyle("transform: scale(0.75)")

        progress.set(0)

        await nextFrame()
        expect(container.firstChild).toHaveStyle("filter: blur(10px)")
        expect(container.firstChild).toHaveStyle("opacity: 0.5")
        expect(container.firstChild).toHaveStyle("transform: scale(0.5)")
    })
})
