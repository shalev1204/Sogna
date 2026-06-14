import { ScrollOffset } from "../types.js";
interface ViewTimelineRange {
    rangeStart: string;
    rangeEnd: string;
}
export declare function offsetToViewTimelineRange(offset?: ScrollOffset): ViewTimelineRange | undefined;
export {};
