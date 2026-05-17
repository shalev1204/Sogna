import sys
import json
import importlib
from pathlib import Path

def run_tool(tool_module_name, inputs):
    try:
        # Add parent to path to allow imports from tools.base_tool
        sys.path.append(str(Path(__file__).resolve().parent.parent))
        
        module = importlib.import_module(f"arsenal.{tool_module_name}")
        
        # Find the tool class (inherits from BaseTool)
        tool_class = None
        for attr_name in dir(module):
            attr = getattr(module, attr_name)
            if isinstance(attr, type) and attr_name != "BaseTool" and hasattr(attr, "execute"):
                tool_class = attr
                break
        
        if not tool_class:
            return {"success": False, "error": f"No tool class found in {tool_module_name}"}
        
        tool = tool_class()
        result = tool.execute(inputs)
        
        # Convert ToolResult to dict
        return {
            "success": result.success,
            "data": result.data,
            "artifacts": result.artifacts,
            "error": result.error,
            "duration": result.duration_seconds
        }
    except Exception as e:
        import traceback
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "error": "Usage: runner.py <module_name> <json_inputs>"}))
        sys.exit(1)
    
    module_name = sys.argv[1]
    input_arg = sys.argv[2]
    
    try:
        if input_arg.startswith("@"):
            with open(input_arg[1:], "r", encoding="utf-8") as f:
                inputs = json.load(f)
        else:
            inputs = json.loads(input_arg)
    except Exception as e:
        print(json.dumps({"success": False, "error": f"Invalid inputs: {str(e)}"}))
        sys.exit(1)
        
    res = run_tool(module_name, inputs)
    print(json.dumps(res))
