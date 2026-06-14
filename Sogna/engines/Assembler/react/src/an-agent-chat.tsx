import { useRef, useEffect, useMemo } from "react"
import { MessageList } from "./components/message-list.js"
import { InputBar } from "./components/input-bar.js"
import { WindowChrome } from "./components/window-chrome.js"
import { applyTheme } from "./theme.js"
import { cn } from "./utils/cn.js"
import { ThemeConfigContext, extractThemeConfig } from "./theme-config.js"
import type { AgentChatProps } from "./types.js"

export function AgentChat({
  messages,
  onSend,
  status,
  onStop,
  error,
  theme,
  colorMode = "auto",
  classNames,
  slots,
  showWindowChrome,
  modelSelector,
  modeSelector,
  attachments,
  className,
  style,
}: AgentChatProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!rootRef.current || !theme) return undefined

    applyTheme(rootRef.current, theme, colorMode)

    // Re-apply theme when system color scheme changes (for colorMode="auto")
    if (colorMode === "auto") {
      const mql = window.matchMedia("(prefers-color-scheme: dark)")
      const onChange = () => {
        if (rootRef.current) {
          applyTheme(rootRef.current, theme, colorMode)
        }
      }
      mql.addEventListener("change", onChange)
      return () => mql.removeEventListener("change", onChange)
    }
    return undefined
  }, [theme, colorMode])

  const themeConfig = useMemo(() => extractThemeConfig(theme), [theme])

  const ResolvedInputBar = slots?.InputBar ?? InputBar
  const shouldShowChrome = showWindowChrome ?? themeConfig.showWindowChrome

  return (
    <ThemeConfigContext.Provider value={themeConfig}>
      <div
        ref={rootRef}
        className={cn("an-root flex flex-col h-full", classNames?.root, className)}
        style={{
          fontFamily: "var(--an-font-family)",
          fontSize: "var(--an-text-size)",
          color: "var(--an-foreground)",
          backgroundColor: "var(--an-background)",
          ...style,
        }}
      >
        {shouldShowChrome && <WindowChrome />}

        <MessageList
          messages={messages}
          status={status}
          classNames={classNames}
          slots={slots}
        />

        {error && (
          <div className="an-error px-4 py-2 text-sm" style={{ color: "#ef4444" }}>
            {error.message}
          </div>
        )}

        <ResolvedInputBar
          onSend={onSend}
          status={status}
          onStop={onStop}
          placeholder={themeConfig.inputBarPlaceholder}
          className={classNames?.inputBar}
          modelSelector={modelSelector}
          modeSelector={modeSelector}
          onAttach={attachments?.onAttach}
          attachedImages={attachments?.images}
          attachedFiles={attachments?.files}
          onRemoveImage={attachments?.onRemoveImage}
          onRemoveFile={attachments?.onRemoveFile}
          onPaste={attachments?.onPaste}
          isDragOver={attachments?.isDragOver}
        />
      </div>
    </ThemeConfigContext.Provider>
  )
}

// Legacy component alias kept for compatibility.
export const AnAgentChat = AgentChat
