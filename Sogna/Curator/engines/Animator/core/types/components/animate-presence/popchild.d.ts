import * as React from "react";
interface Props {
    children: React.ReactElement;
    isPresent: boolean;
    anchorX?: "left" | "right";
    anchorY?: "top" | "bottom";
    root?: HTMLElement | ShadowRoot;
    pop?: boolean;
}
export declare function PopChild({ children, isPresent, anchorX, anchorY, root, pop }: Props): import("react/jsx-runtime").JSX.Element;
export {};
