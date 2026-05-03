import { AnimationPlaybackControls, TimelineWithFallback } from "./types";
export type AcceptedAnimations = AnimationPlaybackControls;
export type GroupedAnimations = AcceptedAnimations[];
export declare class GroupAnimation implements AnimationPlaybackControls {
    animations: GroupedAnimations;
    constructor(animations: Array<AcceptedAnimations | undefined>);
    get finished(): Promise<any[]>;
    /**
     * TODO: Filter out cancelled or stopped animations before returning
     */
    private getAll;
    private setAll;
    attachTimeline(timeline: TimelineWithFallback): () => void;
    get time(): number;
    set time(time: number);
    get speed(): number;
    set speed(speed: number);
    get state(): any;
    get startTime(): any;
    get duration(): number;
    get iterationDuration(): number;
    private runAll;
    play(): void;
    pause(): void;
    stop: () => void;
    cancel(): void;
    complete(): void;
}
