import { SognaflowValue } from "../../value"
import { SognaflowValueState } from "../SognaflowValueState"
import { createEffect } from "../utils/create-effect"

export const PropEffect = /*@__PURE__*/ createEffect(
    (
        subject: { [key: string]: any },
        state: SognaflowValueState,
        key: string,
        value: SognaflowValue
    ) => {
        return state.set(
            key,
            value,
            () => {
                subject[key] = state.latest[key]
            },
            undefined,
            false
        )
    }
)
