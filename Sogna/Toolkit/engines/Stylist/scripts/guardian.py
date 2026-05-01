import csv
import os
import re
from pathlib import Path

class StylistGuardian:
    def __init__(self, data_dir=None):
        if data_dir is None:
            self.data_dir = Path("c:/Users/carle/Desktop/Sogna/Sogna/memory/intelligence/design")
        else:
            self.data_dir = Path(data_dir)
            
        self.ux_rules = self._load_rules("ux_guidelines.csv")
        self.perf_rules = self._load_rules("react_performance.csv")
        self._compiled_patterns = self._compile_all_rules()
        
    def _load_rules(self, filename):
        rules = []
        path = self.data_dir / filename
        if not path.exists():
            return []
        with open(path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                rules.append(row)
        return rules

    def _compile_all_rules(self):
        compiled = []
        for rule in self.ux_rules + self.perf_rules:
            keywords = rule.get("Keywords", rule.get("Issue", "")).split(",")
            patterns = [k.strip() for k in keywords if k.strip()]
            for p in patterns:
                try:
                    compiled.append({
                        "regex": re.compile(r'\b' + re.escape(p) + r'\b', re.IGNORECASE),
                        "rule": rule
                    })
                except:
                    continue
        return compiled

    def audit_code(self, code, filename="unknown.js"):
        results = {
            "file": filename,
            "score": 100,
            "violations": []
        }
        
        for item in self._compiled_patterns:
            if item["regex"].search(code):
                rule = item["rule"]
                bad_example = rule.get("Code Example Bad", "")
                if not bad_example or bad_example in code:
                    # Avoid duplicate violations for the same rule
                    if not any(v["issue"] == rule.get("Issue") for v in results["violations"]):
                        results["violations"].append({
                            "category": rule.get("Category"),
                            "issue": rule.get("Issue"),
                            "severity": rule.get("Severity"),
                            "description": rule.get("Description"),
                            "suggestion": rule.get("Do")
                        })
                        
                        severity = rule.get("Severity", "Medium").lower()
                        if severity == "critical": results["score"] -= 20
                        elif severity == "high": results["score"] -= 10
                        elif severity == "medium": results["score"] -= 5
                        else: results["score"] -= 2

        results["score"] = max(0, results["score"])
        return results

if __name__ == "__main__":
    guardian = StylistGuardian()
    # Test audit
    test_code = """
    const data = await fetch(); 
    if (skip) return { skipped: true };
    """
    report = guardian.audit_code(test_code, "test.js")
    print(f"Audit Results for {report['file']} - Score: {report['score']}")
    for v in report["violations"]:
        print(f"[{v['severity']}] {v['category']}: {v['issue']} - {v['suggestion']}")
