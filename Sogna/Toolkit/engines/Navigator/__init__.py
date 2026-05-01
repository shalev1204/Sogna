"""Navigator - extract · build · cluster · analyze · report."""


def __getattr__(name):
    # Lazy imports so `Navigator install` works before heavy deps are in place.
    _map = {
        "extract": ("Navigator.extract", "extract"),
        "collect_files": ("Navigator.extract", "collect_files"),
        "build_from_json": ("Navigator.build", "build_from_json"),
        "cluster": ("Navigator.cluster", "cluster"),
        "score_all": ("Navigator.cluster", "score_all"),
        "cohesion_score": ("Navigator.cluster", "cohesion_score"),
        "god_nodes": ("Navigator.analyze", "god_nodes"),
        "surprising_connections": ("Navigator.analyze", "surprising_connections"),
        "suggest_questions": ("Navigator.analyze", "suggest_questions"),
        "generate": ("Navigator.report", "generate"),
        "to_json": ("Navigator.export", "to_json"),
        "to_html": ("Navigator.export", "to_html"),
        "to_svg": ("Navigator.export", "to_svg"),
        "to_canvas": ("Navigator.export", "to_canvas"),
        "to_wiki": ("Navigator.wiki", "to_wiki"),
    }
    if name in _map:
        import importlib
        mod_name, attr = _map[name]
        mod = importlib.import_module(mod_name)
        return getattr(mod, attr)
    raise AttributeError(f"module 'Navigator' has no attribute {name!r}")
