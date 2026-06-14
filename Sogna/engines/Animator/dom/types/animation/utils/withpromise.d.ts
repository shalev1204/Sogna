export declare class WithPromise {
    protected _finished: Promise<void>;
    resolve: VoidFunction;
    constructor();
    get finished(): Promise<void>;
    protected updateFinished(): void;
    protected notifyFinished(): void;
    /**
     * Allows the animation to be awaited.
     *
     * @deprecated Use `finished` instead.
     */
    then(onResolve: VoidFunction, onReject?: VoidFunction): Promise<void>;
}
