# re-export manifest helpers from detect for backwards compatibility
from Navigator.detect import save_manifest, load_manifest, detect_incremental

__all__ = ["save_manifest", "load_manifest", "detect_incremental"]
