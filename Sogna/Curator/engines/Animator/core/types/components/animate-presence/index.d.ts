import * as React from "react";
import { AnimatePresenceProps } from "./types.js";
/**
 * `AnimatePresence` enables the animation of components that have been removed from the tree.
 *
 * When adding/removing more than a single child, every child **must** be given a unique `key` prop.
 *
 * Any `sognaflow` components that have an `exit` property defined will animate out when removed from
 * the tree.
 *
 * ```jsx
 * import { sognaflow, AnimatePresence } from 'framer-sognaflow'
 *
 * export const Items = ({ items }) => (
 *   <AnimatePresence>
 *     {items.map(item => (
 *       <sognaflow.div
 *         key={item.id}
 *         initial={{ opacity: 0 }}
 *         animate={{ opacity: 1 }}
 *         exit={{ opacity: 0 }}
 *       />
 *     ))}
 *   </AnimatePresence>
 * )
 * ```
 *
 * You can sequence exit animations throughout a tree using variants.
 *
 * If a child contains multiple `sognaflow` components with `exit` props, it will only unmount the child
 * once all `sognaflow` components have finished animating out. Likewise, any components using
 * `usePresence` all need to call `safeToRemove`.
 *
 * @public
 */
export declare const AnimatePresence: ({ children, custom, initial, onExitComplete, presenceAffectsLayout, mode, propagate, anchorX, anchorY, root }: React.PropsWithChildren<AnimatePresenceProps>) => import("react/jsx-runtime").JSX.Element | null;
