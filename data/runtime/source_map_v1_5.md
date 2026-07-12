# V1.5 指标来源与口径映射

> 本文件由 `scripts/build_v1_5_data.py` 从统一语义包确定性生成。业务页只消费 readout、班级、漏斗和简洁状态；路径、公式与替换键留在内部层。

## 构建摘要

- fixture 版本：`v1_5_fixture_2026_07_12_a`
- 事实：3203 条；readout：597 条；逐事实假设：2828 条。
- 可见营期：601-607；600 仅参与 601 的上期比较。
- 可见时点：整期、开营前、D1-D11、截单，共 14 个。
- 603-607 与 600 均由固定系数、固定权重和 SHA256 稳定扰动生成。

## 来源索引

| 来源ID | 来源 | 类型 | 被事实引用 | SHA256 | 路径 |
|---|---|---|---:|---|---|
| `fixture_model_v1_5` | V1.5确定性情景模型 | `deterministic_model` | 2828 | `0b4fe9fb9c83183b…` | `PROJECT_WORKSPACE/10天点燃孩子内驱力实战营/20_小数_数据分析/10_数据分析/看板/2026-07-11_训练营经营看板_V1_5功能成熟夜跑/scripts/build_v1_5_data.py` |
| `learning_daily` | 每日学习数据 | `structured_csv` | 392 | `a8d516aa4efa56ad…` | `PROJECT_WORKSPACE/10天点燃孩子内驱力实战营/20_小数_数据分析/30_数据源/602期_6027来源数据包_2026-07-08/30_602期结构化数据快照_2026-07-08/learning_daily.csv` |
| `supplement_actual_ltv_timeline` | 实际LTV时间线 | `structured_csv` | 29 | `50bc77b28c5df482…` | `PROJECT_WORKSPACE/10天点燃孩子内驱力实战营/20_小数_数据分析/30_数据源/602期_6027来源数据包_2026-07-08/31_602期结构化数据快照_2026-07-09_v2/supplement_actual_ltv_timeline.csv` |
| `supplement_conversion_cadence` | 成交节奏 | `structured_csv` | 414 | `28bb3af40ef3c4e9…` | `PROJECT_WORKSPACE/10天点燃孩子内驱力实战营/20_小数_数据分析/30_数据源/602期_6027来源数据包_2026-07-08/31_602期结构化数据快照_2026-07-09_v2/supplement_conversion_cadence.csv` |
| `supplement_live_benchmark` | 直播目标与同期数据 | `structured_csv` | 128 | `9aa9a81fdc206a97…` | `PROJECT_WORKSPACE/10天点燃孩子内驱力实战营/20_小数_数据分析/30_数据源/602期_6027来源数据包_2026-07-08/31_602期结构化数据快照_2026-07-09_v2/supplement_live_benchmark.csv` |
| `supplement_period_overview` | 营期整体数据 | `structured_csv` | 89 | `8e421e7428da2a5d…` | `PROJECT_WORKSPACE/10天点燃孩子内驱力实战营/20_小数_数据分析/30_数据源/602期_6027来源数据包_2026-07-08/31_602期结构化数据快照_2026-07-09_v2/supplement_period_overview.csv` |
| `targets_602_source` | 602期经营目标规划 | `transcribed_source` | 352 | `10660b0524440851…` | `PROJECT_WORKSPACE/10天点燃孩子内驱力实战营/20_小数_数据分析/10_数据分析/看板/2026-07-11_训练营经营看板_V1_4/data/targets_602_source.csv` |
| `v1_3_dashboard_data` | V1.3已核验聚合资产 | `validated_json` | 1746 | `52ab87e1a6fc00e2…` | `PROJECT_WORKSPACE/10天点燃孩子内驱力实战营/20_小数_数据分析/10_数据分析/看板/2026-07-10_602期B方案完整夜跑/data/dashboard_data_B_v1.json` |
| `v1_4_semantic_package` | V1.4统一语义包 | `validated_json` | 0 | `ec185ff5e32cda5b…` | `PROJECT_WORKSPACE/10天点燃孩子内驱力实战营/20_小数_数据分析/10_数据分析/看板/2026-07-11_训练营经营看板_V1_4/data/dashboard_data_v1_4.json` |
| `v1_5_day_semantics` | V1.5 Day经营语义复核 | `approved_contract` | 0 | `67f0b67e645fa238…` | `PROJECT_WORKSPACE/10天点燃孩子内驱力实战营/20_小数_数据分析/10_数据分析/看板/2026-07-11_训练营经营看板_V1_5功能成熟夜跑/docs/V1_5_Day经营语义复核.md` |
| `v1_5_semantic_design` | V1.5数据语义设计 | `approved_contract` | 0 | `f8afa88eb453e6c2…` | `PROJECT_WORKSPACE/10天点燃孩子内驱力实战营/20_小数_数据分析/10_数据分析/看板/2026-07-11_训练营经营看板_V1_5功能成熟夜跑/docs/V1_5_数据语义设计.md` |

## 601/602 复用边界

- 601/602 的整期规模、营收、费用、成交节奏、LTV 时间线、D1-D10 学习率和 D4-D6 直播率优先复用已核验来源。
- 602 官方14班逐班事实直接复用 V1.3 聚合资产；601 班级明细按同一14班权重确定性分配并逐事实登记。
- D1-D4 成交只有阶段合计，按 0.08 / 0.12 / 0.25 / 0.55 拆日，并保证金额与折算单合计严格回到来源阶段值。
- 601 CAC 使用真实费用与稳定补齐的同范围获客人数，状态为 mixed；602 CAC 延用内部成本口径。
- 602 D5 LTV 位于已知阶段点之间时使用固定线性插值，登记后可被同主键真实值覆盖。

## 范围保护

- `planning_1024`、`backend_effective`、`official_learning`、`official_14_classes`、`conversion_summary`、`live_benchmark`、`internal_cost_all` 与获客分母范围保持独立。
- 学员规划与后台快照只生成 reference 进度，不生成严格达成率。
- 完整人数漏斗使用 `funnel_demo_cohort` 同队列情景事实，不把不同来源分母硬串为真实端到端转化。
- D11 依据 Day 经营语义省略学习 readout；招生费用与 CAC 只在整期和截单时点适用。

## 替换规则

所有假设以完整业务主键匹配真实值，策略固定为 `exact_key_real_wins`。逐事实公式、参数、锚点、稳定种子和受影响 readout 见 `assumption_registry_v1_5.json`。
