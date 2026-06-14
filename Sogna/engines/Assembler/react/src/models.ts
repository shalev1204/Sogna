import type { ModelOption } from "./types.js"

/** Claude model IDs supported by the hub */
export type ClaudeModelId = "opus" | "sonnet" | "haiku"

/** Pre-defined Claude models available through the hub */
export const CLAUDE_MODELS: ModelOption[] = [
{ id: "sonnet", name: "Sonnet", version: "4.6" },
{ id: "opus", name: "Opus", version: "4.6" },
{ id: "haiku", name: "Haiku", version: "4.5" },
]

/** Default model ID */
export const DEFAULT_MODEL_ID: ClaudeModelId = "sonnet"

// Legacy model aliases kept for compatibility.
export type AnClaudeModelId = ClaudeModelId
export const AN_CLAUDE_MODELS = CLAUDE_MODELS
export const AN_DEFAULT_MODEL_ID = DEFAULT_MODEL_ID
