"use client"

import type { WillChange } from "sognaflow-dom"
import { useConstant } from "../../utils/use-constant"
import { WillChangesognaflowValue } from "./willchangesognaflowvalue"

export function useWillChange(): WillChange {
    return useConstant(() => new WillChangesognaflowValue("auto"))
}
