import os
import re

# Mapping of lowercase to camelCase for Sogna components
MAPPING = {
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
    "bashcommand": "bashCommand"
}

def fix_casing(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith((".ts", ".tsx", ".js", ".jsx")):
                path = os.path.join(root, file)
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                
                original = content
                for low, camel in MAPPING.items():
                    # Match as property access: .low or props.low or { low }
                    # We use negative lookahead to avoid renaming the definitions themselves if they are already camelCase
                    # But here we want to replace lowercase with camelCase
                    # Use boundaries to avoid partial matches
                    content = re.sub(rf"\b{low}\b", camel, content)
                
                if content != original:
                    with open(path, "w", encoding="utf-8") as f:
                        f.write(content)
                    print(f"Fixed casing in {path}")

if __name__ == "__main__":
    # Fix Assembler/react
    fix_casing(r"C:\Users\carle\Desktop\Sogna\Sogna\Curator\engines\assembler\react\src")
    # Fix other engines if needed
    fix_casing(r"C:\Users\carle\Desktop\Sogna\Sogna\Curator\engines\sentinel")
    fix_casing(r"C:\Users\carle\Desktop\Sogna\Sogna\Curator\engines\predatore")
