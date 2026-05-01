import { sognaflowValue } from "../../value"
import { sognaflowValueState } from "../sognaflowValueState"
import { createEffect } from "../utils/create-effect"

export const propEffect = /*@__PURE__*/ createEffect(
    (
        subject: { [key: string]: any },
        state: sognaflowValueState,
        key: string,
        value: sognaflowValue
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
