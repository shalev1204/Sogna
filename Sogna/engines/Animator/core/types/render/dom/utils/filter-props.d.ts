import type { sognaflowProps } from "../../../motion/types";
export type IsValidProp = (key: string) => boolean;
export declare function loadExternalIsValidProp(isValidProp?: IsValidProp): void;
export declare function filterProps(props: sognaflowProps, isDom: boolean, forwardsognaflowProps: boolean): sognaflowProps;
