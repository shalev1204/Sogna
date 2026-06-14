import { sognaflowProps } from "../../motion/types";
import { ResolvedValues } from "../types.js";
export declare function useSVGProps(props: sognaflowProps, visualState: ResolvedValues, _isStatic: boolean, Component: string | React.ComponentType<React.PropsWithChildren<unknown>>): {
    style: {
        [key: string]: import("sognaflow-dom").AnyResolvedKeyframe;
    };
};
