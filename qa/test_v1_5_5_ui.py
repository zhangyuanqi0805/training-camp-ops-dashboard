#!/usr/bin/env python3
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class V155ElectiveHomeworkFunnelTests(unittest.TestCase):
    def setUp(self):
        self.views = (ROOT / "src/views.js").read_text(encoding="utf-8")
        self.styles = (ROOT / "src/styles.css").read_text(encoding="utf-8")

    def test_daily_trend_uses_elective_homework_real_metric_and_green(self):
        start = self.views.index("function dailyOperatingTrendChart")
        end = self.views.index("function detailFact", start)
        chart = self.views[start:end]
        self.assertIn("id: 'elective-homework-rate'", chart)
        self.assertIn("label: '选修作业率'", chart)
        self.assertIn("factValue('daily_question_rate'", chart)
        self.assertIn("color: '#1f8a70'", chart)
        self.assertNotIn("label: '必修作业率'", chart)
        self.assertNotIn("question * 0.96", chart)
        self.assertIn("当日新增LTV、选修作业率和到课率每日趋势", chart)

    def test_funnel_uses_left_share_center_value_and_right_yoy(self):
        start = self.views.index("function quotaShareFunnel")
        end = self.views.index("function segmentedFunnel", start)
        funnel = self.views[start:end]
        self.assertIn("previousPeriodId", funnel)
        self.assertIn("previousCount", funnel)
        self.assertIn("yearOverYear", funnel)
        self.assertIn('class="quota-funnel-share"', funnel)
        self.assertIn('class="quota-funnel-value"', funnel)
        self.assertIn('class="quota-funnel-yoy', funnel)
        self.assertNotIn('<small>占总配额</small>', funnel)

    def test_funnel_is_one_continuous_isosceles_trapezoid(self):
        self.assertIn("--funnel-left-top", self.views)
        self.assertIn("--funnel-right-top", self.views)
        self.assertIn("--funnel-left-bottom", self.views)
        self.assertIn("--funnel-right-bottom", self.views)
        self.assertIn("var(--funnel-left-top)", self.styles)
        self.assertIn("var(--funnel-right-bottom)", self.styles)
        self.assertIn("grid-template-columns", self.styles)
        self.assertIn(".quota-funnel-yoy", self.styles)
        self.assertIn(".quota-funnel-value", self.styles)

    def test_v154_default_entry_contract_is_preserved(self):
        core = (ROOT / "src/core.js").read_text(encoding="utf-8")
        self.assertIn("function directEntryRoute", core)
        self.assertIn("period: '602'", core)
        self.assertIn("day: 'all'", core)
        self.assertIn("module: 'overview'", core)
        self.assertIn("view: 'home'", core)

    def test_build_targets_v155_artifact(self):
        builder = (ROOT / "scripts/build_v1_5_dashboard.py").read_text(encoding="utf-8")
        self.assertIn('OUTPUT_PATH = ROOT / "dist/dashboard.html"', builder)
        self.assertIn("V1.5.5 选修作业与同比梯形漏斗", builder)


if __name__ == "__main__":
    unittest.main()
