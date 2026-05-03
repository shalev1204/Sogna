import type { LegacyAnimationControls } from "../../node/types"

export function IsAnimationControls(v?: unknown): v is LegacyAnimationControls {
    return (
        v !== null &&
        typeof v === "object" &&
        typeof (v as LegacyAnimationControls).start === "function"
    )
}
