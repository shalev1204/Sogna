export interface AppearStoreEntry {
    animation: Animation;
    startTime: number | null;
}
export type AppearElementId = string;
export type IsComplete = boolean;
export declare const appearAnimationStore: Map<string, AppearStoreEntry>;
export declare const appearComplete: Map<string, boolean>;
