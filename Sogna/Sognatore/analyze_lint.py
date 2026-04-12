import json

with open('lint_report.json', 'r') as f:
    data = json.load(f)

errors = {}
for file in data:
    for message in file.get('messages', []):
        rule = message.get('ruleId', 'unknown')
        errors[rule] = errors.get(rule, 0) + 1

# Sort by count
sorted_errors = sorted(errors.items(), key=lambda x: x[1], reverse=True)

print("| Rule | Count |")
print("| :--- | :--- |")
for rule, count in sorted_errors:
    print(f"| {rule} | {count} |")
