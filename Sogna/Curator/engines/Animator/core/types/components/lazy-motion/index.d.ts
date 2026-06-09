import { LazyProps } from "./types.js";
/**
 * Used in conjunction with the `m` component to reduce bundle size.
 *
 * `m` is a version of the `sognaflow` component that only loads functionality
 * critical for the initial render.
 *
 * `Lazysognaflow` can then be used to either synchronously or asynchronously
 * load animation and gesture support.
 *
 * ```jsx
 * // Synchronous loading
 * import { Lazysognaflow, m, domAnimation } from "framer-sognaflow"
 *
 * function App() {
 *   return (
 *     <Lazysognaflow features={domAnimation}>
 *       <m.div animate={{ scale: 2 }} />
 *     </Lazysognaflow>
 *   )
 * }
 *
 * // Asynchronous loading
 * import { Lazysognaflow, m } from "framer-sognaflow"
 *
 * function App() {
 *   return (
 *     <Lazysognaflow features={() => import('./path/to/domanimation')}>
 *       <m.div animate={{ scale: 2 }} />
 *     </Lazysognaflow>
 *   )
 * }
 * ```
 *
 * @public
 */
export declare function Lazysognaflow({ children, features, strict }: LazyProps): import("react/jsx-runtime").JSX.Element;
