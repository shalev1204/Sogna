import { camelToDash } from "../../render/dom/utils/camel-to-dash"

export const OptimizedAppearDataId = "framerAppearId"

export const OptimizedAppearDataAttribute =
    "data-" + camelToDash(OptimizedAppearDataId) as "data-framer-appear-id"
