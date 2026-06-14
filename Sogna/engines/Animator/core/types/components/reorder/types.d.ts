import { Axis, Box } from "sognaflow-utils";
import { RefObject } from "react";
import { HTMLElements } from "../../render/html/supported-elements.js";
export interface ReorderContextProps<T> {
    axis: "x" | "y";
    registerItem: (item: T, layout: Box) => void;
    updateOrder: (item: T, offset: number, velocity: number) => void;
    groupRef: RefObject<Element | null>;
}
export interface ItemData<T> {
    value: T;
    layout: Axis;
}
export type ReorderElementTag = keyof HTMLElements;
export type DefaultGroupElement = "ul";
export type DefaultItemElement = "li";
