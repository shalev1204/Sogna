import os
import json
import subprocess
from datetime import datetime

# Paths
MEMORY_ROOT = r"c:\Users\carle\Desktop\Sogna\Sogna\memory"
EVENT_BUS = os.path.join(MEMORY_ROOT, "intelligence", "events", "bus.json")
GRAPH_PATH = os.path.join(MEMORY_ROOT, "intelligence", "semantic", "graph.json")

class MemoryOrchestrator:
    def __init__(self):
        self.session_id = datetime.now().strftime("%Y%m%d_%H%M%S")

    def log_event(self, event_type, description, metadata=None):
        """Register an event in the Nervous System (Event Bus)"""
        event = {
            "id": f"evt_{datetime.now().timestamp()}",
            "type": event_type,
            "timestamp": datetime.now().isoformat(),
            "description": description,
            "metadata": metadata or {}
        }
        
        try:
            with open(EVENT_BUS, 'r') as f:
                bus = json.load(f)
        except:
            bus = {"events": [], "active_state": {}}
            
        bus['events'].append(event)
        # Keep only last 100 events to prevent bloat
        bus['events'] = bus['events'][-100:]
        
        with open(EVENT_BUS, 'w') as f:
            json.dump(bus, f, indent=2)
            
    def sync_knowledge(self):
        """Trigger autonomous distillation and indexing"""
        print(f"[{self.session_id}] Synchronizing Institutional Memory...")
        
        # 1. Distill recent history
        subprocess.run(["python", "Curator/scripts/ollama_distiller.py"], capture_output=True)
        
        # 2. Re-index vectors
        subprocess.run(["python", "memory/identity/index_uma.py"], capture_output=True)
        
        self.log_event("SYNC_COMPLETE", "Institutional memory synchronized across Vector and Semantic layers.")

    def slow_query(self, user_query):
        """Reason about the query before searching"""
        print(f"[{self.session_id}] Thinking (Slow Mode)...")
        # In a real implementation, this would call an LLM to decide strategy
        # For now, we use our Hybrid GraphRAG directly
        cmd = ["python", "memory/identity/query_uma.py", user_query]
        result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
        return result.stdout

if __name__ == "__main__":
    orchestrator = MemoryOrchestrator()
    # Example sync
    orchestrator.sync_knowledge()
