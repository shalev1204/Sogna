import os
from pathlib import Path
from tree_sitter import Language, Parser
import tree_sitter_python

def debug_tree(node, depth=0):
    field_name = node.field_name_for_child(0) # This is not how it works
    # Actually iterate over children and their field names
    pass

PY_LANG = Language(tree_sitter_python.language())
parser = Parser(PY_LANG)

code = """
@dataclass
class Foo:
    pass
"""

tree = parser.parse(code.encode("utf-8"))

def walk(node, depth=0):
    for i in range(node.child_count):
        child = node.child(i)
        field = node.field_name_for_child(i)
        print("  " * depth + f"{field}: {child.type} [{child.start_point}]")
        walk(child, depth + 1)

walk(tree.root_node)
