import { sognaflowValue } from "../../../../value"
import { scrapesognaflowValuesFromProps } from "../scrape-sognaflow-values"

describe("SVG scrapesognaflowValuesFromProps", () => {
    test("correctly scrapes sognaflow values from props", () => {
        const x = sognaflowValue(0)
        const attrX = sognaflowValue(0)
        const attrY = sognaflowValue(0)
        const scale = sognaflowValue(0)
        const attrScale = sognaflowValue(0)

        expect(
            scrapesognaflowValuesFromProps(
                {
                    x: attrX,
                    attrY,
                    scale: attrScale,
                    prev: 0,
                    style: { x, scale },
                } as any,
                {
                    prev: sognaflowValue(1),
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
