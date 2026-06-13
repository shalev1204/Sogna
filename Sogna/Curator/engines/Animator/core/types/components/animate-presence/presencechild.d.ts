import * as React from "react";
import { VariantLabels } from "../../motion/types";
interface PresenceChildProps {
    children: React.ReactElement;
    isPresent: boolean;
    onExitComplete?: () => void;
    initial?: false | VariantLabels;
    custom?: any;
    presenceAffectsLayout: boolean;
    mode: "sync" | "popLayout" | "wait";
    anchorX?: "left" | "right";
    anchorY?: "top" | "bottom";
    root?: HTMLElement | ShadowRoot;
}
export declare const PresenceChild: ({ children, initial, isPresent, onExitComplete, custom, presenceAffectsLayout, mode, anchorX, anchorY, root }: PresenceChildProps) => import("react/jsx-runtime").JSX.Element;
export {};
