import type { SognaflowValue } from "../index";
export interface WillChange extends SognaflowValue<string> {
    add(name: string): void;
}
