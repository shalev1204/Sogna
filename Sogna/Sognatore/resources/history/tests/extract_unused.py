import json
import sys

rule_id = sys.argv[1] if len(sys.argv) > 1 else '@typescript-eslint/no-unused-vars'

with open('lint_report.json', 'r') as f:
    data = json.load(f)

for file_entry in data:
    filepath = file_entry.get('filePath', '')
    for msg in file_entry.get('messages', []):
        if msg.get('ruleId') == rule_id:
            print(f"{filepath}:{msg.get('line')}:{msg.get('column')} - {msg.get('message')}")
