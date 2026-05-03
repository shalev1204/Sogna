export declare const NumberType: {
    test: (v: number) => boolean;
    parse: typeof parseFloat;
    transform: (v: number) => number;
};
export declare const Alpha: {
    transform: (v: number) => number;
    test: (v: number) => boolean;
    parse: typeof parseFloat;
};
export declare const Scale: {
    default: number;
    test: (v: number) => boolean;
    parse: typeof parseFloat;
    transform: (v: number) => number;
};
