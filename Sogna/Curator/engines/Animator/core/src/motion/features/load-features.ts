import { setFeatureDefinitions } from "sognaflow-dom"
import { getInitializedFeatureDefinitions } from "./definitions.js"
import { FeaturePackages } from "./types.js"

export function loadFeatures(features: FeaturePackages) {
    const featureDefinitions = getInitializedFeatureDefinitions()

    for (const key in features) {
        featureDefinitions[key as keyof typeof featureDefinitions] = {
            ...featureDefinitions[key as keyof typeof featureDefinitions],
            ...features[key as keyof typeof features],
        } as any
    }

    setFeatureDefinitions(featureDefinitions)
}
