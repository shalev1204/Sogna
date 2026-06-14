import { ReactElement, ReactNode } from "react";
export type ComponentKey = string | number;
export declare const getChildKey: (child: ReactElement<any>) => ComponentKey;
export declare function onlyElements(children: ReactNode): ReactElement<any>[];
