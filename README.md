# 训练营经营看板

这是 `10天点燃孩子内驱力实战营` 的训练营经营看板同事交付包，当前版本为 `V1.5.2`。

## 快速打开

1. 解压整个文件夹。
2. 双击 `index.html`。
3. 点击「打开经营看板」。

不需要安装 Node、Python、Codex 或数据库；`dist/dashboard.html` 是已经嵌入数据、样式和脚本的离线 HTML。

## 包里有什么

- `index.html`：给同事使用的入口页。
- `dist/dashboard.html`：正式离线看板。
- `data/runtime/`：当前看板实际使用的数据包、来源图谱和假设登记。
- `data/source_samples/`：602 结构化快照、补充 CSV、第一版模型、导入模板、字段和指标说明。
- `src/`：可维护源码，后续要改页面时用。
- `scripts/`：重建离线 HTML 的脚本。
- `qa/`：自动验收脚本。
- `docs/`：使用、口径、功能和更新流程说明。
- `screenshots/`：当前版本桌面和手机截图。
- `skill/`：可选 Codex Skill，用于后续让 Codex 更新或验收这套看板。

## 数据边界

当前页面同时包含真实样例、计算结果和假设/推算数据。不要把页面中所有数字都当作最终生产口径。正式对外使用前，请先看：

- `docs/数据口径说明.md`
- `data/runtime/source_map_v1_5.md`
- `data/runtime/assumption_registry_v1_5.json`

## 后续更新

如果只是查看，不需要运行任何脚本。

如果要替换新营期数据或重建 HTML：

```bash
python3 scripts/build_v1_5_dashboard.py
python3 -m unittest qa/test_v1_5_2_ui.py -v
node qa/validate_v1_5_2_quota_funnel.cjs
```

## 当前版本说明

- 7 个营期：601-607。
- 14 个经营时点：整期、开营前、D1-D11、截单。
- 一级模块：经营总览、营期经营、跨期对比、班级与学员、学习运营、财务效率、数据问答、内部工具。
- V1.5.2 重点：把首页漏斗改为「占总配额比例」，不是逐层转化率。
