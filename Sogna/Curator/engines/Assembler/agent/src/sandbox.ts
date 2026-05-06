import type { SandboxConfig, SandboxOptions } from "./types.js"

export function Sandbox(config: SandboxOptions = {}): SandboxConfig {
  return { _type: "sandbox" as const, ...config }
}
