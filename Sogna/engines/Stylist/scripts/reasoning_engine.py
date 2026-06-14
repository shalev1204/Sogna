#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sogna Stylist Reasoning Engine
Inherited and refined from ui-ux-pro-max logic.
Responsible for industrial-grade design decision mapping.
"""

import csv
import json
import os
from pathlib import Path

# Paths relative to Sogna root
DATA_DIR = Path(__file__).parent.parent.parent.parent.parent / "memory" / "intelligence" / "design"
REASONING_FILE = "ui-reasoning.csv"

class StylistReasoning:
    def __init__(self):
        self.rules = self._load_rules()

    def _load_rules(self):
        filepath = DATA_DIR / REASONING_FILE
        if not filepath.exists():
            return []
        with open(filepath, 'r', encoding='utf-8') as f:
            return list(csv.DictReader(f))

    def resolve_category(self, query):
        """Map query to the best UI Category rule."""
        query_lower = query.lower()
        
# Scoring match
        best_rule = None
        highest_score = 0
        
        for rule in self.rules:
            cat = rule.get("UI_Category", "").lower()
            score = 0
            
            if cat == query_lower:
                score = 100
            elif cat in query_lower:
                score = 50
            else:
# Keyword intersection
                keywords = cat.replace("/", " ").replace("-", " ").split()
                matches = [kw for kw in keywords if kw in query_lower]
                score = len(matches) * 10
            
            if score > highest_score:
                highest_score = score
                best_rule = rule
                
        return best_rule if highest_score > 0 else None

    def get_instructions(self, query):
        rule = self.resolve_category(query)
        if not rule:
            return {
                "category": "General",
                "pattern": "Hero + Features + CTA",
                "style": "Minimalism",
                "colors": "Professional",
                "severity": "MEDIUM"
            }
            
        return {
            "category": rule.get("UI_Category"),
            "pattern": rule.get("Recommended_Pattern"),
            "style": rule.get("Style_Priority"),
            "colors": rule.get("Color_Mood"),
            "typography": rule.get("Typography_Mood"),
            "effects": rule.get("Key_Effects"),
            "anti_patterns": rule.get("Anti_Patterns"),
            "severity": rule.get("Severity")
        }

if __name__ == "__main__":
# Test
    sr = StylistReasoning()
    print(json.dumps(sr.get_instructions("Fintech banking app"), indent=2))
