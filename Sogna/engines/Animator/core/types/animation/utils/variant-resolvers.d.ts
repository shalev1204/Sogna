import { sognaflowValue } from "sognaflow-dom";
type VariantNameList = string[];
type VariantName = string | VariantNameList;
type UnresolvedVariant = VariantName | sognaflowValue;
export declare const resolveVariantLabels: (variant?: UnresolvedVariant) => VariantNameList;
/**
 * Hooks in React sometimes accept a dependency array as their final argument. (ie useEffect/useMemo)
 * When values in this array change, React re-runs the dependency. However if the array
 * contains a variable number of items, React throws an error.
 */
export declare const asDependencyList: (list: VariantNameList) => string[];
export {};
