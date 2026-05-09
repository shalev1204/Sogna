import os
import re

# Restoration of legacy aliases that were incorrectly renamed
RESTORE = {
    "export type StepState = StepState": "export type stepstate = StepState",
    "export type TimelineStep = TimelineStep": "export type timelinestep = TimelineStep",
    "export type ChatTheme = ChatTheme": "export type chattheme = ChatTheme",
"export type ChatClassNames = ChatClassNames": "export type chatclassnames = ChatClassNames",
    "export type ChatSlots = ChatSlots": "export type chatslots = ChatSlots",
    "export type CreateAgentChatOptions = CreateAgentChatOptions": "export type createagentchatoptions = CreateAgentChatOptions",
    "export type CustomToolRendererProps = CustomToolRendererProps": "export type customtoolrendererprops = CustomToolRendererProps",
    "export type ModelOption = ModelOption": "export type modeloption = ModelOption",
    "export type AgentChatProps = AgentChatProps": "export type agentchatprops = AgentChatProps",
    "export const ImageThumb = ImageThumb": "export const imagethumb = ImageThumb",
    "export const ImageThumbInput = ImageThumbInput": "export const imagethumbinput = ImageThumbInput",
    "export const InlineModeSelector = InlineModeSelector": "export const inlinemodeselector = InlineModeSelector",
    "export type AttachedImage = AttachedImage": "export type attachedimage = AttachedImage",
    "export type AttachedFile = AttachedFile": "export type attachedfile = AttachedFile",
}

def restore_aliases(directory):
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        for file in files:
            if file.endswith((".ts", ".tsx")):
                path = os.path.join(root, file)
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                original = content
                for target, replacement in RESTORE.items():
                    content = content.replace(target, replacement)
                if content != original:
                    with open(path, "w", encoding="utf-8") as f:
                        f.write(content)
                    print(f"Restored aliases in {path}")

if _name_ == "_main_":
    restore_aliases(r"C:\Users\carle\Desktop\Sogna\Sogna\Curator\engines")
