---
name: training-camp-dashboard
description: Maintain, rebuild, validate, and package the 10-day training camp operations dashboard. Use when updating the dashboard data package, refreshing period/day metrics, rebuilding the offline HTML, checking real vs assumed data boundaries, or preparing a colleague delivery ZIP/GitHub release for this dashboard.
---

# Training Camp Dashboard

Use this skill only for this dashboard package.

## Workflow

1. Confirm the task type: view-only handoff, data refresh, page change, QA, or release package.
2. Read `docs/数据口径说明.md` and `data/data_manifest.json` before changing data.
3. Preserve the distinction between real, calculated, and assumed data.
4. Update `data/runtime/dashboard_data_v1_5.json` first, then update `source_map_v1_5.md` and `assumption_registry_v1_5.json`.
5. Rebuild with `python3 scripts/build_v1_5_dashboard.py`.
6. Validate with:

```bash
python3 -m unittest qa/test_v1_5_4_ui.py -v
node qa/validate_v1_5_4_entry_state.cjs
```

7. Do a clean-folder check before saying the package is ready: copy the folder elsewhere, open `index.html`, and verify the page does not depend on external paths.

## Boundaries

- Do not replace assumed values with real labels unless the source map confirms the data.
- Do not preserve symlinks in colleague packages.
- Do not require colleagues to install Codex, Node, Python, or database tools just to view the dashboard.
- Do not remove `docs/`, `data/runtime/`, `data/source_samples/`, or `qa/` from release packages.
