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
    
# Tool Properties
    "thoughtcontent": "thoughtContent",
    "bashoutput": "bashOutput",
    "bashsuccess": "bashSuccess",
    "tooldetail": "toolDetail",
    "searchquery": "searchQuery",
    "searchsource": "searchSource",
    "diffstats": "diffStats",
    "toolcallid": "toolCallId",
    
# Types & Hooks (Case correction for pre-existing lowercase)
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
}

# Negative Lookbehind to avoid renaming in some cases if needed, but \b should be enough.

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
# Use word boundaries
                        content = re.sub(rf"\b{low}\b", camel, content)
                    
                    if content != original:
                        with open(path, "w", encoding="utf-8") as f:
                            f.write(content)
                        print(f"Fixed casing in {path}")
                except Exception as e:
                    print(f"Error processing {path}: {e}")

if _name_ == "_main_":
# Apply to all relevant areas
    fix_casing(r"C:\Users\carle\Desktop\Sogna\Sogna\Curator\engines")
    fix_casing(r"C:\Users\carle\Desktop\Sogna\Sogna\sognatore\src")
