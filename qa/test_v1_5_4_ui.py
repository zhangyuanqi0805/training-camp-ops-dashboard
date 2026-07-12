#!/usr/bin/env python3
from pathlib import Path
import json
import unittest


ROOT = Path(__file__).resolve().parents[1]


class V154EntryStateTests(unittest.TestCase):
    def test_period_selector_is_single_row_details_control(self):
        views = (ROOT / "src/views.js").read_text(encoding="utf-8")
        styles = (ROOT / "src/styles.css").read_text(encoding="utf-8")
        self.assertIn('<details class="period-switcher"', views)
        self.assertIn('class="period-select-summary"', views)
        self.assertIn('.period-switcher:not([open]) .period-options', styles)

    def test_mature_home_section_keeps_useful_blocks(self):
        views = (ROOT / "src/views.js").read_text(encoding="utf-8")
        for label in (
            "每日经营三指标",
            "当日新增LTV",
            "必修作业率",
            "到课率（主课观看）",
            "班级营收前五",
            "直接问经营问题",
        ):
            self.assertIn(label, views)

    def test_daily_trend_uses_three_series_and_dual_axes(self):
        views = (ROOT / "src/views.js").read_text(encoding="utf-8")
        self.assertIn("function dailyOperatingTrendChart", views)
        self.assertIn("id: 'daily-ltv'", views)
        self.assertIn("id: 'homework-rate'", views)
        self.assertIn("id: 'attendance-rate'", views)
        self.assertIn('data-series="' + "' + seriesRow.id + '", views)
        self.assertIn('data-trend-point="', views)
        self.assertIn('data-trend-tooltip', views)
        self.assertIn("元/人", views)
        self.assertIn("百分比", views)

    def test_602_homework_facts_are_source_backed(self):
        data = json.loads((ROOT / "data/runtime/dashboard_data_v1_5.json").read_text(encoding="utf-8"))
        metrics = {item["metric_id"] for item in data["metric_catalog"]}
        self.assertIn("homework_rate", metrics)
        rows = [
            fact for fact in data["facts"]
            if str(fact.get("period_id")) == "602"
            and fact.get("metric_id") == "homework_rate"
            and fact.get("value_kind") == "actual_daily"
        ]
        self.assertEqual([row["day_key"] for row in rows], [f"D{day}" for day in range(1, 11)])
        self.assertTrue(all(row.get("evidence_status") == "real" for row in rows))

    def test_home_uses_one_common_quota_denominator(self):
        views = (ROOT / "src/views.js").read_text(encoding="utf-8")
        self.assertIn("function quotaShareFunnel", views)
        self.assertIn("node.stage_id === 'actual_pool'", views)
        self.assertIn("占总配额", views)
        self.assertNotIn("sectionHead('紧凑经营漏斗'", views)
        self.assertNotIn('<span class="eyebrow">开营前激活</span>', views)

    def test_quota_funnel_has_exact_inverted_trapezoid_contract(self):
        views = (ROOT / "src/views.js").read_text(encoding="utf-8")
        styles = (ROOT / "src/styles.css").read_text(encoding="utf-8")
        for selector in (
            ".quota-funnel",
            ".quota-funnel-stage",
            ".quota-funnel-shape",
            ".quota-funnel-share",
        ):
            self.assertIn(selector, styles)
        self.assertIn("--quota-top", views)
        self.assertIn("--quota-bottom", views)
        self.assertNotIn("38 + stage.share * 62", views)
        self.assertIn("gap: 0", styles)
        self.assertIn("clip-path: polygon(", styles)
        self.assertIn(".quota-funnel-label", styles)

    def test_build_targets_v154_artifact(self):
        builder = (ROOT / "scripts/build_v1_5_dashboard.py").read_text(encoding="utf-8")
        self.assertIn('OUTPUT_PATH = ROOT / "dist/dashboard.html"', builder)
        self.assertIn("V1.5.4 公网默认入口修正", builder)

    def test_direct_entry_has_deterministic_default_route(self):
        core = (ROOT / "src/core.js").read_text(encoding="utf-8")
        self.assertIn("function directEntryRoute", core)
        self.assertIn("period: '602'", core)
        self.assertIn("day: 'all'", core)
        self.assertIn("module: 'overview'", core)
        self.assertIn("view: 'home'", core)


if __name__ == "__main__":
    unittest.main()
