export type ElementOrSelector = Element | Element[] | NodeListOf<Element> | string | null | undefined;
export interface WithQuerySelectorAll {
    querySelectorAll: Element["querySelectorAll"];
}
export interface AnimationScope<T = any> {
    readonly current: T;
    animations: any[];
}
export interface SelectorCache {
    [key: string]: NodeListOf<Element>;
}
export declare function ResolveElements(elementOrSelector: ElementOrSelector, scope?: AnimationScope, selectorCache?: SelectorCache): Element[];
