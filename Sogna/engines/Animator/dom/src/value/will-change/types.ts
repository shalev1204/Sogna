import type { SognaflowValue } from "../index.js"

export interface WillChange extends SognaflowValue<string> {
add(name: string): void
}
