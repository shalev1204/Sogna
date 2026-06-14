import { sognaflowValue, sognaflowValueEventCallbacks } from "sognaflow-dom";
export declare function usesognaflowValueEvent<V, EventName extends keyof sognaflowValueEventCallbacks<V>>(value: sognaflowValue<V>, event: EventName, callback: sognaflowValueEventCallbacks<V>[EventName]): void;
