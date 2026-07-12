#!/usr/bin/env python3
"""Bundle the V1.5.3 daily-trend and quota-funnel dashboard into one offline page."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data/runtime/dashboard_data_v1_5.json"
STYLE_PATH = ROOT / "src/styles.css"
SCRIPT_PATHS = [ROOT / "src/core.js", ROOT / "src/query.js", ROOT / "src/views.js"]
OUTPUT_PATH = ROOT / "dist/dashboard.html"


def main() -> int:
    required = [DATA_PATH, STYLE_PATH, *SCRIPT_PATHS]
    missing = [str(path) for path in required if not path.is_file()]
    if missing:
        raise FileNotFoundError("missing dashboard inputs:\n" + "\n".join(missing))

    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    embedded_data = json.dumps(
        data, ensure_ascii=False, separators=(",", ":"), sort_keys=True
    ).replace("</script", "<\\/script")
    styles = STYLE_PATH.read_text(encoding="utf-8")
    scripts = "\n\n".join(path.read_text(encoding="utf-8") for path in SCRIPT_PATHS)
    html = f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>训练营经营看板 | V1.5.3 三指标趋势与倒梯形漏斗</title>
  <style>
{styles}
  </style>
</head>
<body>
  <div id="app" aria-live="polite"></div>
  <script id="dashboard-data" type="application/json">{embedded_data}</script>
  <script>
{scripts}
  </script>
</body>
</html>
"""
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(html, encoding="utf-8")
    print(f"built {OUTPUT_PATH} ({OUTPUT_PATH.stat().st_size:,} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
