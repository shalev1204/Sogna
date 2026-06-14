import { renderHook } from "@testing-library/react"
import { act, useEffect, useState } from "react"
import { sognaflow, sognaflowGlobalConfig, sognaflowValue } from "../.."
import { render } from "../../jest.setup.js"
import { useInstantTransition } from "../use-instant-transition.js"

describe("useInstantTransition", () => {
    test("Disables animations for a single render", async () => {
        const values = await new Promise((resolve) => {
            const xParent = sognaflowValue(0)
            const xComponent = sognaflowValue(0)
            const xChild = sognaflowValue(0)

            const Parent = () => {
                const [state, setState] = useState(false)

                return (
                    <sognaflow.div
                        initial={false}
                        animate={{ x: state ? 50 : 0 }}
                        transition={{ duration: 10 }}
                        style={{ x: xParent }}
                    >
                        <Component state={state} setState={setState} />
                    </sognaflow.div>
                )
            }

            const Component = ({ state, setState }: any) => {
                const startInstantTransition = useInstantTransition()

                useEffect(() => {
                    startInstantTransition(() => act(() => setState(true)))

                    const timeout = setTimeout(() => {
                        resolve([xParent.get(), xComponent.get(), xChild.get()])
                    }, 100)

                    return () => clearTimeout(timeout)
                }, [])

                return (
                    <sognaflow.div
                        initial={false}
                        animate={{ x: state ? 100 : 0 }}
                        transition={{ duration: 10 }}
                        style={{ x: xComponent }}
                    >
                        <Child state={state} />
                    </sognaflow.div>
                )
            }

            const Child = ({ state }: any) => {
                return (
                    <sognaflow.div
                        initial={false}
                        animate={{ x: state ? 200 : 0 }}
                        transition={{ duration: 10 }}
                        style={{ x: xChild }}
                    />
                )
            }

            const { rerender } = render(<Parent />)
            rerender(<Parent />)
        })

        expect(values).toEqual([50, 100, 200])
    })

    test("Reenable animations on subsequent renders", async () => {
        const values = await new Promise((resolve) => {
            const xParent = sognaflowValue(0)
            const xComponent = sognaflowValue(0)
            const xChild = sognaflowValue(0)

            const Parent = () => {
                const [state, setState] = useState(0)
                const xTargets = [0, 50, 100]
                return (
                    <sognaflow.div
                        initial={false}
                        animate={{ x: xTargets[state] }}
                        transition={{ duration: 10 }}
                        style={{ x: xParent }}
                    >
                        <Component state={state} setState={setState} />
                    </sognaflow.div>
                )
            }

            const Component = ({ state, setState }: any) => {
                const startInstantTransition = useInstantTransition()
                const xTargets = [0, 100, 200]

                useEffect(() => {
                    let timeout: NodeJS.Timeout
                    if (state === 0) {
                        startInstantTransition(() => act(() => setState(1)))
                    } else if (state === 1) {
                        timeout = setTimeout(() => {
                            act(() => setState(2))
                        }, 100)
                    } else if (state === 2) {
                        timeout = setTimeout(() => {
                            resolve([
                                xParent.get(),
                                xComponent.get(),
                                xChild.get(),
                            ])
                        }, 100)
                    }

                    return () => clearTimeout(timeout)
                }, [state])

                return (
                    <sognaflow.div
                        initial={false}
                        animate={{ x: xTargets[state] }}
                        transition={{ duration: 10 }}
                        style={{ x: xComponent }}
                    >
                        <Child state={state} />
                    </sognaflow.div>
                )
            }

            const Child = ({ state }: any) => {
                const xTargets = [0, 200, 400]

                return (
                    <sognaflow.div
                        initial={false}
                        animate={{ x: xTargets[state] }}
                        transition={{ duration: 10 }}
                        style={{ x: xChild }}
                    />
                )
            }

            const { rerender } = render(<Parent />)
            rerender(<Parent />)
        })

        expect(values).not.toEqual([100, 200, 400])
    })

    test("transitions stay blocked when called on multiple frames back-to-back", async () => {
        const { result } = renderHook(() => useInstantTransition())

        act(() => result.current(() => {}))
        expect(sognaflowGlobalConfig.instantAnimations).toBe(true)

        const promise = createResolvablePromise()

        // On the next frame, call the callback again.
        requestAnimationFrame(() => {
            act(() => result.current(() => {}))

            requestAnimationFrame(() => {
                // If we hadn't called the callback a second time, we would have expected this to be `false` on this frame.
                expect(sognaflowGlobalConfig.instantAnimations).toBe(true)
                requestAnimationFrame(() => {
                    // Finally 2 frames have passed since the final call to
                    // start an instant transition, so we expect the state to be
                    // unblocked.
                    expect(sognaflowGlobalConfig.instantAnimations).toBe(false)
                    promise.resolve()
                })
            })
        })

        await promise
    })
})

type ResolvablePromise<T = void> = Promise<T> & {
    resolve: (value: T) => void
    reject: (reason?: unknown) => void
}

function createResolvablePromise<T = void>(): ResolvablePromise<T> {
    let resolvePromise: any, rejectPromise: any
    const promise: any = new Promise((resolve, reject) => {
        resolvePromise = resolve
        rejectPromise = reject
    })
    promise.resolve = resolvePromise
    promise.reject = rejectPromise
    return promise
}
