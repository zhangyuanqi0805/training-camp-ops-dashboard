#!/usr/bin/env python3
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class V152QuotaFunnelTests(unittest.TestCase):
    def test_period_selector_is_single_row_details_control(self):
        views = (ROOT / "src/views.js").read_text(encoding="utf-8")
        styles = (ROOT / "src/styles.css").read_text(encoding="utf-8")
        self.assertIn('<details class="period-switcher"', views)
        self.assertIn('class="period-select-summary"', views)
        self.assertIn('.period-switcher:not([open]) .period-options', styles)

    def test_mature_home_section_keeps_useful_blocks(self):
        views = (ROOT / "src/views.js").read_text(encoding="utf-8")
        for label in (
            "累计营收 vs 目标",
            "班级营收前五",
            "直接问经营问题",
        ):
            self.assertIn(label, views)

    def test_home_uses_one_common_quota_denominator(self):
        views = (ROOT / "src/views.js").read_text(encoding="utf-8")
        self.assertIn("function quotaShareFunnel", views)
        self.assertIn("node.stage_id === 'actual_pool'", views)
        self.assertIn("占总配额", views)
        self.assertNotIn("sectionHead('紧凑经营漏斗'", views)
        self.assertNotIn('<span class="eyebrow">开营前激活</span>', views)

    def test_quota_funnel_has_compact_visual_contract(self):
        styles = (ROOT / "src/styles.css").read_text(encoding="utf-8")
        for selector in (
            ".quota-funnel",
            ".quota-funnel-stage",
            ".quota-funnel-shape",
            ".quota-funnel-share",
        ):
            self.assertIn(selector, styles)

    def test_build_targets_v152_artifact(self):
        builder = (ROOT / "scripts/build_v1_5_dashboard.py").read_text(encoding="utf-8")
        self.assertIn("dist/dashboard.html", builder)
        self.assertIn("data/runtime/dashboard_data_v1_5.json", builder)
        self.assertIn("V1.5.2 总配额占比漏斗", builder)


if __name__ == "__main__":
    unittest.main()
