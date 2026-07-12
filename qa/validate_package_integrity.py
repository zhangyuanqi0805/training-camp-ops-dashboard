#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


REQUIRED_FILES = [
    "index.html",
    "dist/dashboard.html",
    "data/runtime/dashboard_data_v1_5.json",
    "data/runtime/source_map_v1_5.md",
    "data/runtime/assumption_registry_v1_5.json",
    "data/data_manifest.json",
    "docs/使用说明.md",
    "docs/数据口径说明.md",
    "docs/页面与功能清单.md",
    "docs/更新数据流程.md",
    "README.md",
]


FORBIDDEN_SNIPPETS = [
    "file:///Users/",
    "/Users/zhangyuanqi/",
    "../2026-07-",
    "00_打开训练营经营看板_V1_5_2.html",
    "pages/V1_5_2_quota_funnel_dashboard.html",
]


def main() -> int:
    missing = [path for path in REQUIRED_FILES if not (ROOT / path).is_file()]
    if missing:
        raise AssertionError("missing required files:\n" + "\n".join(missing))

    links = [path for path in ROOT.rglob("*") if path.is_symlink()]
    if links:
        raise AssertionError("symlinks are not allowed:\n" + "\n".join(str(path) for path in links))

    checked_text = []
    for pattern in ("*.html", "*.md", "*.json", "*.js", "*.py"):
        checked_text.extend(ROOT.rglob(pattern))
    for path in checked_text:
        if path.is_file():
            if path == Path(__file__).resolve():
                continue
            text = path.read_text(encoding="utf-8", errors="ignore")
            for snippet in FORBIDDEN_SNIPPETS:
                if snippet in text:
                    raise AssertionError(f"forbidden snippet {snippet!r} found in {path.relative_to(ROOT)}")

    index = (ROOT / "index.html").read_text(encoding="utf-8")
    dashboard = (ROOT / "dist/dashboard.html").read_text(encoding="utf-8")
    if "dist/dashboard.html#period=602" not in index:
        raise AssertionError("index.html does not point to bundled dashboard")
    if 'id="dashboard-data"' not in dashboard:
        raise AssertionError("dashboard.html does not embed runtime data")

    print("package integrity: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
