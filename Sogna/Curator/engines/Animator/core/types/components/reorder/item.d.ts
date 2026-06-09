import * as React from "react";
import { HTMLsognaflowProps } from "../../render/html/types.js";
import { DefaultItemElement, ReorderElementTag } from "./types.js";
export interface Props<V, TagName extends ReorderElementTag = DefaultItemElement> {
    /**
     * A HTML element to render this component as. Defaults to `"li"`.
     *
     * @public
     */
    as?: TagName;
    /**
     * The value in the list that this component represents.
     *
     * @public
     */
    value: V;
    /**
     * A subset of layout options primarily used to disable layout="size"
     *
     * @public
     * @default true
     */
    layout?: true | "position";
}
type ReorderItemProps<V, TagName extends ReorderElementTag = DefaultItemElement> = Props<V, TagName> & Omit<HTMLsognaflowProps<TagName>, "value" | "layout"> & React.PropsWithChildren<{}>;
export declare function ReorderItemComponent<V, TagName extends ReorderElementTag = DefaultItemElement>({ children, style, value, as, onDrag, onDragEnd, layout, ...props }: ReorderItemProps<V, TagName>, externalRef?: React.ForwardedRef<any>): React.JSX.Element;
export declare const ReorderItem: <V, TagName extends ReorderElementTag = DefaultItemElement>(props: ReorderItemProps<V, TagName> & {
    ref?: React.ForwardedRef<any>;
}) => ReturnType<typeof ReorderItemComponent>;
export {};
