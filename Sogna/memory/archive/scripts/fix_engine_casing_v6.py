import os
import re

MAPPING = {
    # Theme Config & Options
    "thinkingdisplay": "thinkingDisplay",
    "codeactiondisplay": "codeActionDisplay",
    "bashdisplay": "bashDisplay",
    "searchdisplay": "searchDisplay",
    "showtoolicons": "showToolIcons",
    "toolcallstyle": "toolCallStyle",
    "toolvariant": "toolVariant",
    "difflines": "diffLines",
    "filepath": "filePath",
    "toolname": "toolName",
    "ispending": "isPending",
    "iserror": "isError",
    "issuccess": "isSuccess",
    "isinterrupted": "isInterrupted",
    "tokenurl": "tokenUrl",
    "gettoken": "getToken",
    "apiurl": "apiUrl",
    "sandboxid": "sandboxId",
    "threadid": "threadId",
    "onfinish": "onFinish",
    "onerror": "onError",
    "activemode": "activeMode",
    "onmodechange": "onModeChange",
    "activemodelid": "activeModelId",
    "onmodelchange": "onModelChange",
    "innerradius": "innerRadius",
    "stopstyle": "stopStyle",
    "istyping": "isTyping",
    "isstreaming": "isStreaming",
    "previewstyle": "previewStyle",
    "onremoveimage": "onRemoveImage",
    "onremovefile": "onRemoveFile",
    "strokedasharray": "strokeDasharray",
    "strokedashoffset": "strokeDashoffset",
    "strokelinecap": "strokeLinecap",
    "tokenfetcher": "tokenFetcher",
    "wordinterval": "wordInterval",
    "delaybefore": "delayBefore",
    "autostart": "autoStart",
    "visiblecount": "visibleCount",
    "displayedtext": "displayedText",
    "showimage": "showImage",
    "visiblechars": "visibleChars",
    "isactive": "isActive",
    
    # Tool Properties
    "thoughtcontent": "thoughtContent",
    "bashoutput": "bashOutput",
    "bashsuccess": "bashSuccess",
    "tooldetail": "toolDetail",
    "searchquery": "searchQuery",
    "searchsource": "searchSource",
    "diffstats": "diffStats",
    "toolcallid": "toolCallId",
    
    # Types & Hooks
    "toolsize": "ToolSize",
    "sourcetype": "SourceType",
    "usestreamingtext": "useStreamingText",
    "usetoolcomplete": "useToolComplete",
    "stepstate": "StepState",
    "timelinestep": "TimelineStep",
    "toolrowbase": "ToolRowBase",
    "createagentchatoptions": "CreateAgentChatOptions",
    "agentchatprops": "AgentChatProps",
    "modeloption": "ModelOption",
    "chatslots": "ChatSlots",
    "chatclassnames": "ChatClassNames",
    "chattheme": "ChatTheme",
    "customtoolrendererprops": "CustomToolRendererProps",
    "useinputtyping": "useInputTyping",
    "returntype": "ReturnType",
    "cleartimeout": "clearTimeout",
    "elementtype": "ElementType",
    "imagethumb": "ImageThumb",
    "imagethumbinput": "ImageThumbInput",
    "writetool": "WriteTool",
    "inlinemodeselector": "InlineModeSelector",
    "attachedimage": "AttachedImage",
    "attachedfile": "AttachedFile",
    "jsx": "JSX",
}

def fix_casing(directory):
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if 'dist' in dirs:
            dirs.remove('dist')
            
        for file in files:
            if file.endswith((".ts", ".tsx", ".js", ".jsx", ".md")):
                path = os.path.join(root, file)
                try:
                    with open(path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                    
                    original = content
                    for low, camel in MAPPING.items():
                        if low == camel: continue
                        
                        # Use word boundaries and negative lookahead to avoid renaming the left side of an assignment
                        # which is usually the legacy alias definition.
                        # Also avoid 'export type low =' or 'export const low ='
                        content = re.sub(rf"(?<!export type |export const )\b{low}\b(?!\s*=)", camel, content)
                    
                    if content != original:
                        with open(path, "w", encoding="utf-8") as f:
                            f.write(content)
                        print(f"Fixed casing in {path}")
                except Exception as e:
                    print(f"Error processing {path}: {e}")

if __name__ == "__main__":
    fix_casing(r"C:\Users\carle\Desktop\Sogna\Sogna\Curator\engines")
    fix_casing(r"C:\Users\carle\Desktop\Sogna\Sogna\sognatore\src")
