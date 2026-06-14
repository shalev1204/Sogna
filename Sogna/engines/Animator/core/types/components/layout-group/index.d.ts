import * as React from "react";
type InheritOption = boolean | "id";
export interface Props {
    id?: string;
    inherit?: InheritOption;
}
export declare const LayoutGroup: React.FunctionComponent<React.PropsWithChildren<Props>>;
export {};
