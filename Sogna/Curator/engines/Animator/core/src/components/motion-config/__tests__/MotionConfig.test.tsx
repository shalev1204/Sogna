import { render } from "@testing-library/react"
import { AnimationGeneratorName, Transition } from "sognaflow-dom"
import { useContext } from "react"
import { sognaflowConfig } from ".."
import { sognaflowConfigContext } from "../../../context/sognaflowconfigcontext"

const consumerId = "consumer"

const Consumer = () => {
    const value = useContext(sognaflowConfigContext) as any
    return (
        <div data-testid={consumerId}>{value.transition!.type as string}</div>
    )
}

const TransitionConsumer = () => {
    const value = useContext(sognaflowConfigContext) as any
    return (
        <div data-testid={consumerId}>
            {JSON.stringify(value.transition)}
        </div>
    )
}

const App = ({ type }: { type: AnimationGeneratorName }) => (
    <sognaflowConfig transition={{ type }}>
        <Consumer />
    </sognaflowConfig>
)

it("Passes down transition", () => {
    const { getByTestId } = render(<App type="spring" />)

    expect(getByTestId(consumerId).textContent).toBe("spring")
})

it("Passes down transition changes", () => {
    const { getByTestId, rerender } = render(<App type="spring" />)
    rerender(<App type="tween" />)

    expect(getByTestId(consumerId).textContent).toBe("tween")
})

it("Nested sognaflowConfig without inherit fully replaces parent transition", () => {
    const { getByTestId } = render(
        <sognaflowConfig transition={{ type: "spring", duration: 1 }}>
            <sognaflowConfig transition={{ delay: 0.5 }}>
                <TransitionConsumer />
            </sognaflowConfig>
        </sognaflowConfig>
    )

    const transition: Transition = JSON.parse(
        getByTestId(consumerId).textContent!
    )
    expect(transition.delay).toBe(0.5)
    expect(transition.type).toBeUndefined()
    expect(transition.duration).toBeUndefined()
})

it("Nested sognaflowConfig with inherit shallow-merges with parent transition", () => {
    const { getByTestId } = render(
        <sognaflowConfig transition={{ type: "spring", duration: 1 }}>
            <sognaflowConfig transition={{ inherit: true, delay: 0.5 }}>
                <TransitionConsumer />
            </sognaflowConfig>
        </sognaflowConfig>
    )

    const transition: Transition = JSON.parse(
        getByTestId(consumerId).textContent!
    )
    expect(transition.type).toBe("spring")
    expect(transition.duration).toBe(1)
    expect(transition.delay).toBe(0.5)
})

it("inherit key is stripped from resulting transition", () => {
    const { getByTestId } = render(
        <sognaflowConfig transition={{ type: "spring" }}>
            <sognaflowConfig transition={{ inherit: true, delay: 0.5 }}>
                <TransitionConsumer />
            </sognaflowConfig>
        </sognaflowConfig>
    )

    const transition: Transition = JSON.parse(
        getByTestId(consumerId).textContent!
    )
    expect(transition).not.toHaveProperty("inherit")
})

it("inherit inner keys win over parent keys", () => {
    const { getByTestId } = render(
        <sognaflowConfig transition={{ type: "spring", duration: 1 }}>
            <sognaflowConfig
                transition={{ inherit: true, duration: 2, delay: 0.5 }}
            >
                <TransitionConsumer />
            </sognaflowConfig>
        </sognaflowConfig>
    )

    const transition: Transition = JSON.parse(
        getByTestId(consumerId).textContent!
    )
    expect(transition.type).toBe("spring")
    expect(transition.duration).toBe(2)
    expect(transition.delay).toBe(0.5)
})

it("inherit cascades through deeply nested sognaflowConfigs", () => {
    const { getByTestId } = render(
        <sognaflowConfig transition={{ type: "spring", duration: 1 }}>
            <sognaflowConfig transition={{ inherit: true, delay: 0.5 }}>
                <sognaflowConfig
                    transition={{ inherit: true, ease: "easeIn" }}
                >
                    <TransitionConsumer />
                </sognaflowConfig>
            </sognaflowConfig>
        </sognaflowConfig>
    )

    const transition: Transition = JSON.parse(
        getByTestId(consumerId).textContent!
    )
    expect(transition.type).toBe("spring")
    expect(transition.duration).toBe(1)
    expect(transition.delay).toBe(0.5)
    expect(transition.ease).toBe("easeIn")
})
