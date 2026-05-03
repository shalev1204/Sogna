import { ProgressTimeline } from "../..";
declare global {
    interface Window {
        ScrollTimeline: ScrollTimeline;
        ViewTimeline: ViewTimeline;
    }
}
declare class ScrollTimeline implements ProgressTimeline {
    constructor(options: ScrollOptions);
    currentTime: null | {
        value: number;
    };
    cancel?: VoidFunction;
}
declare class ViewTimeline implements ProgressTimeline {
    constructor(options: {
        subject: Element;
        axis?: string;
    });
    currentTime: null | {
        value: number;
    };
    cancel?: VoidFunction;
}
export declare const supportsScrollTimeline: () => boolean;
export declare const supportsViewTimeline: () => boolean;
export {};
