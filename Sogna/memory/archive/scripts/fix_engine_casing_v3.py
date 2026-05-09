import os
import re

MAPPING = {
# Theme Config
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
    "messageshadow": "messageShadow",
    "messagedensity": "messageDensity",
    "messagestyle": "messageStyle",
    "inputstyle": "inputStyle",
    "sendbuttonstyle": "sendButtonStyle",
    "stopbuttonstyle": "stopButtonStyle",
    "stickyusermessages": "stickyUserMessages",
    "showdatedivider": "showDateDivider",
    "inputbarplaceholder": "inputBarPlaceholder",
    "textcontrast": "textContrast",
    "showcopybutton": "showCopyButton",
    "attachmentbuttonstyle": "attachmentButtonStyle",
    "attachmentbuttonposition": "attachmentButtonPosition",
    "modelselectorposition": "modelSelectorPosition",
    "modelselectordisplay": "modelSelectorDisplay",
    "modelselectorside": "modelSelectorSide",
    "modeselectorposition": "modeSelectorPosition",
    "inputfill": "inputFill",
    "inputshadow": "inputShadow",
    "showwindowchrome": "showWindowChrome",
    "attachmentpreviewstyle": "attachmentPreviewStyle",
    
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
# We use \b to ensure word boundaries
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
