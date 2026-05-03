import { sognaflow, usesognaflowValue, ValueTransition } from "framer-sognaflow"
import * as clientsognaflow from "framer-sognaflow/client"
import { render } from "../../jest.setup"

describe("accepts sognaflow values into both sognaflow components from both entry points", () => {
    it("renders", () => {
        function Component() {
            const valueTransition: ValueTransition = {
                duration: 1,
                ease: "easeInOut",
            }
            const x = usesognaflowValue(0)
            return (
                <>
                    <sognaflow.div style={{ x }} />
                    <clientsognaflow.div
                        style={{ x }}
                        transition={valueTransition}
                    />
                </>
            )
        }

        render(<Component />)
    })

    it("accepts expected values", () => {
        function Component() {
            return (
                <sognaflow.div
                    animate={{
                        x: 100,
                        translateX: 100,
                        originX: 0.5,
                        backgroundColor: "red",
                        pathOffset: 0.5,
                        transition: {
                            originX: {},
                            x: {},
                            translateX: {},
                            backgroundColor: {},
                            pathOffset: {},
                        },
                    }}
                    transition={{
                        originX: {},
                        x: {},
                        translateX: {},
                        backgroundColor: {},
                        pathOffset: {},
                    }}
                />
            )
        }

        render(<Component />)
    })
})
