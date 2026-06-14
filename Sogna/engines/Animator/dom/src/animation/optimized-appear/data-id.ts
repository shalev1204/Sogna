import { camelToDash } from "../../render/dom/utils/camel-to-dash.js"

export const OptimizedAppearDataId = "framerAppearId"

export const OptimizedAppearDataAttribute =
    "data-" + camelToDash(OptimizedAppearDataId) as "data-framer-appear-id"
