# 602期结构化数据快照说明

## 这是什么

这是从 602 期 6 个 Excel 中抽取出来的第一版结构化数据快照，用于支撑第一期数据看板和小数的稳定查询。

原始 Excel 不在这里修改；本目录只放可查询、可复算、可接看板的中间表。

## 文件说明

| 文件 | 行数 | 用途 |
| --- | ---: | --- |
| `classes.csv` | 14 | 正式班级、教练、配额、实际明细人数 |
| `students.csv` | 1103 | 学员主表，包含正式/非正式班级标记和开营前触达字段 |
| `pre_camp_touch.csv` | 17 | 按班级汇总加好友、进群、开口 |
| `advanced_orders.csv` | 115 | 进阶订单明细，支持营收、订单数、LTV |
| `learning_daily.csv` | 110 | D1-D10 按渠道/学员类型整理的学习过程数据 |
| `live_sessions_raw.csv` | 2193 | 三场直播明细，支持到课、回放、完课分析 |
| `data_quality_issues.md` | - | 数据质量和口径风险清单 |
| `snapshot_manifest.json` | - | 本次快照生成信息和关键统计 |

## 隐私处理

- 不写入明文手机号、uid、unionid、订单号。
- 跨表匹配使用哈希键：`student_key`、`phone_hash`、`uid_hash`、`viewer_key`、`order_key`。
- 直播标签不展开原文，只保留 `tag_count`。

## 第一版默认口径

- 正式经营盘只看 `official_class = 1`。
- 正式班级数：14。
- 正式明细人数：1021。
- 配额合计：1022。
- 正式 14 班营收：333800。
- 全部支付完成金额：346300。
- LTV 可以按两个分母算：
  - 明细分母：333800 / 1021 = 326.93
  - 配额分母：333800 / 1022 = 326.61

## 重生成方式

如 6 个 Excel 更新，运行：

```bash
python3 ../99_脚本/build_602_structured_snapshot.py
```

生成后先看 `data_quality_issues.md`，再接看板。
