import { setFeatureDefinitions } from "sognaflow-dom";
import { getInitializedFeatureDefinitions } from "./definitions.js";
export function loadFeatures(features) {
    const featureDefinitions = getInitializedFeatureDefinitions();
    for (const key in features) {
        featureDefinitions[key] = {
            ...featureDefinitions[key],
            ...features[key],
        };
    }
    setFeatureDefinitions(featureDefinitions);
}
//# sourceMappingURL=load-features.js.map
