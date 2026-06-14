import { sognaflowValue } from "sognaflow-dom";
/**
 * @public
 */
export interface ScrollsognaflowValues {
    scrollX: sognaflowValue<number>;
    scrollY: sognaflowValue<number>;
    scrollXProgress: sognaflowValue<number>;
    scrollYProgress: sognaflowValue<number>;
}
export interface ScrollOffsets {
    xOffset: number;
    yOffset: number;
    xMaxOffset: number;
    yMaxOffset: number;
}
export type GetScrollOffsets = () => ScrollOffsets;
export declare function createScrollsognaflowValues(): ScrollsognaflowValues;
export declare function createScrollUpdater(values: ScrollsognaflowValues, getOffsets: GetScrollOffsets): () => void;
