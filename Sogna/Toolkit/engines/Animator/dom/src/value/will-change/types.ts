import type { sognaflowValue } from "../index"

export interface WillChange extends sognaflowValue<string> {
    add(name: string): void
}
