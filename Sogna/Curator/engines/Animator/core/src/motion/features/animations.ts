import { AnimationFeature } from "./animation"
import { ExitAnimationFeature } from "./animation/exit.js"
import { FeaturePackages } from "./types.js"

export const animations: FeaturePackages = {
    animation: {
        Feature: AnimationFeature,
    },
    exit: {
        Feature: ExitAnimationFeature,
    },
}
