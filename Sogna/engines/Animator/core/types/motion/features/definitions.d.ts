import { FeatureDefinitions } from "./types.js";
/**
 * Initialize feature definitions with isEnabled checks.
 * This must be called before any sognaflow components are rendered.
 */
export declare function initFeatureDefinitions(): void;
/**
 * Get the current feature definitions, initializing if needed.
 */
export declare function getInitializedFeatureDefinitions(): Partial<FeatureDefinitions>;
