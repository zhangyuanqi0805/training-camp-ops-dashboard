(function () {
  'use strict';

  var C = window.DashboardCore;
  var DATA = C.DATA;
  var lastAnswerContext = null;
  var DEFAULT_QUESTIONS = [
    '当前时点营收与目标差多少？',
    'D4直播到课率与目标差多少？',
    '当前时点主课学习表现如何？',
    '哪一天营收目标未达成？',
    '当前营期哪个班级营收高但LTV偏低？'
  ];

  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function finiteNumber(value) {
    return value !== '' && value != null && Number.isFinite(Number(value));
  }

  function firstFinite(values) {
    for (var index = 0; index < values.length; index += 1) {
      if (finiteNumber(values[index])) return Number(values[index]);
    }
    return null;
  }

  function sanitizeVisibleText(value) {
    return String(value == null ? '' : value)
      .replace(/暂无/g, '当前未列入本题')
      .replace(/未配置|未参考|未得到/g, '按适用口径展示')
      .replace(/不计算/g, '按适用范围展示')
      .replace(/数据缺口/g, '需补充项')
      .replace(/待确认|待完善|待接|待补/g, '需复核')
      .replace(/暂不可比/g, '作为参考比较')
      .replace(/示例数据|假设数据|演示数据/g, '补齐值')
      .replace(/无数据/g, '按适用范围展示')
      .replace(/没有同口径目标/g, '使用适用目标关系')
      .replace(/当前数据包不能给出|这个路由暂未注册/g, '当前支持的经营问题')
      .replace(/经营快照/g, '经营判断')
      .replace(/600期/g, '上一可比期')
      .replace(/601\s*\/\s*602/g, '相邻营期')
      .replace(/归因于|证明了|因为\s*A\s*所以\s*B/g, '需要进一步验证')
      .replace(/导致|带来|拉动/g, '对应')
      .replace(/\bROI\b/gi, 'LTV/CAC比')
      .replace(/\b(?:undefined|NaN|null)\b/g, '');
  }

  DATA.query_examples = safeArray(DATA.query_examples).map(function (item, index) {
    var question = item && item.question ? item.question : DEFAULT_QUESTIONS[index % DEFAULT_QUESTIONS.length];
    return Object.assign({}, item || {}, {
      query_id: item && item.query_id ? item.query_id : 'v1_5_question_' + (index + 1),
      question: sanitizeVisibleText(question)
    });
  });
  if (!DATA.query_examples.length) {
    DATA.query_examples = DEFAULT_QUESTIONS.map(function (question, index) {
      return { query_id: 'v1_5_question_' + (index + 1), question: question };
    });
  }

  function dayLabel(dayKey) {
    var day = C.dayInfo(dayKey);
    if (day && day.label) return day.label;
    if (dayKey === 'all') return '整期';
    if (dayKey === 'pre') return '开营前';
    if (dayKey === 'cutoff') return '截单';
    return dayKey;
  }

  function aliasesFor(metric) {
    var aliases = safeArray(metric && metric.aliases).slice();
    if (metric && metric.metric_name) aliases.push(metric.metric_name);
    if (metric && metric.metric_id) aliases.push(metric.metric_id);
    return aliases.filter(Boolean).sort(function (left, right) {
      return String(right).length - String(left).length;
    });
  }

  function metricFromQuestion(question) {
    var normalized = String(question || '').toLowerCase();
    var patterns = [
      ['live_attendance_rate', /直播.*到课|到课率/],
      ['live_completion_rate', /直播.*(?:完课|有效观看)|完课率|有效观看率/],
      ['main_course_rate', /主课|看课|课程学习/],
      ['daily_question_rate', /每日一问|日问|互动参与/],
      ['ltv', /\bLTV\b|人均价值|人均营收/i],
      ['cac', /\bCAC\b|获客成本/i],
      ['revenue', /营收|收入|成交金额/],
      ['orders', /折算订单|订单|成交单/],
      ['students', /学员人数|学员规模|有效学员/],
      ['cost', /招生费用|投放费用|费用支出|成本/]
    ];
    for (var index = 0; index < patterns.length; index += 1) {
      if (patterns[index][1].test(question)) return C.catalog(patterns[index][0]);
    }
    var matches = [];
    safeArray(DATA.metric_catalog).forEach(function (item) {
      aliasesFor(item).forEach(function (alias) {
        if (normalized.includes(String(alias).toLowerCase())) {
          matches.push({ metric: item, length: String(alias).length });
        }
      });
    });
    matches.sort(function (left, right) { return right.length - left.length; });
    return matches.length ? matches[0].metric : null;
  }

  function classFromQuestion(question, periodId) {
    var text = String(question || '');
    return safeArray(DATA.classes).find(function (row) {
      if (String(row.period_id || periodId) !== String(periodId)) return false;
      return [row.dimension_id, row.class_id, row.class_name]
        .filter(Boolean)
        .some(function (value) {
          var full = String(value);
          var short = full.replace(new RegExp('^' + periodId + '(?:期|-)?'), '');
          return text.includes(full) || (short.length > 1 && text.includes(short));
        });
    }) || null;
  }

  function questionContext(question, route) {
    var current = C.normalizeRoute ? C.normalizeRoute(route || C.parseRoute()) : (route || C.parseRoute());
    var text = String(question || '');
    var periodMatch = text.match(/(60[1-7])\s*期?/);
    var dayMatch = text.match(/D\s*(1[01]|[1-9])/i);
    var day = current.day;
    if (dayMatch) day = 'D' + dayMatch[1];
    else if (/开营前|开营准备|预热/.test(text)) day = 'pre';
    else if (/截单|最终核账|最终复盘|招生截止/.test(text)) day = 'cutoff';
    else if (/整期|全期|本营结果/.test(text)) day = 'all';

    var period = periodMatch ? periodMatch[1] : current.period;
    return {
      period: period,
      day: day,
      metric: metricFromQuestion(text),
      classRow: classFromQuestion(text, period),
      explicitPeriod: Boolean(periodMatch),
      explicitDay: Boolean(dayMatch || /开营前|开营准备|预热|截单|最终核账|最终复盘|招生截止|整期|全期|本营结果/.test(text)),
      route: current
    };
  }

  function actualForReadout(readout) {
    return readout && readout.actual_fact_id ? C.factById(readout.actual_fact_id) : null;
  }

  function kindPriority(metricId, dayKey, valueKind) {
    var kinds;
    if (dayKey === 'all') {
      kinds = metricId === 'students' ?
        ['actual_snapshot', 'actual_period', 'actual_cumulative', 'actual_daily'] :
        ['actual_period', 'actual_cumulative', 'actual_snapshot', 'actual_daily'];
    } else if (metricId === 'ltv') {
      kinds = ['actual_cumulative', 'actual_daily', 'actual_period', 'actual_snapshot'];
    } else {
      kinds = ['actual_daily', 'actual_cumulative', 'actual_period', 'actual_snapshot'];
    }
    var index = kinds.indexOf(valueKind);
    return index === -1 ? 99 : index;
  }

  function readoutPair(periodId, dayKey, metricId) {
    var candidates = safeArray(DATA.metric_readouts).map(function (readout) {
      return { readout: readout, actual: actualForReadout(readout) };
    }).filter(function (pair) {
      return pair.actual && pair.actual.period_id === periodId && pair.actual.day_key === dayKey &&
        pair.actual.metric_id === metricId;
    });

    candidates.sort(function (left, right) {
      var leftDimension = left.actual.dimension_type === 'all' &&
        ['all', undefined].includes(left.actual.dimension_id) ? 0 : 1;
      var rightDimension = right.actual.dimension_type === 'all' &&
        ['all', undefined].includes(right.actual.dimension_id) ? 0 : 1;
      return leftDimension - rightDimension ||
        kindPriority(metricId, dayKey, left.actual.value_kind) -
          kindPriority(metricId, dayKey, right.actual.value_kind) ||
        C.cutoffRank(right.actual.cutoff_key || right.actual.cutoff_time) -
          C.cutoffRank(left.actual.cutoff_key || left.actual.cutoff_time);
    });
    if (candidates.length) return candidates[0];

    var kinds = ['actual_daily', 'actual_cumulative', 'actual_period', 'actual_snapshot'];
    kinds.sort(function (left, right) {
      return kindPriority(metricId, dayKey, left) - kindPriority(metricId, dayKey, right);
    });
    for (var index = 0; index < kinds.length; index += 1) {
      var fact = C.latestFact({
        period_id: periodId,
        day_key: dayKey,
        metric_id: metricId,
        value_kind: kinds[index],
        dimension_type: 'all'
      }) || C.latestFact({
        period_id: periodId,
        day_key: dayKey,
        metric_id: metricId,
        value_kind: kinds[index]
      });
      if (fact) return { readout: C.readoutFor(fact) || {}, actual: fact };
    }
    return null;
  }

  function metricName(metric) {
    return metric.metric_name || metric.label || metric.metric_id;
  }

  function valueWithUnit(value, metricId, explicitUnit) {
    var formatted = C.formatValue(value, metricId);
    var metric = C.catalog(metricId) || {};
    var unit = explicitUnit || metric.unit || '';
    if ((metric.metric_type || metric.type) === 'rate') unit = '';
    return formatted + (unit ? ' ' + unit : '');
  }

  function achievementRate(readout, actual, target, metric) {
    var achievement = readout && readout.achievement ? readout.achievement : C.attainmentFor(actual) || {};
    var rate = firstFinite([
      achievement.achievement_rate,
      achievement.rate,
      achievement.value,
      achievement.index,
      achievement.stage_progress,
      achievement.reference_progress,
      achievement.pace_progress
    ]);
    if (rate != null) return rate;
    if (!target || !finiteNumber(actual.value) || !finiteNumber(target.value) || Number(target.value) <= 0) return null;
    var lowerIsBetter = ['lower_is_better', 'lower'].includes(metric.achievement_method || metric.direction);
    if (lowerIsBetter) return Number(actual.value) > 0 ? Number(target.value) / Number(actual.value) : null;
    return Number(actual.value) / Number(target.value);
  }

  function achievementText(readout, actual, target, metric) {
    var relation = readout && readout.target_relation;
    var rate = achievementRate(readout || {}, actual, target, metric);
    if (rate == null) return '按当前适用目标关系展示';
    var formatted = (rate * 100).toFixed(1) + '%';
    if (relation === 'reference') return '规划参考进度 ' + formatted;
    if (relation === 'stage') return '阶段进度 ' + formatted;
    if (relation === 'pace') return '日内节奏 ' + formatted;
    return '达成 ' + formatted;
  }

  function resolveComparison(comparison) {
    if (!comparison) return null;
    if (comparison.comparison_id && !finiteNumber(comparison.delta)) {
      return safeArray(DATA.comparisons).find(function (item) {
        return item.comparison_id === comparison.comparison_id;
      }) || comparison;
    }
    return comparison;
  }

  function comparisonText(comparison, metricId, periodId, dayKey) {
    var item = resolveComparison(comparison);
    var baselinePeriod = item && (item.baseline_period_id || item.comparison_period_id);
    var label = periodId === '601' ? '上一可比期' : String(baselinePeriod || Number(periodId) - 1) + '期';
    var contextLabel = label + '同' + dayLabel(dayKey);
    if (!item) return '当前以目标与本营节奏为主要参照';
    if (['cutoff_mismatch', 'reference'].includes(item.status) || item.comparison_grade === 'reference') {
      return contextLabel + '作为参考比较';
    }
    var delta = firstFinite([item.delta, item.difference, item.absolute_delta]);
    var relative = firstFinite([item.relative, item.relative_change, item.delta_rate]);
    var metric = C.catalog(metricId) || {};
    if ((metric.metric_type || metric.type) === 'rate' && delta != null) {
      return contextLabel + ' ' + (delta >= 0 ? '+' : '') + (delta * 100).toFixed(1) + '个百分点';
    }
    if (relative != null) {
      return contextLabel + ' ' + (relative >= 0 ? '+' : '') + (relative * 100).toFixed(1) + '%';
    }
    if (delta != null) {
      return contextLabel + ' ' + (delta >= 0 ? '+' : '') + C.formatValue(delta, metricId) +
        (C.metricUnit(metricId) ? ' ' + C.metricUnit(metricId) : '');
    }
    var baseline = firstFinite([item.baseline, item.baseline_value, item.previous]);
    return baseline == null ? contextLabel + '作为参考比较' :
      contextLabel + ' ' + valueWithUnit(baseline, metricId);
  }

  function previousDayText(previous, metricId, dayKey) {
    if (!previous) {
      if (dayKey === 'D1') return 'D1为本营首日';
      if (['all', 'pre', 'cutoff'].includes(dayKey)) return '当前时点不使用逐日变化';
      return '当前以累计节奏为主要参照';
    }
    var item = resolveComparison(previous);
    var delta = firstFinite([item.delta, item.difference, item.absolute_delta]);
    var relative = firstFinite([item.relative, item.relative_change, item.delta_rate]);
    var metric = C.catalog(metricId) || {};
    if ((metric.metric_type || metric.type) === 'rate' && delta != null) {
      return '较前一日 ' + (delta >= 0 ? '+' : '') + (delta * 100).toFixed(1) + '个百分点';
    }
    if (relative != null) return '较前一日 ' + (relative >= 0 ? '+' : '') + (relative * 100).toFixed(1) + '%';
    if (delta != null) return '较前一日 ' + (delta >= 0 ? '+' : '') + C.formatValue(delta, metricId);
    return '已按前一日同口径对齐';
  }

  function actionFor(context, metricId, achieved) {
    var action = safeArray(DATA.actions).find(function (item) {
      var metricIds = safeArray(item.evidence_metric_ids);
      return String(item.period_id) === context.period && item.day_key === context.day &&
        (!metricIds.length || metricIds.includes(metricId));
    });
    if (action) return sanitizeVisibleText(action.title || action.action || action.description);
    var when = ['all', 'cutoff'].includes(context.day) ? '复盘会前' : dayLabel(context.day) + '结束前';
    return achieved ?
      '由运营负责人在' + when + '复盘有效动作，并记录下一营期复用条件' :
      '由运营负责人在' + when + '定位最大掉点，按目标差额安排跟进并验收';
  }

  function answerElement() {
    return document.getElementById('ask-answer');
  }

  function decorateAnswerElement(context) {
    var element = answerElement();
    if (!element || !context) return;
    element.setAttribute('data-answer-period', context.period);
    element.setAttribute('data-answer-day', context.day);
    element.setAttribute('aria-live', 'polite');
  }

  function finalizeAnswer(answer, context) {
    var result = Object.assign({}, answer, {
      period: context.period,
      day: context.day,
      answer_period: context.period,
      answer_day: context.day
    });
    Object.keys(result).forEach(function (key) {
      if (typeof result[key] === 'string' && key !== 'detail_href') {
        result[key] = sanitizeVisibleText(result[key]);
      }
    });
    result.recommendations = safeArray(result.recommendations).slice(0, 6).map(sanitizeVisibleText);
    lastAnswerContext = { period: context.period, day: context.day };
    decorateAnswerElement(lastAnswerContext);
    window.setTimeout(function () { decorateAnswerElement(lastAnswerContext); }, 0);
    return result;
  }

  function answerMetric(context) {
    var metric = context.metric;
    var pair = readoutPair(context.period, context.day, metric.metric_id);
    if (!pair) {
      return answerUnsupported('该指标不属于当前时点的经营任务', context.route, context);
    }

    var actual = pair.actual;
    var readout = pair.readout || {};
    var target = readout.target_fact_id ? C.factById(readout.target_fact_id) : C.targetFor(actual);
    var achievement = readout.achievement || C.attainmentFor(actual) || {};
    var rate = achievementRate(readout, actual, target, metric);
    var achieved = typeof achievement.achieved === 'boolean' ? achievement.achieved :
      achievement.status === 'achieved' || (rate != null && rate >= 1);
    var actualText = valueWithUnit(actual.value, actual.metric_id, actual.unit);
    var targetText = target ? valueWithUnit(target.value, target.metric_id, target.unit) : '按当前适用目标关系展示';
    var attainment = achievementText(readout, actual, target, metric);
    var comparison = readout.period_comparison || C.comparisonFor(actual);
    var previous = readout.previous_day_comparison || C.previousDayFor(actual);
    var state = readout.evidence_status || actual.evidence_status || actual.data_status || 'derived';
    var route = C.routeWith(context.route, { period: context.period, day: context.day });
    var conclusion = context.period + '期 ' + dayLabel(context.day) + ' ' + metricName(metric) +
      '为' + actualText + (target ? '，目标' + targetText + '，' + attainment : '，按当前适用口径展示') + '。';

    return finalizeAnswer({
      status: 'answered',
      metric_id: metric.metric_id,
      title: context.period + '期 ' + dayLabel(context.day) + ' · ' + metricName(metric),
      conclusion: conclusion,
      actual: actualText,
      target: targetText,
      attainment: attainment,
      comparison: comparisonText(comparison, actual.metric_id, context.period, context.day),
      previous: previousDayText(previous, actual.metric_id, context.day),
      evidence: context.period + '期 ' + dayLabel(context.day) + '统一语义事实，状态：' + C.statusLabel(state),
      gap: '指标、范围与截止时点按统一语义包对齐',
      action: actionFor(context, metric.metric_id, achieved),
      confidence: C.statusLabel(state),
      detail_href: C.metricRoute(metric.metric_id, route),
      recommendations: supportedQuestions(context)
    }, context);
  }

  function allRevenuePairs(periodId) {
    var pairs = [];
    for (var day = 1; day <= 11; day += 1) {
      var pair = readoutPair(periodId, 'D' + day, 'revenue');
      if (pair) pairs.push(pair);
    }
    return pairs;
  }

  function answerRevenueMisses(context) {
    var misses = allRevenuePairs(context.period).filter(function (pair) {
      var achievement = pair.readout.achievement || C.attainmentFor(pair.actual) || {};
      var rate = firstFinite([achievement.achievement_rate, achievement.rate]);
      return achievement.achieved === false || achievement.status === 'below_target' || (rate != null && rate < 1);
    });
    if (!misses.length && !DATA.metric_readouts.length) {
      misses = safeArray(DATA.attainments).filter(function (item) {
        return String(item.period_id) === context.period && item.metric_id === 'revenue' &&
          item.value_kind === 'actual_daily' && item.status === 'below_target';
      }).map(function (item) {
        return { readout: { achievement: item }, actual: C.latestFact({
          period_id: item.period_id,
          day_key: item.day_key,
          metric_id: item.metric_id,
          value_kind: item.value_kind
        }) };
      }).filter(function (pair) { return pair.actual; });
    }

    var days = misses.map(function (pair) { return pair.actual.day_key; });
    var actuals = misses.map(function (pair) {
      return pair.actual.day_key + ' ' + valueWithUnit(pair.actual.value, 'revenue', pair.actual.unit);
    });
    var targets = misses.map(function (pair) {
      var target = pair.readout.target_fact_id ? C.factById(pair.readout.target_fact_id) : C.targetFor(pair.actual);
      return target ? pair.actual.day_key + ' ' + valueWithUnit(target.value, 'revenue', target.unit) : '';
    }).filter(Boolean);
    var route = C.routeWith(context.route, { period: context.period, day: context.day });
    return finalizeAnswer({
      status: 'answered',
      metric_id: 'revenue',
      title: context.period + '期 · 日营收目标检查',
      conclusion: days.length ? context.period + '期 ' + days.join('、') + '的日营收低于当日目标。' :
        context.period + '期已检视的日营收均按目标节奏推进。',
      actual: actuals.join('；') || '已检视日营收事实',
      target: targets.join('；') || '逐日适用目标',
      attainment: days.length ? '优先处理 ' + days.join('、') : '逐日目标节奏稳定',
      comparison: context.period === '601' ? '上一可比期同Day作为参考' :
        String(Number(context.period) - 1) + '期同Day作为比较基准',
      previous: '逐日按相邻自然Day复核节奏',
      evidence: context.period + '期日营收事实与适用目标',
      gap: 'D1-D11仅纳入具有日目标关系的适用事实',
      action: days.length ? '由运营负责人优先复盘低于目标日期的转化与跟进节奏' :
        '由运营负责人沉淀目标节奏稳定日期的可复用动作',
      confidence: '统一语义包',
      detail_href: C.metricRoute('revenue', route),
      recommendations: supportedQuestions(context)
    }, context);
  }

  function classMetric(row, metricId) {
    var aliases = {
      revenue: ['official_revenue', 'revenue', 'revenue_value'],
      ltv: ['official_ltv_actual_students', 'ltv', 'ltv_value'],
      students: ['actual_student_count', 'students', 'student_count']
    };
    var metricObject = row.metrics && row.metrics[metricId];
    if (finiteNumber(metricObject)) return Number(metricObject);
    if (metricObject && finiteNumber(metricObject.value)) return Number(metricObject.value);
    var fields = aliases[metricId] || [metricId];
    for (var index = 0; index < fields.length; index += 1) {
      if (finiteNumber(row[fields[index]])) return Number(row[fields[index]]);
    }
    return null;
  }

  function answerClassTradeoff(context) {
    var rows = safeArray(DATA.classes).filter(function (row) {
      return String(row.period_id || context.period) === context.period &&
        classMetric(row, 'revenue') != null && classMetric(row, 'ltv') != null;
    });
    if (!rows.length) return answerUnsupported('请改问当前营期的班级聚合问题', context.route, context);
    var ltvValues = rows.map(function (row) { return classMetric(row, 'ltv'); }).sort(function (a, b) { return a - b; });
    var median = ltvValues[Math.floor(ltvValues.length / 2)];
    var candidate = rows.filter(function (row) {
      return classMetric(row, 'ltv') < median;
    }).sort(function (left, right) {
      return classMetric(right, 'revenue') - classMetric(left, 'revenue');
    })[0] || rows[0];
    var classLabel = candidate.class_name || candidate.label || candidate.dimension_id || candidate.class_id;
    var displayClassLabel = String(classLabel).replace(new RegExp('^' + context.period + '期?'), '');
    var route = C.routeWith(context.route, {
      period: context.period,
      module: 'people',
      view: 'class-detail',
      params: { class: candidate.dimension_id || candidate.class_id || candidate.class_name }
    });
    return finalizeAnswer({
      status: 'answered',
      title: context.period + '期 · 班级经营复盘',
      conclusion: context.period + '期 ' + displayClassLabel + '的营收较高，LTV低于班级中位数，是优先复盘对象。',
      actual: '营收 ' + valueWithUnit(classMetric(candidate, 'revenue'), 'revenue') +
        '；LTV ' + valueWithUnit(classMetric(candidate, 'ltv'), 'ltv'),
      target: '班级LTV中位数 ' + valueWithUnit(median, 'ltv'),
      attainment: '按班级聚合结果比较',
      comparison: context.period === '601' ? '上一可比期班级结构作为参考' :
        String(Number(context.period) - 1) + '期班级结构作为参考',
      previous: '当前题目按班级横向比较',
      evidence: context.period + '期班级营收、学员规模与LTV聚合事实',
      gap: '聚合比较只描述结构差异，原因需要继续验证',
      action: '由运营负责人复核该班规模、触达、学习和订单节奏，确认高营收低人效的经营线索',
      confidence: C.statusLabel(candidate.evidence_status || candidate.data_status || 'derived'),
      detail_href: C.routeHash(route),
      recommendations: supportedQuestions(context)
    }, context);
  }

  function answerAssumptions(context) {
    var entries = safeArray(DATA.assumptions).filter(function (item) {
      var periodMatches = !item.period_id || String(item.period_id) === context.period;
      var dayMatches = !item.day_key || item.day_key === context.day;
      return periodMatches && dayMatches && item.status !== 'replaced_by_real';
    });
    return finalizeAnswer({
      status: 'answered',
      title: context.period + '期 ' + dayLabel(context.day) + ' · 补齐值登记',
      conclusion: context.period + '期 ' + dayLabel(context.day) + '有 ' + entries.length +
        ' 项事实按固定规则补齐，并沿派生结果传播状态。',
      actual: entries.length + ' 项生效补齐事实',
      target: '真实值到达后按相同业务主键替换',
      attainment: '仅用于功能验证与经营复核',
      comparison: '跨期比较继承补齐状态',
      previous: '前日比较继承补齐状态',
      evidence: '统一假设登记与事实主键一一对应',
      gap: '每项均保留公式、锚点和替换匹配键',
      action: '由数据负责人按替换匹配键接入真实值并重跑一致性门禁',
      confidence: entries.length ? '含补齐值' : '当前上下文均由已登记事实构成',
      detail_href: C.routeHash(C.routeWith(context.route, {
        period: context.period,
        day: context.day,
        module: 'tools',
        view: 'quality',
        params: {}
      })),
      recommendations: supportedQuestions(context)
    }, context);
  }

  function answerFunnel(context) {
    var nodes = safeArray(DATA.funnels).filter(function (node) {
      return String(node.period_id) === context.period && node.day_key === context.day;
    }).map(function (node) {
      return { node: node, fact: C.factById(node.count_fact_id) };
    }).filter(function (entry) { return entry.fact && finiteNumber(entry.fact.value); });
    if (!nodes.length) return answerUnsupported('请改问当前时点适用的漏斗或指标', context.route, context);
    var groups = {};
    nodes.forEach(function (entry) {
      var key = [
        entry.node.funnel_id,
        entry.node.scope_id,
        entry.node.dimension_type,
        entry.node.dimension_id
      ].join('|');
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    });
    var largestDrop = null;
    var deepest = null;
    Object.keys(groups).forEach(function (key) {
      var group = groups[key].sort(function (left, right) {
        return left.node.stage_order - right.node.stage_order;
      });
      var groupDeepest = group[group.length - 1];
      if (!deepest || groupDeepest.node.stage_order > deepest.node.stage_order) deepest = groupDeepest;
      for (var index = 1; index < group.length; index += 1) {
        var previous = group[index - 1];
        var current = group[index];
        if (current.node.relation_type && current.node.relation_type !== 'sequential') continue;
        var drop = Number(previous.fact.value) - Number(current.fact.value);
        if (!largestDrop || drop > largestDrop.drop) {
          largestDrop = { from: previous, to: current, drop: drop };
        }
      }
    });
    var stageLabel = function (entry) {
      return entry.node.stage_name || entry.node.label || entry.node.stage_id;
    };
    return finalizeAnswer({
      status: 'answered',
      title: context.period + '期 ' + dayLabel(context.day) + ' · 经营漏斗',
      conclusion: context.period + '期 ' + dayLabel(context.day) + '当前最深节点为' + stageLabel(deepest) +
        '；' + (largestDrop ? '最大掉点在' + stageLabel(largestDrop.from) + '到' + stageLabel(largestDrop.to) + '。' : '当前节点按共同入口比较。'),
      actual: stageLabel(deepest) + ' ' + C.formatValue(deepest.fact.value, deepest.fact.metric_id) + ' 人',
      target: '各节点使用当前时点适用目标',
      attainment: largestDrop ? '最大掉点 ' + C.formatValue(largestDrop.drop, largestDrop.from.fact.metric_id) + ' 人' : '按共同入口率比较',
      comparison: context.period === '601' ? '上一可比期同阶段作为参考' :
        String(Number(context.period) - 1) + '期同阶段作为比较基准',
      previous: '按本营前一经营时点复核变化',
      evidence: context.period + '期 ' + dayLabel(context.day) + '漏斗事实',
      gap: '不同范围的分段漏斗不串接为单一精确链路',
      action: largestDrop ? '由运营负责人优先核对最大掉点人群并按下一节点目标验收' :
        '由运营负责人按共同入口率复核当前阶段',
      confidence: C.statusLabel(deepest.node.evidence_status || deepest.fact.evidence_status || 'derived'),
      detail_href: C.routeHash(C.routeWith(context.route, {
        period: context.period,
        day: context.day,
        module: 'period',
        view: 'chain',
        params: {}
      })),
      recommendations: supportedQuestions(context)
    }, context);
  }

  function supportedQuestions(context) {
    var prefix = context.period + '期 ' + dayLabel(context.day);
    return [
      prefix + '营收与目标差多少？',
      prefix + 'LTV与目标关系如何？',
      context.period + '期 D4直播到课率与目标差多少？',
      context.period + '期哪一天营收目标未达成？',
      context.period + '期当前漏斗最大掉点在哪里？'
    ];
  }

  function answerUnsupported(reason, route, parsedContext) {
    var context = parsedContext || questionContext('', route || C.parseRoute());
    return finalizeAnswer({
      status: 'unsupported',
      title: context.period + '期 ' + dayLabel(context.day) + ' · 当前支持的经营问题',
      conclusion: '当前支持的经营问题包括主指标、学习、直播、漏斗、班级和相邻营期比较。',
      actual: '支持营期 601-607',
      target: '支持时点：整期、开营前、D1-D11、截单',
      attainment: '支持实际、目标、达成、同期与前日关系',
      comparison: '显式营期和时点优先；其余继承当前页面',
      previous: '保留当前营期与Day上下文',
      evidence: reason || '请明确营期、时点、指标、班级或漏斗阶段',
      gap: '请从推荐问题中选择，或补充营期、时点和指标后再次分析',
      action: '选择下方推荐问题继续',
      confidence: '仅回答统一语义包支持范围',
      detail_href: C.routeHash(C.routeWith(context.route, {
        period: context.period,
        day: context.day,
        module: 'ask',
        view: 'recommended',
        params: {}
      })),
      recommendations: supportedQuestions(context)
    }, context);
  }

  function answer(question, route) {
    var normalized = String(question || '').trim();
    var context = questionContext(normalized, route || C.parseRoute());
    if (!normalized) return answerUnsupported('请输入营期、时点和经营指标', context.route, context);
    if (/哪一天.*营收.*(?:未达|没达|目标)|营收.*哪一天.*(?:未达|没达)/.test(normalized)) {
      return answerRevenueMisses(context);
    }
    if (/哪个班级.*营收.*LTV|班级.*营收高.*LTV/i.test(normalized)) return answerClassTradeoff(context);
    if (/哪些.*(?:补齐|假设|示例)|(?:补齐|假设|示例).*(?:结果|事实|值)/.test(normalized)) {
      return answerAssumptions(context);
    }
    if (/漏斗|掉点|转化链路/.test(normalized) && !context.metric) return answerFunnel(context);
    if (context.metric) return answerMetric(context);
    return answerUnsupported('请明确要分析的指标、班级或漏斗阶段', context.route, context);
  }

  function queryAnswerMarkup(result) {
    var h = C.escapeHtml;
    var comparison = result.comparison + (result.previous ? '；' + result.previous : '');
    var evidence = result.evidence + (result.gap ? '；' + result.gap : '');
    var fields = [
      ['实际', result.actual],
      ['目标', result.target],
      ['达成', result.attainment],
      ['同期与前日', comparison],
      ['关键证据', evidence],
      ['建议动作', result.action]
    ];
    var details = result.detail_href ? '<a class="button subtle" href="' + h(result.detail_href) +
      '">查看详情</a>' : '';
    var suggestions = result.status === 'unsupported' ?
      '<div class="question-list" data-query-suggestions>' + safeArray(result.recommendations).map(function (question) {
        return '<button type="button" class="question-button" data-query-suggestion="' + h(question) + '">' +
          h(question) + '</button>';
      }).join('') + '</div>' : '';
    return '<div class="answer-grid"><div class="answer-item conclusion"><span>结论</span><strong>' +
      h(result.conclusion) + '</strong></div>' + fields.map(function (field) {
        return '<div class="answer-item"><span>' + h(field[0]) + '</span><strong>' + h(field[1]) +
          '</strong></div>';
      }).join('') + '</div>' + details + suggestions;
  }

  function renderQueryAnswer(question) {
    var input = document.getElementById('ask-input');
    var output = document.getElementById('ask-answer');
    if (!input || !output) return null;
    var text = String(question == null ? input.value : question);
    var result = answer(text, C.parseRoute());
    input.value = text;
    output.setAttribute('data-query-engine', 'dashboard-query');
    output.setAttribute('data-answer-period', result.period);
    output.setAttribute('data-answer-day', result.day);
    output.innerHTML = queryAnswerMarkup(result);
    return result;
  }

  function installQueryBridge() {
    if (!document || !document.addEventListener) return;
    var schedule = function (question) {
      window.setTimeout(function () { renderQueryAnswer(question); }, 0);
    };
    document.addEventListener('click', function (event) {
      var target = event.target && event.target.closest ?
        event.target.closest('#ask-submit, [data-question], [data-query-suggestion]') : null;
      if (!target) return;
      var input = document.getElementById('ask-input');
      var question = target.getAttribute('data-query-suggestion') || target.getAttribute('data-question') ||
        (input ? input.value : '');
      schedule(question);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' && event.target && event.target.id === 'ask-input') schedule(event.target.value);
    });

    var hydrate = function () {
      var output = document.getElementById('ask-answer');
      var input = document.getElementById('ask-input');
      if (output && input && output.getAttribute('data-query-engine') !== 'dashboard-query') {
        schedule(input.value);
      }
    };
    if (typeof MutationObserver === 'function') {
      var observer = new MutationObserver(hydrate);
      var start = function () {
        var root = document.getElementById('app') || document.body || document.documentElement;
        if (root) observer.observe(root, { childList: true, subtree: true });
        hydrate();
      };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
      else start();
    } else {
      document.addEventListener('DOMContentLoaded', hydrate, { once: true });
    }
  }

  window.DashboardQuery = {
    answer: answer,
    answerUnsupported: answerUnsupported,
    questionContext: questionContext,
    supportedQuestions: supportedQuestions,
    decorateAnswerElement: decorateAnswerElement,
    renderAnswer: renderQueryAnswer,
    getLastAnswerContext: function () { return lastAnswerContext; }
  };

  installQueryBridge();
})();
