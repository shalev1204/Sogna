import * as React from "react";
import { JSX } from "react";
import { HTMLsognaflowProps } from "../../render/html/types.js";
import { DefaultGroupElement, ReorderElementTag } from "./types.js";
export interface Props<V, TagName extends ReorderElementTag = DefaultGroupElement> {
    /**
     * A HTML element to render this component as. Defaults to `"ul"`.
     *
     * @public
     */
    as?: TagName;
    /**
     * The axis to reorder along. By default, items will be draggable on this axis.
     * To make draggable on both axes, set `<Reorder.Item drag />`
     *
     * @public
     */
    axis?: "x" | "y";
    /**
     * A callback to fire with the new value order. For instance, if the values
     * are provided as a state from `useState`, this could be the set state function.
     *
     * @public
     */
    onReorder: (newOrder: V[]) => void;
    /**
     * The latest values state.
     *
     * ```jsx
     * function Component() {
     *   const [items, setItems] = useState([0, 1, 2])
     *
     *   return (
     *     <Reorder.Group values={items} onReorder={setItems}>
     *         {items.map((item) => <Reorder.Item key={item} value={item} />)}
     *     </Reorder.Group>
     *   )
     * }
     * ```
     *
     * @public
     */
    values: V[];
}
type ReorderGroupProps<V, TagName extends ReorderElementTag = DefaultGroupElement> = Props<V, TagName> & Omit<HTMLsognaflowProps<TagName>, "values"> & React.PropsWithChildren<{}>;
export declare function ReorderGroupComponent<V, TagName extends ReorderElementTag = DefaultGroupElement>({ children, as, axis, onReorder, values, ...props }: ReorderGroupProps<V, TagName>, externalRef?: React.ForwardedRef<any>): JSX.Element;
export declare const ReorderGroup: <V, TagName extends ReorderElementTag = DefaultGroupElement>(props: ReorderGroupProps<V, TagName> & {
    ref?: React.ForwardedRef<any>;
}) => ReturnType<typeof ReorderGroupComponent>;
export {};
