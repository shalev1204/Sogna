import { memo, type ComponentType } from "react"
import { toolRegistry, parseMcpToolType } from "./tool-registry.js"
import { getToolStatus } from "../utils/format-tool.js"
import { useThemeConfig } from "../theme-config.js"
import { GenericTool } from "./generic-tool.js"
import { BashTool } from "./bash-tool.js"
import { EditTool } from "./edit-tool.js"
import { SearchTool } from "./search-tool.js"
import { TodoTool } from "./todo-tool.js"
import { PlanTool } from "./plan-tool.js"
import { TaskTool } from "./task-tool.js"
import { McpTool, unwrapMcpOutput } from "./mcp-tool.js"
import { ThinkingTool } from "./thinking-tool.js"
import type { CustomToolRendererProps } from "../types.js"

interface ToolRendererProps {
  part: any
  chatStatus?: string
  toolRenderers?: Record<string, ComponentType<CustomToolRendererProps>>
}

function deriveToolStatus(part: any, chatStatus?: string): CustomToolRendererProps["status"] {
  if (part.state === "input-streaming") return "streaming"
  if (part.state === "output-available") return "success"
  if (part.state === "output-error") return "error"
  const { isPending } = getToolStatus(part, chatStatus)
  return isPending ? "pending" : "success"
}

export const ToolRenderer = memo(function ToolRenderer({ part, chatStatus, toolRenderers }: ToolRendererProps) {
  const partType = part.type as string
  const config = useThemeConfig()
  const showIcon = config.showToolIcons

  // Specialized tool components with variant dispatch
  switch (partType) {
    case "tool-Bash":
      if (config.bashDisplay === "hidden") return null
      return <BashTool part={part} variant={config.bashDisplay} showIcon={showIcon} />
    case "tool-Edit":
    case "tool-Write":
      if (config.codeActionDisplay === "hidden") return null
      return <EditTool part={part} variant={config.codeActionDisplay} showIcon={showIcon} />
    case "tool-WebSearch":
      if (config.searchDisplay === "hidden") return null
      return <SearchTool part={part} variant={config.searchDisplay} showIcon={showIcon} />
    case "tool-PlanWrite":
      return <PlanTool part={part} chatStatus={chatStatus} />
    case "tool-TodoWrite":
      return <TodoTool part={part} chatStatus={chatStatus} />
    case "tool-Task":
    case "tool-Agent":
      return <TaskTool part={part} chatStatus={chatStatus} />
    case "tool-Thinking":
      if (config.thinkingDisplay === "hidden") return null
      return <ThinkingTool part={part} variant={config.thinkingDisplay} showIcon={showIcon} />
  }

  // MCP tools
  const mcpInfo = parseMcpToolType(partType)
  if (mcpInfo) {
    // Custom renderer for user-defined tools
    if (toolRenderers && mcpInfo.serverName === "user-tools") {
      const CustomRenderer = toolRenderers[mcpInfo.toolName]
      if (CustomRenderer) {
        return (
          <CustomRenderer
            name={mcpInfo.toolName}
            input={(part.input ?? {}) as Record<string, unknown>}
            output={part.output ? unwrapMcpOutput(part.output) : undefined}
            status={deriveToolStatus(part, chatStatus)}
          />
        )
      }
    }
    return <McpTool part={part} mcpInfo={mcpInfo} chatStatus={chatStatus} />
  }

  // Registry-based generic tools (Read, Grep, Glob, WebFetch, etc.)
  const meta = toolRegistry[partType]
  if (meta) {
    const { isPending } = getToolStatus(part, chatStatus)
    return (
      <GenericTool
        icon={meta.icon}
        title={meta.title(part)}
        subtitle={meta.subtitle?.(part)}
        isPending={isPending}
        showIcon={showIcon}
      />
    )
  }

  // Fallback: show tool name
  const toolName = partType.startsWith("tool-") ? partType.slice(5) : partType
  const { isPending } = getToolStatus(part, chatStatus)
  return (
    <GenericTool
      icon={({ className }: { className?: string }) => <span className={className}>*</span>}
      title={isPending ? `Running ${toolName}` : toolName}
      isPending={isPending}
      showIcon={showIcon}
    />
  )
})
