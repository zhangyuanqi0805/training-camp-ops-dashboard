# 602期第一版看板数据模型

## 这是什么

这是第一版正式看板的页面数据模型层。它从 V1 六表事实层和 V2 补充对照层生成，不覆盖原始快照。

前端优先读取 `dashboard_data_v1.json`；如果需要调试或表格预览，再读取对应 `model_*.csv`。

## 模型文件

- `model_overview.csv`：首屏经营总览 KPI 和内部风险卡，7 行。
- `model_pre_camp_activation.csv`：开营前加好友、进群、开口漏斗和班级触达排行，17 行。
- `model_learning_trend.csv`：D1-D10 学习趋势、渠道/人群拆分，139 行。
- `model_live_to_conversion.csv`：三场直播到课/完课与成交节奏，27 行。
- `model_class_performance.csv`：14 个正式班级营收、LTV 和触达表现，14 行。
- `model_data_quality.csv`：看板口径风险、展示边界和质量问题，65 行。

## 使用边界

- 第一版看板只承诺回答 P0 问题。
- 全口径进阶金额和官方14班进阶金额必须分开展示。
- CAC、ROI、广告费用、渠道成本暂为内部线索，不能对外当最终口径。
- 直播与成交、学习与成交当前只能展示时间关系或相关线索，不能写成因果。
- 所有模型都带 `source_files`、`confidence`、`visibility`，页面应按这些字段决定展示位置。
