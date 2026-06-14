import { CreateSognaflowValue } from "../../../../value"
import { ScrapeSognaflowValuesFromProps } from "../scrape-sognaflow-values.js"

describe("SVG ScrapeSognaflowValuesFromProps", () => {
    test("correctly scrapes sognaflow values from props", () => {
        const x = CreateSognaflowValue(0)
        const attrX = CreateSognaflowValue(0)
        const attrY = CreateSognaflowValue(0)
        const scale = CreateSognaflowValue(0)
        const attrScale = CreateSognaflowValue(0)

        expect(
            ScrapeSognaflowValuesFromProps(
                {
                    x: attrX,
                    attrY,
                    scale: attrScale,
                    prev: 0,
                    style: { x, scale },
                } as any,
                {
                    prev: CreateSognaflowValue(1),
                } as any
            )
        ).toEqual({
            attrX,
            attrY,
            attrScale,
            x,
            scale,
            prev: 0,
        })
    })
})

