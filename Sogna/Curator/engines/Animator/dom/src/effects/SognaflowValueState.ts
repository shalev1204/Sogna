import { AnyResolvedKeyframe } from "../animation/types"
import { cancelFrame, frame } from "../frameloop/frame"
import { SognaflowValue } from "../value"
import { numberValueTypes } from "../value/types/maps/number"
import { getValueAsType } from "../value/types/utils/get-as-type"

export class SognaflowValueState {
    latest: { [name: string]: AnyResolvedKeyframe } = {}

    private values = new Map<
        string,
        { value: SognaflowValue; onRemove: VoidFunction }
    >()

    set(
        name: string,
        value: SognaflowValue,
        render?: VoidFunction,
        computed?: SognaflowValue,
        useDefaultValueType = true
    ) {
        const existingValue = this.values.get(name)

        if (existingValue) {
            existingValue.onRemove()
        }

        const onChange = () => {
            const v = value.get()

            if (useDefaultValueType) {
                this.latest[name] = getValueAsType(v, numberValueTypes[name])
            } else {
                this.latest[name] = v
            }

            render && frame.render(render)
        }

        onChange()

        const cancelOnChange = value.on("change", onChange)

        computed && value.addDependent(computed)

        const remove = () => {
            cancelOnChange()
            render && cancelFrame(render)
            this.values.delete(name)
            computed && value.removeDependent(computed)
        }

        this.values.set(name, { value, onRemove: remove })

        return remove
    }

    get(name: string): SognaflowValue | undefined {
        return this.values.get(name)?.value
    }
}
