(function () {
  'use strict';

  var C = window.DashboardCore;
  var DATA = C.DATA;

  var PRIMARY_MODULES = [
    { id: 'overview', label: '经营总览', icon: '总' },
    { id: 'period', label: '营期经营', icon: '营' },
    { id: 'comparison', label: '跨期对比', icon: '跨' },
    { id: 'people', label: '班级与学员', icon: '班' },
    { id: 'learning', label: '学习运营', icon: '学' },
    { id: 'finance', label: '财务效率', icon: '财' },
    { id: 'ask', label: '数据问答', icon: '问' },
    { id: 'tools', label: '内部工具', icon: '内' }
  ];

  var CONTEXT_VIEWS = {
    overview: [
      { id: 'home', label: '经营总览', icon: '总' },
      { id: 'periods', label: '营期列表', icon: '期' },
      { id: 'alerts', label: '关键异常', icon: '异' }
    ],
    period: [
      { id: 'overview', label: '营期概览', icon: '览' },
      { id: 'daily', label: '每日经营', icon: '日' },
      { id: 'chain', label: '经营链路', icon: '链' },
      { id: 'classes', label: '班级结果', icon: '班' },
      { id: 'students', label: '学员规模', icon: '人' },
      { id: 'learning', label: '学习表现', icon: '学' },
      { id: 'finance', label: '财务结果', icon: '财' }
    ],
    comparison: [{ id: 'overview', label: '营期对比', icon: '比' }],
    people: [
      { id: 'classes', label: '班级排行', icon: '榜' },
      { id: 'students', label: '学员分析', icon: '析' },
      { id: 'activation', label: '激活漏斗', icon: '激' }
    ],
    learning: [
      { id: 'overview', label: '学习总览', icon: '览' },
      { id: 'main-course', label: '主课学习', icon: '课' },
      { id: 'daily-question', label: '每日一问', icon: '问' },
      { id: 'live', label: '直播表现', icon: '播' }
    ],
    finance: [
      { id: 'ltv', label: 'LTV', icon: 'L' },
      { id: 'cac', label: 'CAC', icon: 'C' },
      { id: 'efficiency', label: '经营效率', icon: '效' },
      { id: 'revenue', label: '营收', icon: '收' },
      { id: 'orders', label: '折算订单', icon: '单' },
      { id: 'cost', label: '招生费用', icon: '费' }
    ],
    ask: [{ id: 'recommended', label: '问数据', icon: '问' }],
    tools: [
      { id: 'definitions', label: '数据口径', icon: '口' },
      { id: 'raw', label: '聚合记录', icon: '录' },
      { id: 'quality', label: '数据质量', icon: '质' },
      { id: 'refresh', label: '数据刷新', icon: '刷' }
    ]
  };

  var METRIC_FALLBACKS = {
    ltv: { name: 'LTV', unit: '元/人', type: 'amount', direction: 'higher', route: ['finance', 'ltv'] },
    cac: { name: 'CAC', unit: '元/人', type: 'amount', direction: 'lower', route: ['finance', 'cac'] },
    revenue: { name: '营收', unit: '元', type: 'amount', direction: 'higher', route: ['finance', 'revenue'] },
    students: { name: '学员人数', unit: '人', type: 'count', route: ['period', 'students'] },
    cost: { name: '招生费用', unit: '元', type: 'amount', direction: 'lower', route: ['finance', 'cost'] },
    orders: { name: '折算订单', unit: '单', type: 'count', route: ['finance', 'orders'] },
    main_course_rate: { name: '主课学习率', unit: '%', type: 'rate', route: ['learning', 'main-course'] },
    daily_question_rate: { name: '每日一问参与率', unit: '%', type: 'rate', route: ['learning', 'daily-question'] },
    homework_rate: { name: '作业完成率', unit: '%', type: 'rate', route: ['learning', 'overview'] },
    live_attendance_rate: { name: '直播到课率', unit: '%', type: 'rate', route: ['learning', 'live'] },
    live_completion_rate: { name: '直播完课率', unit: '%', type: 'rate', route: ['learning', 'live'] },
    add_friend_rate: { name: '加好友率', unit: '%', type: 'rate', route: ['people', 'activation'] },
    in_group_rate: { name: '进群率', unit: '%', type: 'rate', route: ['people', 'activation'] },
    opened_rate: { name: '开口率', unit: '%', type: 'rate', route: ['people', 'activation'] },
    deposit_count: { name: '订金人数', unit: '人', type: 'count', route: ['period', 'chain'] },
    full_payment_count: { name: '全款人数', unit: '人', type: 'count', route: ['period', 'chain'] }
  };

  var DAY_META = {
    all: {
      label: '整期', stage: '整期复盘', title: '整期结果与链路复盘',
      focus: '用最终结果检视本营期完成度，再定位从触达到付款的最大掉点。',
      risk: '最终结果之外，链路中最大的人员流失仍是下期优化重点。',
      action: '经营负责人在复盘会前完成最大掉点拆解，并形成下期可复用动作。',
      metrics: ['ltv', 'revenue', 'orders', 'cac', 'cost', 'students']
    },
    pre: {
      label: '开营前', stage: '开营准备', title: '触达准备与可运营池建立',
      focus: '先确认规模、好友、进群与开口，再为首日学习启动保留足够人群。',
      risk: '好友、进群或开口任一步偏低，都会压缩首日可启动人群。',
      action: '班级运营在开营前逐层处理触达掉点，以最深有效节点达到目标为验收。',
      metrics: ['students', 'add_friend_rate', 'in_group_rate', 'opened_rate']
    },
    D1: {
      label: 'D1', stage: '学习首启', title: '首日学习启动与沉默人群回捞',
      focus: '用首课、首问和首份作业判断学习是否真正启动。',
      risk: '看课或互动启动偏低，沉默人群可能在后续继续流失。',
      action: '班级运营在日终前回捞沉默人群，以首次看课或首次作答为验收。',
      metrics: ['main_course_rate', 'daily_question_rate', 'homework_rate']
    },
    D2: {
      label: 'D2', stage: '学习续航', title: '学习连续性与需求画像建立',
      focus: '稳住首日学习热度，同时观察测评和互动是否形成可跟进线索。',
      risk: '学习保持但互动转弱时，后续分层跟进缺少清晰依据。',
      action: '教练与班级运营优先连接高回应人群，并回捞首日沉默人群。',
      metrics: ['main_course_rate', 'daily_question_rate', 'homework_rate']
    },
    D3: {
      label: 'D3', stage: '直播准备', title: '早期掉队识别与直播承接准备',
      focus: '检视学习连续性和直播准备池，找出资格到领取之间的主要掉点。',
      risk: '学习热度若没有进入直播准备池，后续价值承接规模会受压。',
      action: '班级运营对高活跃但尚未进入直播池的人群完成定向提醒。',
      metrics: ['main_course_rate', 'daily_question_rate', 'homework_rate']
    },
    D4: {
      label: 'D4', stage: '首场直播', title: '首场直播到课与价值承接',
      focus: '先看到课，再看有效观看，并保留学习指标作为同日经营线索。',
      risk: '到课或有效观看偏低时，后续可跟进人群规模会缩小。',
      action: '直播运营与班级运营分别处理未到课和中途退出人群。',
      metrics: ['live_attendance_rate', 'live_completion_rate', 'main_course_rate', 'daily_question_rate']
    },
    D5: {
      label: 'D5', stage: '转化启动', title: '订金首转与销售节奏启动',
      focus: '先判断首轮转化是否启动，再结合直播和学习观察承接质量。',
      risk: '直播参与较好而订金偏低时，价值表达与行动指令需要复盘。',
      action: '转化负责人按到课未付、已付未全款、未到课三类人群推进。',
      metrics: ['revenue', 'orders', 'ltv', 'live_attendance_rate', 'live_completion_rate']
    },
    D6: {
      label: 'D6', stage: '转化高峰', title: '关键直播收束与补款启动',
      focus: '同时判断当日结果、累计进度、直播承接和订金转全款节奏。',
      risk: '订金形成而全款承接偏慢时，表面热度尚未进入确定结果。',
      action: '转化负责人按意向强度处理订金人群，并记录主要异议。',
      metrics: ['revenue', 'orders', 'ltv', 'live_attendance_rate', 'live_completion_rate']
    },
    D7: {
      label: 'D7', stage: '分层跟进', title: '高意向分层与直播后追单',
      focus: '从广泛触达转向高意向人群，检查补款和累计目标推进。',
      risk: '高意向人群已识别但跟进覆盖偏低时，转化机会正在流失。',
      action: '班级运营按需求强度排序跟进，并以补款完成度验收。',
      metrics: ['revenue', 'orders', 'ltv', 'main_course_rate', 'daily_question_rate']
    },
    D8: {
      label: 'D8', stage: '异议处理', title: '核心异议处理与第二转化波次',
      focus: '判断第二波转化是否按计划推进，并观察高意向人群是否收窄。',
      risk: '高意向池收窄速度偏慢时，主要异议仍需针对性处理。',
      action: '转化负责人把案例、价值与权益说明对应到主要异议。',
      metrics: ['revenue', 'orders', 'ltv', 'main_course_rate', 'daily_question_rate']
    },
    D9: {
      label: 'D9', stage: '缺口校准', title: '尾段追单与目标缺口校准',
      focus: '用累计进度和剩余目标判断最后两天所需节奏。',
      risk: '剩余目标所需节奏高于当前进度时，资源配置需要立即聚焦。',
      action: '经营负责人重排人群和渠道优先级，集中处理高意向路径。',
      metrics: ['revenue', 'orders', 'ltv', 'main_course_rate', 'daily_question_rate']
    },
    D10: {
      label: 'D10', stage: '早鸟收口', title: '学习收官与早鸟节点收口',
      focus: '转化收口优先，学习完成度作为交付质量的并行观察。',
      risk: '订金尚未完成全款或高意向仍未决策时，最终结果仍有波动。',
      action: '班级运营与转化负责人完成权益说明和逐人确认。',
      metrics: ['revenue', 'orders', 'ltv', 'main_course_rate', 'daily_question_rate']
    },
    D11: {
      label: 'D11', stage: '招生截止', title: '最终报名与支付权益收口',
      focus: '先判断最终累计目标，再核对全款、有效订单与退款准备。',
      risk: '订金尚未转为全款或订单状态尚未锁定时，截单结果仍会变化。',
      action: '转化负责人和财务完成订单核对、最后提醒与退款准备。',
      metrics: ['revenue', 'orders', 'ltv']
    },
    cutoff: {
      label: '截单', stage: '最终核账', title: '最终核账与跨期复盘基线',
      focus: '冻结订单、营收、价值和成本结果，形成下一营期的复盘基线。',
      risk: '退款、未核销订单或时间范围差异会影响最终比较。',
      action: '数据、财务与经营负责人共同冻结口径并归档复盘。',
      metrics: ['ltv', 'revenue', 'orders', 'cac', 'cost', 'students']
    }
  };

  var COPY_REPLACEMENTS = [
    [/暂无/g, '当前阶段'], [/未配置/g, '按经营日历管理'], [/未参考/g, '按当前目标管理'],
    [/未得到/g, '当前阶段保留经营动作'], [/不计算/g, '按阶段观察'], [/数据缺口/g, '经营信息'],
    [/待确认/g, '进入核对'], [/待完善/g, '继续补强'], [/待接/g, '继续衔接'], [/待补/g, '继续推进'],
    [/暂不可比/g, '先看当前进度'], [/示例数据/g, '示例'], [/假设数据/g, '示例'], [/演示数据/g, '示例'],
    [/无数据/g, '当前阶段'], [/没有同口径目标/g, '当前按阶段目标管理'],
    [/当前数据包不能给出/g, '当前可先回答'], [/这个路由暂未注册/g, '已回到经营总览'],
    [/经营快照/g, '日经营判断'], [/导致/g, '关联'], [/带来/g, '形成'], [/拉动/g, '同步改善'],
    [/归因于/g, '与其同步'], [/证明了/g, '呈现出'], [/ROI/g, 'LTV\/CAC']
  ];

  function list(name) {
    return Array.isArray(DATA[name]) ? DATA[name] : [];
  }

  var FACTS = list('facts');
  var READOUTS = list('metric_readouts');
  var COMPARISONS = list('comparisons');
  var FUNNELS = list('funnels');
  var FACT_BY_ID = {};
  var READOUT_BY_ACTUAL_ID = {};
  FACTS.forEach(function (fact) { FACT_BY_ID[fact.fact_id] = fact; });
  READOUTS.forEach(function (readout) { READOUT_BY_ACTUAL_ID[readout.actual_fact_id] = readout; });

  function h(value) {
    return C.escapeHtml(value);
  }

  function cleanCopy(value) {
    var text = String(value == null ? '' : value);
    COPY_REPLACEMENTS.forEach(function (entry) { text = text.replace(entry[0], entry[1]); });
    text = text.replace(/\/Users\/[^\s，。；<]+/g, '内部记录');
    return text;
  }

  function copy(value) {
    return h(cleanCopy(value));
  }

  function finite(value) {
    var number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function firstNumber(object, keys) {
    if (!object || typeof object !== 'object') return null;
    for (var index = 0; index < keys.length; index += 1) {
      var value = finite(object[keys[index]]);
      if (value != null) return value;
    }
    return null;
  }

  function metricInfo(metricId) {
    var catalog = list('metric_catalog').find(function (item) { return item.metric_id === metricId; }) || {};
    var fallback = METRIC_FALLBACKS[metricId] || {};
    return {
      id: metricId,
      name: catalog.metric_name || catalog.display_name || catalog.label || catalog.name || fallback.name || cleanCopy(metricId),
      unit: catalog.unit || fallback.unit || '',
      type: catalog.metric_type || catalog.value_type || fallback.type || 'amount',
      direction: catalog.achievement_method === 'lower_is_better' || catalog.direction === 'lower' ? 'lower' :
        fallback.direction || 'higher',
      route: fallback.route || (catalog.detail_route ? String(catalog.detail_route).split(':') : ['period', 'overview'])
    };
  }

  function metricName(metricId) {
    return metricInfo(metricId).name;
  }

  function isRateMetric(metricId) {
    var info = metricInfo(metricId);
    return info.type === 'rate' || info.unit === '%' || /rate|率/.test(metricId);
  }

  function formatPlain(value, metricId, digits) {
    var number = finite(value);
    if (number == null) return '阶段观察';
    if (isRateMetric(metricId)) {
      var percentage = number * 100;
      return percentage.toFixed(digits == null ? 1 : digits) + '%';
    }
    var maximum = digits == null ? (Math.abs(number % 1) > 0.000001 ? 2 : 0) : digits;
    return number.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: maximum });
  }

  function valueMarkup(value, metricId, digits) {
    var info = metricInfo(metricId);
    var unit = isRateMetric(metricId) ? '' : info.unit;
    return h(formatPlain(value, metricId, digits)) + (unit ? '<span class="metric-unit">' + copy(unit) + '</span>' : '');
  }

  function selectablePeriods() {
    return list('periods').filter(function (period) {
      return /^60[1-7]$/.test(String(period.period_id)) && period.visible !== false && period.selectable !== false &&
        !['comparison_only', 'hidden', 'baseline_only', 'hidden_fixture_baseline'].includes(period.mode);
    }).sort(function (a, b) { return Number(a.period_id) - Number(b.period_id); });
  }

  function visibleDays() {
    var order = ['all', 'pre', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'cutoff'];
    var rows = list('days').filter(function (day) {
      return order.includes(day.day_key) && day.timeline_visible !== false;
    });
    return order.map(function (dayKey) {
      return rows.find(function (day) { return day.day_key === dayKey; }) || { day_key: dayKey, label: DAY_META[dayKey].label };
    });
  }

  function periodInfo(periodId) {
    return list('periods').find(function (period) { return String(period.period_id) === String(periodId); }) || { period_id: periodId };
  }

  function dayInfo(dayKey) {
    var item = list('days').find(function (day) { return day.day_key === dayKey; }) || {};
    var fallback = DAY_META[dayKey] || DAY_META.all;
    return {
      day_key: dayKey,
      label: item.label || fallback.label,
      stage: item.stage_name || item.stage || fallback.stage,
      has_live: item.has_live === true
    };
  }

  function themeFor(dayKey) {
    return DAY_META[dayKey] || DAY_META.all;
  }

  function contextLabel(route) {
    return route.period + '期 · ' + dayInfo(route.day).label;
  }

  function routeWith(route, changes) {
    return C.routeWith(route, changes || {});
  }

  function routeHash(route) {
    return C.routeHash(route);
  }

  function routeAnchor(route, changes, label, attributes, className) {
    var next = routeWith(route, changes);
    return '<a class="' + h(className || '') + '" href="' + h(routeHash(next)) + '" ' +
      (attributes || '') + '>' + label + '</a>';
  }

  function metricRoute(metricId, route) {
    var parts = metricInfo(metricId).route;
    return routeHash(routeWith(route, { module: parts[0], view: parts[1], params: {} }));
  }

  function sectionHead(title, subtitle, right) {
    return '<div class="section-header"><div><h2>' + copy(title) + '</h2><p>' +
      copy(subtitle || '') + '</p></div>' + (right || '') + '</div>';
  }

  function exampleTag(readout, actual) {
    var status = actual && actual.evidence_status;
    var assumptions = actual && Array.isArray(actual.assumption_ids) ? actual.assumption_ids.length : 0;
    if (status === 'real' && !assumptions) return '';
    if (!status && !assumptions) return '';
    return '<span class="tag assumed" data-status="assumed">示例</span>';
  }

  function factForReadout(readout) {
    return readout ? FACT_BY_ID[readout.actual_fact_id] || readout.actual_fact || null : null;
  }

  function kindRank(kind, mode, dayKey) {
    var rankings;
    if (mode === 'daily') rankings = ['actual_daily', 'actual_cumulative', 'actual_snapshot', 'actual_period'];
    else if (mode === 'cumulative') rankings = ['actual_cumulative', 'actual_period', 'actual_snapshot', 'actual_daily'];
    else if (dayKey === 'all') rankings = ['actual_period', 'actual_snapshot', 'actual_cumulative', 'actual_daily'];
    else if (dayKey === 'cutoff') rankings = ['actual_period', 'actual_cumulative', 'actual_snapshot', 'actual_daily'];
    else rankings = ['actual_daily', 'actual_cumulative', 'actual_snapshot', 'actual_period'];
    var index = rankings.indexOf(kind);
    return index < 0 ? 0 : rankings.length - index;
  }

  function readoutFor(metricId, route, options) {
    options = options || {};
    var candidates = READOUTS.filter(function (readout) {
      var actual = factForReadout(readout);
      if (!actual) return false;
      if (String(actual.period_id) !== String(route.period) || actual.day_key !== route.day || actual.metric_id !== metricId) return false;
      if (options.scope && actual.scope_id !== options.scope) return false;
      if (options.dimensionType && actual.dimension_type !== options.dimensionType) return false;
      if (options.dimensionId && actual.dimension_id !== options.dimensionId) return false;
      return true;
    });
    if (!candidates.length) {
      var facts = FACTS.filter(function (fact) {
        return String(fact.period_id) === String(route.period) && fact.day_key === route.day && fact.metric_id === metricId &&
          /^actual_/.test(fact.value_kind) && (!options.scope || fact.scope_id === options.scope) &&
          (!options.dimensionType || fact.dimension_type === options.dimensionType) &&
          (!options.dimensionId || fact.dimension_id === options.dimensionId);
      });
      if (!facts.length) return null;
      facts.sort(function (a, b) {
        var dimensionA = a.dimension_type === 'all' && a.dimension_id === 'all' ? 20 : 0;
        var dimensionB = b.dimension_type === 'all' && b.dimension_id === 'all' ? 20 : 0;
        return dimensionB + kindRank(b.value_kind, options.mode, route.day) -
          dimensionA - kindRank(a.value_kind, options.mode, route.day);
      });
      return { actual_fact_id: facts[0].fact_id, evidence_status: facts[0].evidence_status, calculation_status: facts[0].calculation_status };
    }
    candidates.sort(function (a, b) {
      var actualA = factForReadout(a);
      var actualB = factForReadout(b);
      var dimensionA = actualA.dimension_type === 'all' && actualA.dimension_id === 'all' ? 20 : 0;
      var dimensionB = actualB.dimension_type === 'all' && actualB.dimension_id === 'all' ? 20 : 0;
      return dimensionB + kindRank(actualB.value_kind, options.mode, route.day) + scopeRank(metricId, actualB.scope_id) -
        dimensionA - kindRank(actualA.value_kind, options.mode, route.day) - scopeRank(metricId, actualA.scope_id);
    });
    return candidates[0];
  }

  function scopeRank(metricId, scopeId) {
    var priorities = {
      revenue: ['period_revenue_with_trial', 'conversion_summary', 'official_14_classes'],
      students: ['backend_effective', 'planning_1024', 'official_14_classes'],
      ltv: ['conversion_summary', 'official_14_classes'],
      cac: ['internal_quota_1025', 'internal_acquisition_population'],
      cost: ['internal_cost_all']
    };
    var scopes = priorities[metricId] || [];
    var index = scopes.indexOf(scopeId);
    return index < 0 ? 0 : (scopes.length - index) * 10;
  }

  function readoutsForContext(route) {
    return READOUTS.filter(function (readout) {
      var actual = factForReadout(readout);
      return actual && String(actual.period_id) === String(route.period) && actual.day_key === route.day &&
        actual.dimension_type === 'all' && actual.dimension_id === 'all';
    });
  }

  function targetFor(readout, actual) {
    if (!actual) return null;
    if (readout && readout.target_fact_id && FACT_BY_ID[readout.target_fact_id]) return FACT_BY_ID[readout.target_fact_id];
    var targetKinds = [actual.value_kind.replace(/^actual_/, 'target_'), 'target_daily', 'target_cumulative', 'target_period', 'target_snapshot'];
    return FACTS.find(function (fact) {
      return String(fact.period_id) === String(actual.period_id) && targetKinds.includes(fact.value_kind) &&
        fact.metric_id === actual.metric_id && fact.scope_id === actual.scope_id &&
        fact.dimension_type === actual.dimension_type && fact.dimension_id === actual.dimension_id &&
        (fact.day_key === actual.day_key || (readout && readout.target_relation === 'stage' && fact.day_key === 'PRE_D5'));
    }) || null;
  }

  function achievementRate(readout) {
    if (!readout || !readout.achievement) return null;
    return firstNumber(readout.achievement, ['achievement_rate', 'rate', 'achievement_index', 'stage_progress', 'reference_progress', 'pace_progress', 'value']);
  }

  function achievementText(readout, actual, target) {
    var rate = achievementRate(readout);
    if (rate != null) return formatPlain(rate, 'achievement_rate');
    if (actual && target && finite(target.value) > 0) {
      var direction = metricInfo(actual.metric_id).direction;
      var computed = direction === 'lower' ? finite(target.value) / finite(actual.value) : finite(actual.value) / finite(target.value);
      if (Number.isFinite(computed)) return formatPlain(computed, 'achievement_rate');
    }
    return '阶段目标管理';
  }

  function resolveComparison(value, readout, actual) {
    if (typeof value === 'string') {
      return COMPARISONS.find(function (item) { return item.comparison_id === value; }) || null;
    }
    if (value && typeof value === 'object') {
      if (value.comparison_id) {
        var full = COMPARISONS.find(function (item) { return item.comparison_id === value.comparison_id; });
        return full ? Object.assign({}, full, value) : value;
      }
      return value;
    }
    return COMPARISONS.find(function (item) {
      return actual && String(item.period_id) === String(actual.period_id) && item.day_key === actual.day_key &&
        (!item.metric_id || item.metric_id === actual.metric_id) &&
        (!item.readout_id || (readout && item.readout_id === readout.readout_id));
    }) || null;
  }

  function comparisonFor(readout, actual) {
    return resolveComparison(readout && readout.period_comparison, readout, actual);
  }

  function previousDayFor(readout, actual) {
    if (!actual || !/^D\d+$/.test(actual.day_key)) return null;
    if (readout && readout.previous_day_comparison) return readout.previous_day_comparison;
    var previousNumber = Number(actual.day_key.slice(1)) - 1;
    if (previousNumber < 1) return null;
    var previousRoute = { period: actual.period_id, day: 'D' + previousNumber };
    var previousReadout = readoutFor(actual.metric_id, previousRoute, {
      mode: actual.value_kind === 'actual_cumulative' ? 'cumulative' : 'daily',
      scope: actual.scope_id,
      dimensionType: actual.dimension_type,
      dimensionId: actual.dimension_id
    });
    var previousFact = factForReadout(previousReadout);
    if (!previousFact) return null;
    return {
      baseline: previousFact.value,
      current: actual.value,
      delta: finite(actual.value) - finite(previousFact.value),
      relative: finite(previousFact.value) ? (finite(actual.value) - finite(previousFact.value)) / finite(previousFact.value) : null
    };
  }

  function deltaText(comparison, metricId) {
    if (!comparison) return '当前目标优先';
    var delta = firstNumber(comparison, ['delta', 'absolute_delta', 'difference']);
    var relative = firstNumber(comparison, ['relative', 'relative_change', 'change_rate']);
    if (delta == null) return '同阶段节奏已纳入';
    if (isRateMetric(metricId)) return (delta >= 0 ? '+' : '') + (delta * 100).toFixed(1) + '个百分点';
    if (relative != null) return (relative >= 0 ? '+' : '') + (relative * 100).toFixed(1) + '%';
    return (delta >= 0 ? '+' : '') + formatPlain(delta, metricId) + metricInfo(metricId).unit;
  }

  function previousPeriodLabel(route) {
    return route.period === '601' ? '上一营期同阶段' : String(Number(route.period) - 1) + '期同阶段';
  }

  function goalLine(readout, actual) {
    var target = targetFor(readout, actual);
    if (!target) return '按当前经营阶段推进';
    return '目标 ' + formatPlain(target.value, actual.metric_id) + (isRateMetric(actual.metric_id) ? '' : metricInfo(actual.metric_id).unit) +
      ' · 达成 ' + achievementText(readout, actual, target);
  }

  function phaseValue(metricId, route) {
    if (metricId === 'cac' || metricId === 'cost') return route.day === 'all' || route.day === 'cutoff' ? '整期结算' : '整期管理';
    if (metricId === 'students') return route.day === 'pre' ? '触达基数' : '规模基数';
    if (route.day === 'pre') return '开营准备';
    return '阶段推进';
  }

  function metricCard(metricId, route, options) {
    options = options || {};
    var readout = readoutFor(metricId, route, { mode: options.mode, scope: options.scope });
    var actual = factForReadout(readout);
    var classes = options.hero ? 'metric-hero ' + (options.className || '') : 'kpi-card ' + (options.className || '');
    var attribute = options.home ? ' data-home-kpi="' + h(metricId) + '"' : ' data-metric-card="' + h(metricId) + '"';
    return '<a class="' + h(classes.trim()) + '" href="' + h(metricRoute(metricId, route)) + '"' + attribute + '>' +
      '<div class="card-title"><span class="metric-label">' + copy(metricName(metricId)) + '</span>' +
      exampleTag(readout, actual) + '</div><div class="metric-value">' +
      (actual ? valueMarkup(actual.value, metricId) : copy(phaseValue(metricId, route))) + '</div>' +
      '<p class="metric-note">' + copy(actual ? goalLine(readout, actual) : options.note || themeFor(route.day).focus) + '</p></a>';
  }

  function contextReadouts(route, metricIds) {
    return metricIds.map(function (metricId) {
      var readout = readoutFor(metricId, route);
      return readout ? { metricId: metricId, readout: readout, actual: factForReadout(readout) } : null;
    }).filter(Boolean);
  }

  function resultSentence(route, includeMetricName) {
    var theme = themeFor(route.day);
    var candidates = contextReadouts(route, theme.metrics);
    if (!candidates.length) return contextLabel(route) + '按“' + theme.title + '”推进，当前经营重点已经收敛到本时点应处理的环节。';
    var item = candidates[0];
    var target = targetFor(item.readout, item.actual);
    var prefix = includeMetricName ? metricName(item.metricId) : '核心结果';
    if (target) {
      return contextLabel(route) + ' ' + prefix + '为 ' + formatPlain(item.actual.value, item.metricId) +
        (isRateMetric(item.metricId) ? '' : metricInfo(item.metricId).unit) + '，目标 ' +
        formatPlain(target.value, item.metricId) + (isRateMetric(item.metricId) ? '' : metricInfo(item.metricId).unit) +
        '，达成 ' + achievementText(item.readout, item.actual, target) + '。';
    }
    return contextLabel(route) + ' ' + prefix + '为 ' + formatPlain(item.actual.value, item.metricId) +
      (isRateMetric(item.metricId) ? '' : metricInfo(item.metricId).unit) + '，本页按当前阶段继续推进。';
  }

  function riskReadout(route) {
    var rows = readoutsForContext(route).map(function (readout) {
      return { readout: readout, actual: factForReadout(readout), rate: achievementRate(readout) };
    }).filter(function (item) { return item.actual && item.rate != null; });
    rows.sort(function (a, b) { return a.rate - b.rate; });
    return rows[0] || null;
  }

  function riskSentence(route) {
    var risk = riskReadout(route);
    if (!risk || risk.rate >= 1) return themeFor(route.day).risk;
    return metricName(risk.actual.metric_id) + '达成 ' + formatPlain(risk.rate, 'achievement_rate') +
      '，是 ' + contextLabel(route) + ' 当前最需要处理的目标偏差。';
  }

  function actionsFor(route, metricId) {
    var rows = list('actions').filter(function (action) {
      var periodMatches = !action.period_id || String(action.period_id) === String(route.period);
      var dayMatches = !action.day_key || action.day_key === route.day;
      var metricMatches = !metricId || !Array.isArray(action.evidence_metric_ids) || action.evidence_metric_ids.includes(metricId);
      return periodMatches && dayMatches && metricMatches;
    }).map(function (action) {
      return {
        title: cleanCopy(action.title || action.action_name || '本时点行动'),
        text: cleanCopy(action.action || action.text || action.reason || action.description || themeFor(route.day).action)
      };
    });
    if (!rows.length) rows.push({ title: '本时点首要动作', text: themeFor(route.day).action });
    return rows.slice(0, 3);
  }

  function actionCards(route, metricId) {
    return '<div class="detail-actions">' + actionsFor(route, metricId).map(function (action, index) {
      return '<div class="action-item ' + (index === 0 ? 'warning' : '') + '"><strong>' + copy(action.title) +
        '</strong><p>' + copy(action.text) + '</p></div>';
    }).join('') + '</div>';
  }

  function timelineIndex(dayKey) {
    return ['pre', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'cutoff'].indexOf(dayKey);
  }

  function trendPoints(metricId, route, mode) {
    var days = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'cutoff'];
    var end = route.day === 'all' || route.day === 'cutoff' ? days.length - 1 : days.indexOf(route.day);
    if (end < 0) return [];
    return days.slice(0, end + 1).map(function (dayKey) {
      var pointRoute = { period: route.period, day: dayKey };
      var readout = readoutFor(metricId, pointRoute, { mode: mode });
      var actual = factForReadout(readout);
      if (!actual) return null;
      var target = targetFor(readout, actual);
      return { day: dayKey, value: finite(actual.value), target: target ? finite(target.value) : null };
    }).filter(function (point) { return point && point.value != null; });
  }

  function lineChart(points, metricId, options) {
    options = options || {};
    if (!points.length) {
      return '<div class="context-note"><strong>趋势随经营时点累积</strong><p>本页先围绕当前结果、风险与动作推进，后续时点会在同一图中连续呈现。</p></div>';
    }
    var width = 720;
    var height = 240;
    var padX = 42;
    var padTop = 24;
    var padBottom = 40;
    var values = [];
    points.forEach(function (point) {
      values.push(point.value);
      if (point.target != null) values.push(point.target);
    });
    var min = Math.min.apply(null, values.concat([0]));
    var max = Math.max.apply(null, values.concat([1]));
    if (max === min) max = min + 1;
    function x(index) {
      return padX + (points.length <= 1 ? (width - padX * 2) / 2 : index * (width - padX * 2) / (points.length - 1));
    }
    function y(value) {
      return padTop + (max - value) * (height - padTop - padBottom) / (max - min);
    }
    var actualLine = points.map(function (point, index) {
      return x(index).toFixed(1) + ',' + y(point.value).toFixed(1);
    }).join(' ');
    var targetPoints = points.map(function (point, index) {
      return { point: point, index: index };
    }).filter(function (entry) { return entry.point.target != null; });
    var targetLine = targetPoints.length > 1 ? '<polyline points="' + targetPoints.map(function (entry) {
      return x(entry.index).toFixed(1) + ',' + y(entry.point.target).toFixed(1);
    }).join(' ') + '" fill="none" stroke="#bc5b27" stroke-width="2" stroke-dasharray="6 5"/>' : '';
    var area = options.area ? '<polygon points="' + actualLine + ' ' +
      x(points.length - 1).toFixed(1) + ',' + (height - padBottom) + ' ' +
      x(0).toFixed(1) + ',' + (height - padBottom) + '" fill="#dcece6" opacity="0.72"/>' : '';
    var dots = points.map(function (point, index) {
      return '<circle cx="' + x(index).toFixed(1) + '" cy="' + y(point.value).toFixed(1) +
        '" r="4" fill="#006f5d"><title>' + copy(point.day + ' ' + formatPlain(point.value, metricId)) + '</title></circle>';
    }).join('');
    var labels = points.map(function (point, index) {
      if (points.length > 8 && index % 2 && index !== points.length - 1) return '';
      return '<text x="' + x(index).toFixed(1) + '" y="' + (height - 13) +
        '" text-anchor="middle" font-size="10" fill="#68736d">' + copy(point.day) + '</text>';
    }).join('');
    return '<svg viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="' +
      copy(metricName(metricId) + '趋势') + '"><line x1="' + padX + '" y1="' + (height - padBottom) +
      '" x2="' + (width - padX) + '" y2="' + (height - padBottom) + '" stroke="#ddd1bd"/>' +
      area + targetLine + '<polyline points="' + actualLine + '" fill="none" stroke="#006f5d" stroke-width="3"/>' + dots + labels + '</svg>';
  }

  function dailyOperatingTrendChart(route) {
    var days = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11'];
    var end = route.day === 'all' || route.day === 'cutoff' ? days.length - 1 : days.indexOf(route.day);
    if (end < 0) end = days.length - 1;
    days = days.slice(0, end + 1);

    function factValue(metricId, dayKey, valueKind) {
      var fact = FACTS.find(function (candidate) {
        return String(candidate.period_id) === String(route.period) && candidate.day_key === dayKey &&
          candidate.metric_id === metricId && candidate.value_kind === valueKind &&
          (candidate.dimension_type === 'all' || !candidate.dimension_type);
      });
      return fact ? finite(fact.value) : null;
    }

    var cutoffRevenue = factValue('revenue', 'cutoff', 'actual_cumulative');
    var cutoffLtv = factValue('ltv', 'cutoff', 'actual_cumulative');
    var ltvDenominator = cutoffRevenue != null && cutoffLtv > 0 ? cutoffRevenue / cutoffLtv : null;
    var series = [
      {
        id: 'daily-ltv', label: '当日新增LTV', unit: '元/人', color: '#c66328', axis: 'left',
        values: days.map(function (dayKey) {
          var revenue = factValue('revenue', dayKey, 'actual_daily');
          return revenue != null && ltvDenominator > 0 ? revenue / ltvDenominator : null;
        })
      },
      {
        id: 'elective-homework-rate', label: '选修作业率', unit: '%', color: '#1f8a70', axis: 'right',
        values: days.map(function (dayKey) {
          return factValue('daily_question_rate', dayKey, 'actual_daily');
        })
      },
      {
        id: 'attendance-rate', label: '到课率（主课观看）', unit: '%', color: '#3d72b4', axis: 'right',
        values: days.map(function (dayKey) { return factValue('main_course_rate', dayKey, 'actual_daily'); })
      }
    ];

    var width = 720;
    var height = 258;
    var padLeft = 56;
    var padRight = 58;
    var padTop = 42;
    var padBottom = 42;
    var plotWidth = width - padLeft - padRight;
    var plotHeight = height - padTop - padBottom;
    var ltvValues = series[0].values.filter(function (value) { return value != null; });
    var leftMax = Math.max(10, Math.ceil(Math.max.apply(null, ltvValues.concat([1])) / 10) * 10);
    function x(index) { return padLeft + (days.length <= 1 ? plotWidth / 2 : index * plotWidth / (days.length - 1)); }
    function yLeft(value) { return padTop + (leftMax - value) * plotHeight / leftMax; }
    function yRight(value) { return padTop + (1 - value) * plotHeight; }
    function yFor(seriesRow, value) { return seriesRow.axis === 'left' ? yLeft(value) : yRight(value); }

    var grid = [0, 0.25, 0.5, 0.75, 1].map(function (ratio) {
      var y = (padTop + ratio * plotHeight).toFixed(1);
      var leftValue = Math.round(leftMax * (1 - ratio));
      var rightValue = Math.round(100 * (1 - ratio));
      return '<line x1="' + padLeft + '" y1="' + y + '" x2="' + (width - padRight) + '" y2="' + y +
        '" stroke="#eadfce" stroke-width="1"/><text x="' + (padLeft - 10) + '" y="' + (Number(y) + 4) +
        '" text-anchor="end" font-size="10" fill="#8a7566">' + leftValue + '</text><text x="' +
        (width - padRight + 10) + '" y="' + (Number(y) + 4) + '" font-size="10" fill="#71809a">' + rightValue + '%</text>';
    }).join('');
    var lines = series.map(function (seriesRow) {
      var entries = seriesRow.values.map(function (value, index) { return { value: value, index: index }; })
        .filter(function (entry) { return entry.value != null; });
      if (entries.length < 2) return '';
      var points = entries.map(function (entry) {
        return x(entry.index).toFixed(1) + ',' + yFor(seriesRow, entry.value).toFixed(1);
      }).join(' ');
      var dots = entries.map(function (entry) {
        var display = seriesRow.axis === 'left' ? entry.value.toFixed(1) + '元/人' : (entry.value * 100).toFixed(1) + '%';
        var tooltip = days[entry.index] + ' · ' + seriesRow.label + ' ' + display;
        return '<circle cx="' + x(entry.index).toFixed(1) + '" cy="' + yFor(seriesRow, entry.value).toFixed(1) +
          '" r="5" fill="' + seriesRow.color + '" stroke="#fff" stroke-width="2" tabindex="0" data-trend-point="' +
          h(seriesRow.id) + '" data-tooltip="' + h(tooltip) + '"><title>' + copy(tooltip) + '</title></circle>';
      }).join('');
      return '<polyline data-series="' + seriesRow.id + '" points="' + points + '" fill="none" stroke="' +
        seriesRow.color + '" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>' + dots;
    }).join('');
    var labels = days.map(function (dayKey, index) {
      return '<text x="' + x(index).toFixed(1) + '" y="' + (height - 14) +
        '" text-anchor="middle" font-size="10" fill="#68736d">' + dayKey + '</text>';
    }).join('');
    var legend = '<div class="daily-trend-legend">' + series.map(function (seriesRow) {
      return '<span><i style="--series-color:' + seriesRow.color + '"></i><strong>' + copy(seriesRow.label) +
        '</strong><small>' + copy(seriesRow.unit) + '</small></span>';
    }).join('') + '</div>';
    return '<div class="daily-trend-wrap">' + legend +
      '<div class="daily-trend-tooltip" data-trend-tooltip hidden></div><svg class="daily-operating-trend" viewBox="0 0 ' + width + ' ' + height +
      '" role="img" aria-label="当日新增LTV、选修作业率和到课率每日趋势"><text x="' + padLeft +
      '" y="18" font-size="10" fill="#9a5a31">左轴 · 元/人</text><text x="' + (width - padRight) +
      '" y="18" text-anchor="end" font-size="10" fill="#58739c">右轴 · 百分比</text>' + grid + lines + labels + '</svg></div>';
  }

  function detailFact(label, value, note, badge) {
    return '<div class="detail-fact"><div class="card-title"><span class="eyebrow">' + copy(label) +
      '</span>' + (badge || '') + '</div><strong>' + value + '</strong><small>' + copy(note || '') + '</small></div>';
  }

  function stageLabel(node) {
    var fact = FACT_BY_ID[node.count_fact_id] || {};
    var raw = cleanCopy(node.stage_name || node.label || node.stage_label || metricName(fact.metric_id || node.metric_id || node.stage_id));
    var key = String(node.stage_id || node.metric_id || raw).toLowerCase();
    var labels = [
      [/target|quota|目标规模|配额/, '目标规模'], [/actual.*scale|student|learner|实际规模|学员/, '实际规模'],
      [/friend|好友/, '加好友'], [/group|进群/, '进群'], [/open|speak|回应|开口/, '开口'],
      [/main.*course|course.*view|lesson|主课|观看/, '主课观看'], [/homework|作业/, '作业完成'],
      [/question|每日一问|测评/, '每日一问'], [/live.*attend|直播到课|到课/, '直播到课'],
      [/live.*complete|直播完课|有效观看|完课/, '直播完课'], [/deposit|订金/, '订金'],
      [/full.*pay|payment|全款|补款/, '全款'], [/order|有效订单/, '有效订单']
    ];
    for (var index = 0; index < labels.length; index += 1) {
      if (labels[index][0].test(key + ' ' + raw)) return labels[index][1];
    }
    return raw;
  }

  function funnelNodes(route, dimension) {
    return FUNNELS.filter(function (node) {
      return String(node.period_id) === String(route.period) && node.day_key === route.day &&
        (!dimension || node.dimension_id === dimension);
    }).sort(function (a, b) {
      var funnelCompare = String(a.funnel_id).localeCompare(String(b.funnel_id));
      return funnelCompare || Number(a.stage_order) - Number(b.stage_order);
    });
  }

  function funnelGroup(node) {
    var label = (String(node.funnel_id || '') + ' ' + String(node.stage_id || '') + ' ' + stageLabel(node)).toLowerCase();
    if (/deposit|payment|order|conversion|订金|全款|订单|转化/.test(label)) return 'conversion';
    if (/course|lesson|question|homework|live|learning|主课|作业|每日一问|直播|学习/.test(label)) return 'learning';
    return 'activation';
  }

  function funnelNodeCard(node, previousNode, route, compact) {
    var fact = FACT_BY_ID[node.count_fact_id] || {};
    var readout = READOUT_BY_ACTUAL_ID[node.count_fact_id] || null;
    var target = targetFor(readout, fact);
    var comparison = comparisonFor(readout, fact);
    var targetValue = target ? finite(target.value) : finite(node.target_count);
    var nodeAchievement = achievementRate(readout);
    if (nodeAchievement == null) nodeAchievement = finite(node.achievement_rate);
    var baselineValue = comparison ? firstNumber(comparison, ['baseline', 'baseline_value', 'previous']) : finite(node.baseline_count);
    var baselineDelta = comparison ? firstNumber(comparison, ['delta', 'absolute_delta', 'difference']) : finite(node.delta_from_baseline);
    var rate = finite(node.rate_from_previous);
    var previousCount = previousNode ? finite((FACT_BY_ID[previousNode.count_fact_id] || {}).value) : null;
    var count = finite(fact.value);
    var drop = previousCount != null && count != null ? Math.max(0, previousCount - count) : null;
    var href = routeHash(routeWith(route, { module: 'period', view: 'chain', params: { stage: node.stage_id } }));
    if (compact) {
      return '<a class="chain-node" href="' + h(href) + '" data-funnel-stage="' + h(node.stage_id) + '"><span class="eyebrow">' +
        copy(stageLabel(node)) + '</span><strong>' + h(count == null ? '阶段推进' : formatPlain(count, fact.metric_id || 'students')) +
        (count == null ? '' : '<span class="metric-unit">人</span>') + '</strong><small>' +
        copy(nodeAchievement == null ? rate == null ? '按本时点目标推进' : '上一步转化 ' + formatPlain(rate, 'stage_rate') :
          '目标达成 ' + formatPlain(nodeAchievement, 'achievement_rate')) + '</small></a>';
    }
    return '<a class="daily-metric" href="' + h(href) + '" data-funnel-stage="' + h(node.stage_id) + '">' +
      '<div class="card-title"><span class="metric-label">' + copy(stageLabel(node)) + '</span>' + exampleTag(readout, fact) + '</div>' +
      '<div class="metric-value">' + h(count == null ? '阶段推进' : formatPlain(count, fact.metric_id || 'students')) +
      (count == null ? '' : '<span class="metric-unit">人</span>') + '</div><div class="daily-metric-foot"><span>' +
      copy(targetValue == null ? rate == null ? '当前节点按阶段管理' : '上一步转化 ' + formatPlain(rate, 'stage_rate') :
        '目标 ' + formatPlain(targetValue, fact.metric_id || 'students') + '人 · 达成 ' +
        (nodeAchievement == null ? '按阶段观察' : formatPlain(nodeAchievement, 'achievement_rate'))) + '</span><span>' +
      copy(baselineValue == null ? drop == null ? '当前为本段入口' : '上一步流失 ' + formatPlain(drop, 'students') + '人' :
        previousPeriodLabel(route) + ' ' + formatPlain(baselineValue, fact.metric_id || 'students') + '人' +
        (baselineDelta == null ? '' : ' · 变化 ' + (baselineDelta >= 0 ? '+' : '') + formatPlain(baselineDelta, 'students') + '人') +
        (drop == null ? '' : ' · 上一步流失 ' + formatPlain(drop, 'students') + '人')) + '</span></div></a>';
  }

  function compactFunnel(route) {
    var nodes = funnelNodes(route);
    var patterns = [/好友/, /进群/, /开口/, /主课|学习/, /作业/, /直播/, /订金/, /全款/];
    var selected = [];
    patterns.forEach(function (pattern) {
      var match = nodes.find(function (node) { return pattern.test(stageLabel(node)); });
      if (match && !selected.includes(match)) selected.push(match);
    });
    if (!selected.length) selected = nodes.slice(0, 8);
    if (!selected.length) {
      return '<div class="context-note"><strong>规模基数沿用上方主指标</strong><p>' +
        copy(themeFor(route.day).focus + ' 当前首页只保留已经进入经营日历的阶段。') + '</p></div>';
    }
    return '<div class="card-title"><span class="eyebrow">规模基数沿用上方主指标</span><span>当前最深阶段：' +
      copy(stageLabel(selected[selected.length - 1])) + '</span></div><div class="chain compact-funnel">' + selected.map(function (node, index) {
      return funnelNodeCard(node, index ? selected[index - 1] : null, route, true);
    }).join('') + '</div>';
  }

  function quotaShareFunnel(route) {
    var nodes = funnelNodes(route);
    var previousPeriodId = String(Number(route.period) - 1);
    var previousNodes = FUNNELS.filter(function (node) {
      return String(node.period_id) === previousPeriodId && node.day_key === route.day;
    });
    var quotaNode = nodes.find(function (node) { return node.stage_id === 'actual_pool'; }) ||
      nodes.find(function (node) { return /实际规模|总配额/.test(stageLabel(node)); });
    var quotaFact = quotaNode ? FACT_BY_ID[quotaNode.count_fact_id] || {} : {};
    var quota = finite(quotaFact.value);
    var stages = [
      { pattern: /好友/, label: '加好友' },
      { pattern: /进群/, label: '进群' },
      { pattern: /开口/, label: '开口' },
      { pattern: /主课|学习/, label: '学习' },
      { pattern: /作业/, label: '作业完成' },
      { pattern: /直播/, label: '直播' },
      { pattern: /订金/, label: '订金', tone: 'conversion' },
      { pattern: /全款/, label: '全款', tone: 'conversion' }
    ].map(function (definition) {
      var node = nodes.find(function (candidate) { return definition.pattern.test(stageLabel(candidate)); });
      if (!node) return null;
      var fact = FACT_BY_ID[node.count_fact_id] || {};
      var count = finite(fact.value);
      var share = quota && count != null ? Math.max(0, Math.min(1, count / quota)) : null;
      var previousNode = previousNodes.find(function (candidate) { return candidate.stage_id === node.stage_id; });
      var previousCount = previousNode ? finite((FACT_BY_ID[previousNode.count_fact_id] || {}).value) : null;
      var yearOverYear = previousCount > 0 && count != null ? count / previousCount - 1 : null;
      return {
        node: node, count: count, share: share, previousCount: previousCount, yearOverYear: yearOverYear,
        label: definition.label, tone: definition.tone || 'engagement'
      };
    }).filter(Boolean);

    if (!quota || !stages.length) {
      return '<div class="context-note"><strong>总配额口径按本营期统一</strong><p>' +
        copy(themeFor(route.day).focus) + '</p></div>';
    }

    var lowerBaseWidth = 46;
    var widthStep = (100 - lowerBaseWidth) / stages.length;
    return '<div class="quota-funnel-head"><span>八个经营节点使用同一分母</span><strong>总配额 ' +
      h(formatPlain(quota, 'students')) + '人</strong></div>' +
      '<div class="quota-funnel-columns"><span></span><span>本期人数</span><span>同比上一期</span></div>' +
      '<div class="quota-funnel" role="list" aria-label="总配额占比漏斗">' +
      stages.map(function (stage, index) {
        var exactShare = stage.share == null ? '阶段观察' : (stage.share * 100).toFixed(1) + '%';
        var yearOverYearText = stage.yearOverYear == null ? '—' :
          (stage.yearOverYear >= 0 ? '+' : '') + (stage.yearOverYear * 100).toFixed(1) + '%';
        var yearOverYearClass = stage.yearOverYear == null ? 'neutral' : stage.yearOverYear >= 0 ? 'positive' : 'negative';
        var topWidth = 100 - index * widthStep;
        var bottomWidth = 100 - (index + 1) * widthStep;
        var leftTop = (100 - topWidth) / 2;
        var rightTop = 100 - leftTop;
        var leftBottom = (100 - bottomWidth) / 2;
        var rightBottom = 100 - leftBottom;
        var href = routeHash(routeWith(route, { module: 'period', view: 'chain', params: { stage: stage.node.stage_id } }));
        return '<a class="quota-funnel-stage stage-tone-' + (index + 1) + ' ' + h(stage.tone) + '" role="listitem" href="' +
          h(href) + '" data-funnel-stage="' + h(stage.node.stage_id) + '" aria-label="' +
          h(stage.label + ' ' + formatPlain(stage.count, 'students') + '人，占总配额 ' + exactShare) + '">' +
          '<span class="quota-funnel-share">' + h(exactShare) + '</span><span class="quota-funnel-visual">' +
          '<span class="quota-funnel-shape" style="--funnel-left-top:' + h(leftTop.toFixed(2)) +
          '%;--funnel-right-top:' + h(rightTop.toFixed(2)) + '%;--funnel-left-bottom:' +
          h(leftBottom.toFixed(2)) + '%;--funnel-right-bottom:' + h(rightBottom.toFixed(2)) + '%"></span>' +
          '<span class="quota-funnel-value"><strong>' + copy(stage.label) + '</strong> <b>' +
          h(formatPlain(stage.count, 'students')) + '人</b></span></span>' +
          '<span class="quota-funnel-yoy ' + h(yearOverYearClass) + '">' + h(yearOverYearText) + '</span></a>';
      }).join('') + '</div>';
  }

  function segmentedFunnel(route, dimension) {
    var nodes = funnelNodes(route, dimension);
    var groups = { activation: [], learning: [], conversion: [] };
    nodes.forEach(function (node) { groups[funnelGroup(node)].push(node); });
    var definitions = [
      { id: 'activation', title: '规模与触达', subtitle: '目标规模 → 实际规模 → 加好友 → 进群 → 开口' },
      { id: 'learning', title: '学习与参与', subtitle: '主课观看 → 作业与互动 → 直播到课 → 直播完课' },
      { id: 'conversion', title: '转化与结果', subtitle: '订金 → 全款 → 有效订单' }
    ];
    var sections = definitions.map(function (definition) {
      var rows = groups[definition.id];
      if (!rows.length) return '';
      return '<section class="section"><div class="card">' + sectionHead(definition.title, definition.subtitle) +
        '<div class="daily-metrics">' + rows.map(function (node, index) {
          return funnelNodeCard(node, index ? rows[index - 1] : null, route, false);
        }).join('') + '</div></div></section>';
    }).join('');
    if (sections) return sections;
    return '<section class="section"><div class="card copper"><h3>' + copy(themeFor(route.day).title) + '</h3><p>' +
      copy(themeFor(route.day).focus + ' 本页只呈现当前时点已经发生的经营环节，并把首要动作落实到负责人和验收指标。') + '</p></div></section>';
  }

  function directClassValue(row, metricId) {
    var keys = {
      revenue: ['revenue', 'actual_revenue', 'official_revenue'],
      students: ['students', 'student_count', 'actual_student_count'],
      ltv: ['ltv', 'class_ltv', 'official_ltv_actual_students'],
      orders: ['orders', 'order_count', 'paid_unit_count'],
      add_friend_rate: ['add_friend_rate'], in_group_rate: ['in_group_rate'], opened_rate: ['opened_rate']
    }[metricId] || [metricId];
    return firstNumber(row, keys);
  }

  function classRows(route) {
    var metadata = list('classes').filter(function (row) {
      return String(row.period_id) === String(route.period) && (!row.day_key || row.day_key === route.day);
    });
    var groupedFacts = {};
    FACTS.filter(function (fact) {
      return String(fact.period_id) === String(route.period) && fact.day_key === route.day && fact.dimension_type === 'class' && /^actual_/.test(fact.value_kind);
    }).forEach(function (fact) {
      groupedFacts[fact.dimension_id] = groupedFacts[fact.dimension_id] || {};
      groupedFacts[fact.dimension_id][fact.metric_id] = fact.value;
    });
    var identifiers = metadata.map(function (row) { return row.dimension_id || row.class_id || row.class_code || row.class_name; });
    Object.keys(groupedFacts).forEach(function (identifier) { if (!identifiers.includes(identifier)) identifiers.push(identifier); });
    return identifiers.map(function (identifier) {
      var row = metadata.find(function (item) {
        return (item.dimension_id || item.class_id || item.class_code || item.class_name) === identifier;
      }) || {};
      var facts = groupedFacts[identifier] || {};
      var directAllowed = route.day === 'all' || route.day === 'cutoff' || row.day_key === route.day;
      var fallbackName = String(identifier).replace(String(route.period) + '-', '').replace(/_/g, ' ');
      return {
        id: identifier,
        name: cleanCopy(row.class_name || row.label || row.name || fallbackName),
        revenue: facts.revenue != null ? facts.revenue : directAllowed ? directClassValue(row, 'revenue') : null,
        students: facts.students != null ? facts.students : directAllowed ? directClassValue(row, 'students') : null,
        ltv: facts.ltv != null ? facts.ltv : directAllowed ? directClassValue(row, 'ltv') : null,
        orders: facts.orders != null ? facts.orders : directAllowed ? directClassValue(row, 'orders') : null,
        addFriend: facts.add_friend_rate != null ? facts.add_friend_rate : directAllowed ? directClassValue(row, 'add_friend_rate') : null,
        inGroup: facts.in_group_rate != null ? facts.in_group_rate : directAllowed ? directClassValue(row, 'in_group_rate') : null,
        opened: facts.opened_rate != null ? facts.opened_rate : directAllowed ? directClassValue(row, 'opened_rate') : null,
        evidence: row.evidence_status
      };
    });
  }

  function classTable(route, options) {
    options = options || {};
    var rows = classRows(route);
    var hasValues = rows.some(function (row) {
      return row.revenue != null || row.students != null || row.ltv != null || row.orders != null;
    });
    rows.sort(function (a, b) {
      var key = options.sort || 'revenue';
      return (finite(b[key]) || 0) - (finite(a[key]) || 0);
    });
    if (options.limit) rows = rows.slice(0, options.limit);
    if (!rows.length) {
      return '<div class="context-note"><strong>班级按当前营期与时点管理</strong><p>' +
        copy(themeFor(route.day).focus + ' 班级页会把贡献、目标偏差和跟进动作放在同一视图中。') + '</p></div>';
    }
    if (!hasValues) {
      return '<div class="quality-list">' + rows.slice(0, options.limit || 8).map(function (row, index) {
        return '<div class="quality-row"><strong>' + (index + 1) + '. ' + copy(row.name) + '</strong><p>' +
          copy(contextLabel(route) + '聚焦' + themeFor(route.day).title + '，按同一时点复盘班级贡献与动作。') + '</p></div>';
      }).join('') + '</div>';
    }
    return '<div class="data-table-wrap"><table class="data-table"><thead><tr><th>排名</th><th>班级</th>' +
      '<th>营收</th><th>学员</th><th>LTV</th><th>折算订单</th></tr></thead><tbody>' + rows.map(function (row, index) {
      var detail = routeAnchor(route, { module: 'people', view: 'class-detail', params: { class: row.id } },
        '<strong>' + copy(row.name) + '</strong>', 'data-class-link="' + h(row.id) + '"', '');
      return '<tr data-class-row="' + h(row.id) + '"><td><span class="rank">' + (index + 1) + '</span></td><td>' + detail +
        '</td><td>' + h(row.revenue == null ? '—' : formatPlain(row.revenue, 'revenue') + '元') + '</td><td>' +
        h(row.students == null ? '—' : formatPlain(row.students, 'students') + '人') + '</td><td>' +
        h(row.ltv == null ? '—' : formatPlain(row.ltv, 'ltv') + '元/人') + '</td><td>' +
        h(row.orders == null ? '—' : formatPlain(row.orders, 'orders')) + '</td></tr>';
    }).join('') + '</tbody></table></div>';
  }

  function homeDataBadge(route, label) {
    var period = C.periodInfo(route.period) || {};
    if (period.mode === 'fixture') return '<span class="tag assumed" data-status="assumed">示例</span>';
    return '<span class="tag positive">' + copy(label) + '</span>';
  }

  function homeActivationFunnel(route) {
    var rows = classRows(routeWith(route, { day: 'all' }));
    var definitions = [
      { label: '加好友', key: 'addFriend' },
      { label: '进群', key: 'inGroup' },
      { label: '开口', key: 'opened', copper: true }
    ];
    return '<div class="progress-list">' + definitions.map(function (definition) {
      var eligible = rows.filter(function (row) {
        return finite(row.students) != null && finite(row[definition.key]) != null;
      });
      var total = eligible.reduce(function (sum, row) { return sum + finite(row.students); }, 0);
      var weighted = eligible.reduce(function (sum, row) {
        return sum + finite(row.students) * finite(row[definition.key]);
      }, 0);
      var rate = total > 0 ? weighted / total : 0;
      return '<div class="progress-row"><label>' + copy(definition.label) + '</label><div class="progress-track">' +
        '<div class="progress-fill ' + (definition.copper ? 'copper' : '') + '" style="width:' +
        Math.max(4, Math.min(100, rate * 100)).toFixed(1) + '%"></div></div><strong>' +
        copy(formatPlain(rate, 'opened_rate')) + '</strong></div>';
    }).join('') + '</div>';
  }

  function matureHomeSection(route) {
    return '<section class="section dashboard-grid mature-home-grid">' +
      '<article class="card span-7"><div class="card-title"><span class="eyebrow">每日经营三指标</span>' +
      homeDataBadge(route, '逐日实际') + '</div><div class="chart-wrap daily-trend-wrap">' +
      dailyOperatingTrendChart(route) +
      '</div><p class="chart-caption">当日新增LTV看价值峰值；选修作业率与到课率看学习参与，切换营期或经营日后同步更新。</p></article>' +
      '<article class="card span-5 quota-funnel-card"><div class="card-title"><span class="eyebrow">总配额占比漏斗</span>' +
      homeDataBadge(route, '统一分母') + '</div>' + quotaShareFunnel(route) + '</article>' +
      '<article class="card span-8"><div class="card-title"><span class="eyebrow">班级营收前五</span>' +
      homeDataBadge(route, '聚合数据') + '</div>' + classTable(routeWith(route, { day: 'all' }), { limit: 5 }) + '</article>' +
      '<article class="card span-4 home-ask-card"><div class="card-title"><span class="eyebrow">数据问答</span>' +
      '<span class="tag positive">6类已支持</span></div><h3>直接问经营问题</h3>' +
      '<p class="metric-note">问LTV、直播、主课、未达标日期、班级差异或示例数据。</p>' +
      routeAnchor(route, { module: 'ask', view: 'recommended', params: {} }, '进入问数据', '', 'button subtle') +
      '</article></section>';
  }

  function breakdownMarkup(metricId, route) {
    if (['revenue', 'orders', 'ltv', 'students'].includes(metricId)) {
      return '<div class="card"><div class="card-title"><span class="eyebrow">班级拆解</span></div>' + classTable(route, { limit: 6 }) + '</div>';
    }
    var dimensionFacts = FACTS.filter(function (fact) {
      return String(fact.period_id) === String(route.period) && fact.day_key === route.day && fact.metric_id === metricId &&
        fact.dimension_type !== 'all' && /^actual_/.test(fact.value_kind);
    });
    if (dimensionFacts.length) {
      dimensionFacts.sort(function (a, b) { return finite(b.value) - finite(a.value); });
      return '<div class="card"><div class="card-title"><span class="eyebrow">经营拆解</span></div><div class="progress-list">' +
        dimensionFacts.slice(0, 8).map(function (fact, index) {
          return '<div class="progress-row"><label>' + copy(fact.dimension_name || fact.dimension_id) + '</label><div class="progress-track">' +
            '<div class="progress-fill ' + (index ? 'copper' : '') + '" style="width:' +
            Math.max(4, Math.min(100, isRateMetric(metricId) ? finite(fact.value) * 100 : 100 - index * 9)) + '%"></div></div><strong>' +
            copy(formatPlain(fact.value, metricId)) + '</strong></div>';
        }).join('') + '</div></div>';
    }
    return '<div class="card copper"><div class="card-title"><span class="eyebrow">经营线索</span></div><h3>' +
      copy(themeFor(route.day).title) + '</h3><p class="metric-note">' + copy(riskSentence(route)) + '</p><p class="metric-note">' +
      copy(themeFor(route.day).action) + '</p></div>';
  }

  function renderMetricDetail(metricId, route, title) {
    var mode = route.params.mode || (route.day === 'all' || route.day === 'cutoff' || metricId === 'ltv' ? 'cumulative' : 'daily');
    var readout = readoutFor(metricId, route, { mode: mode });
    var actual = factForReadout(readout);
    if (!actual) {
      return '<div class="detail-page"><section class="detail-section">' +
        sectionHead(title + ' · ' + themeFor(route.day).title, contextLabel(route) + '只呈现本时点适用的经营内容') +
        '<div class="card copper"><h3>' + copy(themeFor(route.day).focus) + '</h3><p>' + copy(themeFor(route.day).risk) +
        '</p></div></section><section class="detail-section">' + sectionHead('当前动作', '指标回到适用时点后会自动进入完整详情') +
        actionCards(route, metricId) + '</section></div>';
    }
    var target = targetFor(readout, actual);
    var comparison = comparisonFor(readout, actual);
    var previous = previousDayFor(readout, actual);
    var points = trendPoints(metricId, route, mode);
    var modeControl = '<div class="segmented"><button type="button" data-chart-mode="daily" class="' +
      (mode === 'daily' ? 'active' : '') + '">当日</button><button type="button" data-chart-mode="cumulative" class="' +
      (mode === 'cumulative' ? 'active' : '') + '">累计</button></div>';
    return '<div class="detail-page"><section class="detail-section" data-detail-section="current">' +
      sectionHead(title + '详情', contextLabel(route) + ' · ' + (mode === 'cumulative' ? '累计' : '当日'), modeControl) +
      '<div class="detail-fact-grid">' +
      detailFact('实际', valueMarkup(actual.value, metricId), themeFor(route.day).title, exampleTag(readout, actual)) +
      detailFact('目标', target ? valueMarkup(target.value, metricId) : '阶段目标管理', target ? '与当前时点对齐' : '按经营日历推进') +
      detailFact('达成', achievementText(readout, actual, target), target ? '实际与目标同页核对' : '按阶段进度观察') +
      '</div></section><section class="detail-section" data-detail-section="comparison">' +
      sectionHead('同期与前日', '比较对象随当前营期和时点同步变化') +
      '<div class="comparison-strip"><div class="comparison-cell"><span>' + copy(previousPeriodLabel(route)) + '</span><strong>' +
      copy(deltaText(comparison, metricId)) + '</strong></div><div class="comparison-cell"><span>前日变化</span><strong>' +
      copy(previous ? deltaText(previous, metricId) : route.day === 'D1' ? '首日建立基线' : '按当前时点观察') +
      '</strong></div><div class="comparison-cell"><span>当前时点</span><strong>' + copy(dayInfo(route.day).label) +
      '</strong></div></div></section><section class="detail-section">' +
      sectionHead('趋势与拆解', '日值、累计值和业务维度分别呈现') +
      '<div class="detail-analysis"><div class="card"><div class="card-title"><span class="eyebrow">' +
      copy(metricName(metricId) + (mode === 'cumulative' ? '累计趋势' : '当日趋势')) + '</span>' + exampleTag(readout, actual) +
      '</div><div class="chart-wrap">' + lineChart(points, metricId) + '</div></div>' + breakdownMarkup(metricId, route) +
      '</div></section><section class="detail-section" data-detail-section="action">' +
      sectionHead('下一步动作', '责任角色、执行时点和验收方向保持清晰') + actionCards(route, metricId) + '</section></div>';
  }

  function renderHome(route) {
    var ltvReadout = readoutFor('ltv', route, { mode: 'cumulative' });
    var cacReadout = readoutFor('cac', route, { mode: 'cumulative' });
    var ltv = factForReadout(ltvReadout);
    var cac = factForReadout(cacReadout);
    var ratio = ltv && cac && finite(cac.value) > 0 ? finite(ltv.value) / finite(cac.value) : null;
    return '<div data-view="home"><section class="hero-grid"><div><div class="metric-bridge">' +
      metricCard('ltv', route, { home: true, hero: true, className: 'ltv' }) +
      '<div class="bridge-core"><div><span>LTV/CAC</span><strong>' + copy(ratio == null ? '随整期结算' : ratio.toFixed(2)) +
      '</strong></div></div>' + metricCard('cac', route, { home: true, hero: true, className: 'cac' }) +
      '</div><div class="kpi-grid">' + metricCard('revenue', route, { home: true }) +
      metricCard('students', route, { home: true }) + metricCard('cost', route, { home: true }) +
      '</div></div><aside class="card judgement-panel"><div><span class="eyebrow">领导判断</span><h3>' +
      copy(contextLabel(route) + '先处理最关键的一件事') + '</h3></div><div class="judgement-list">' +
      '<div class="judgement-item"><span class="judgement-dot"></span><div><strong>当前结果</strong><p>' +
      copy(resultSentence(route, false)) + '</p></div></div>' +
      '<div class="judgement-item warning"><span class="judgement-dot"></span><div><strong>最大风险</strong><p>' +
      copy(riskSentence(route)) + '</p></div></div>' +
      '<div class="judgement-item"><span class="judgement-dot"></span><div><strong>立即动作</strong><p>' +
      copy(themeFor(route.day).action) + '</p></div></div></div></aside></section>' +
      matureHomeSection(route) +
      '<section class="section dashboard-grid"><article class="card span-7"><div class="card-title"><span class="eyebrow">当前主题</span></div>' +
      '<h3>' + copy(themeFor(route.day).title) + '</h3><p class="metric-note">' + copy(themeFor(route.day).focus) + '</p>' +
      routeAnchor(route, { module: 'period', view: 'daily', params: {} }, '进入每日经营', '', 'button subtle') +
      '</article><article class="card span-5"><div class="card-title"><span class="eyebrow">经营追问</span></div>' +
      '<h3>沿当前营期和时点继续分析</h3><p class="metric-note">实际、目标、达成、同期和前日会与页面保持一致。</p>' +
      routeAnchor(route, { module: 'ask', view: 'recommended', params: {} }, '进入问数据', '', 'button subtle') +
      '</article></section></div>';
  }

  function renderPeriods(route) {
    return '<section>' + sectionHead('营期列表', contextLabel(route) + '下查看 601-607 各期状态与当前时点结果') +
      '<div class="card period-list">' + selectablePeriods().map(function (period) {
        var periodRoute = routeWith(route, { period: period.period_id });
        var summary = resultSentence(periodRoute, true);
        return '<a class="period-row" href="' + h(routeHash(periodRoute)) + '" data-period-row="' + h(period.period_id) + '"><strong>' +
          copy(period.period_id + '期') + '</strong><p>' + copy(summary) + '</p><span class="tag positive">进入</span></a>';
      }).join('') + '</div></section>';
  }

  function renderAlerts(route) {
    var risk = riskReadout(route);
    var nodes = funnelNodes(route);
    var biggestDrop = null;
    nodes.forEach(function (node, index) {
      if (!index || nodes[index - 1].funnel_id !== node.funnel_id) return;
      var previous = FACT_BY_ID[nodes[index - 1].count_fact_id];
      var current = FACT_BY_ID[node.count_fact_id];
      if (!previous || !current) return;
      var drop = finite(previous.value) - finite(current.value);
      if (!biggestDrop || drop > biggestDrop.drop) biggestDrop = { drop: drop, node: node };
    });
    var cards = [
      { title: '结果偏差', text: risk ? metricName(risk.actual.metric_id) + '达成 ' + formatPlain(risk.rate, 'achievement_rate') + '，优先核对目标差距。' : riskSentence(route) },
      { title: '链路掉点', text: biggestDrop ? stageLabel(biggestDrop.node) + '环节流失 ' + formatPlain(biggestDrop.drop, 'students') + '人，先处理该段承接。' : themeFor(route.day).risk },
      { title: '责任动作', text: themeFor(route.day).action }
    ];
    return '<section>' + sectionHead('关键异常', contextLabel(route) + '只保留当前优先级最高的偏差与动作') +
      '<div class="dashboard-grid">' + cards.map(function (card, index) {
        return '<article class="card span-4 ' + (index === 0 ? 'copper' : '') + '"><span class="eyebrow">' +
          copy(card.title) + '</span><h3>' + copy(index === 2 ? '执行到人、到时点、到验收' : card.title + '需要处理') +
          '</h3><p class="metric-note">' + copy(card.text) + '</p></article>';
      }).join('') + '</div></section>';
  }

  function renderPeriodOverview(route) {
    var theme = themeFor(route.day);
    var dayProgress = route.day === 'all' || route.day === 'cutoff' ? 100 : route.day === 'pre' ? 0 : Math.round(Number(route.day.slice(1)) / 11 * 100);
    var cards = contextReadouts(route, theme.metrics).slice(0, 4);
    return '<div><section>' + sectionHead(route.period + '期营期概览', dayInfo(route.day).label + ' · 从阶段进度到关键结果') +
      '<div class="daily-hero"><div class="day-summary"><span class="eyebrow">阶段进度 ' + dayProgress + '%</span><h2>' +
      copy(theme.title) + '</h2><p>' + copy(resultSentence(route, true)) + '</p></div><div class="card copper"><div class="card-title">' +
      '<span class="eyebrow">阶段风险</span></div><h3>' + copy(riskSentence(route)) + '</h3><p class="metric-note">' +
      copy(theme.action) + '</p></div></div></section><section class="section">' +
      sectionHead('关键结果', '只呈现当前时点适用的累计结果与目标进度') + '<div class="daily-metrics">' +
      (cards.length ? cards.map(function (item) { return metricCard(item.metricId, route); }).join('') :
        '<div class="card copper"><h3>' + copy(theme.focus) + '</h3><p>' + copy(theme.action) + '</p></div>') +
      '</div></section></div>';
  }

  function renderDaily(route) {
    if (route.day === 'all') return renderPeriodOverview(route);
    if (route.day === 'pre') return renderActivation(route);
    var theme = themeFor(route.day);
    var rows = contextReadouts(route, theme.metrics);
    return '<div data-view="daily"><section class="daily-hero"><div class="day-summary"><span class="eyebrow">' +
      copy(route.period + '期 · ' + theme.stage) + '</span><h2>' + copy(theme.title) + '</h2><p>' +
      copy(resultSentence(route, true)) + '</p></div><div class="card copper"><div class="card-title"><span class="eyebrow">风险与动作</span></div>' +
      '<h3>' + copy(riskSentence(route)) + '</h3><p class="metric-note">' + copy(theme.action) + '</p></div></section>' +
      '<section class="daily-metrics">' + (rows.length ? rows.map(function (item) {
        var mode = item.metricId === 'ltv' ? 'cumulative' : 'daily';
        return metricCard(item.metricId, route, { mode: mode });
      }).join('') : '<div class="card copper"><h3>' + copy(theme.focus) + '</h3><p>' + copy(theme.action) + '</p></div>') +
      '</section><section class="section dashboard-grid"><article class="card span-7"><div class="card-title"><span class="eyebrow">经营趋势</span></div>' +
      '<div class="chart-wrap">' + lineChart(trendPoints(rows[0] ? rows[0].metricId : 'revenue', route, 'daily'), rows[0] ? rows[0].metricId : 'revenue') +
      '</div></article><article class="card span-5"><div class="card-title"><span class="eyebrow">本日执行</span></div>' +
      actionCards(route, rows[0] && rows[0].metricId) + '</article></section></div>';
  }

  function renderChain(route) {
    return '<div><section>' + sectionHead('完整分段漏斗', contextLabel(route) + ' · 从规模、触达到学习、直播与付款') +
      '<div class="card copper"><h3>' + copy(riskSentence(route)) + '</h3><p class="metric-note">' +
      copy(themeFor(route.day).action) + '</p></div></section>' + segmentedFunnel(route) + '</div>';
  }

  function renderPeriodClasses(route) {
    return '<section>' + sectionHead('班级结果', contextLabel(route) + ' · 看各班对当前结果的贡献与异常') +
      '<div class="dashboard-grid"><article class="card span-8">' + classTable(route) +
      '</article><article class="card copper span-4"><span class="eyebrow">班级经营判断</span><h3>' +
      copy(themeFor(route.day).title) + '</h3><p class="metric-note">' + copy(riskSentence(route)) + '</p><p class="metric-note">' +
      copy(themeFor(route.day).action) + '</p></article></div></section>';
  }

  function renderPeriodStudents(route) {
    var readout = readoutFor('students', route);
    var actual = factForReadout(readout);
    var target = targetFor(readout, actual);
    var activationNodes = funnelNodes(route).filter(function (node) { return funnelGroup(node) === 'activation'; });
    var activationMarkup = activationNodes.length ? '<div class="daily-metrics">' + activationNodes.map(function (node, index) {
      return funnelNodeCard(node, index ? activationNodes[index - 1] : null, route, false);
    }).join('') + '</div>' : '<div class="context-note"><strong>' + copy(themeFor(route.day).title) + '</strong><p>' +
      copy(themeFor(route.day).focus + ' 规模页只保留当前时点已经发生的触达环节。') + '</p></div>';
    return '<div><section>' + sectionHead('学员规模', contextLabel(route) + ' · 目标规模、有效基数与阶段变化') +
      '<div class="detail-fact-grid">' +
      detailFact('当前规模', actual ? valueMarkup(actual.value, 'students') : '规模基数', themeFor(route.day).focus, exampleTag(readout, actual)) +
      detailFact('阶段目标', target ? valueMarkup(target.value, 'students') : '按营期目标管理', target ? '与当前时点对齐' : '本时点聚焦经营动作') +
      detailFact('阶段变化', actual ? deltaText(previousDayFor(readout, actual), 'students') : '随时点更新', themeFor(route.day).title) +
      '</div></section><section class="section dashboard-grid"><article class="card span-7">' +
      sectionHead('规模与触达', '规模进入好友、进群与开口后的阶段表现') + activationMarkup +
      '</article><article class="card copper span-5"><h3>' + copy(riskSentence(route)) + '</h3><p>' +
      copy(themeFor(route.day).action) + '</p></article></section></div>';
  }

  function renderPeriodLearning(route) {
    var metrics = ['main_course_rate', 'daily_question_rate', 'homework_rate', 'live_attendance_rate', 'live_completion_rate'];
    var rows = contextReadouts(route, metrics);
    return '<section>' + sectionHead('学习表现', contextLabel(route) + ' · 课程、作业、互动与直播的阶段汇总') +
      '<div class="daily-metrics">' + (rows.length ? rows.map(function (item) { return metricCard(item.metricId, route); }).join('') :
        '<div class="card copper"><h3>' + copy(themeFor(route.day).title) + '</h3><p>' + copy(themeFor(route.day).focus) + '</p></div>') +
      '</div><div class="section card"><div class="card-title"><span class="eyebrow">学习经营线索</span></div><p>' +
      copy(riskSentence(route)) + '</p><p>' + copy(themeFor(route.day).action) + '</p></div></section>';
  }

  function renderPeriodFinance(route) {
    var metrics = ['revenue', 'orders', 'ltv', 'cac', 'cost'];
    var rows = contextReadouts(route, metrics);
    return '<section>' + sectionHead('财务结果', contextLabel(route) + ' · 钱的结果、节奏与效率') +
      '<div class="daily-metrics">' + (rows.length ? rows.map(function (item) {
        return metricCard(item.metricId, route, { mode: item.metricId === 'revenue' || item.metricId === 'orders' || item.metricId === 'ltv' ? 'cumulative' : undefined });
      }).join('') : '<div class="card copper"><h3>' + copy(themeFor(route.day).title) + '</h3><p>' + copy(themeFor(route.day).focus) + '</p></div>') +
      '</div><div class="section card copper"><h3>' + copy(riskSentence(route)) + '</h3><p>' + copy(themeFor(route.day).action) +
      '</p></div></section>';
  }

  function renderComparison(route) {
    var rows = contextReadouts(route, ['ltv', 'revenue', 'orders', 'students', 'cac', 'cost', 'main_course_rate', 'daily_question_rate']).map(function (item) {
      return { item: item, comparison: comparisonFor(item.readout, item.actual) };
    }).filter(function (row) { return row.comparison; });
    return '<section>' + sectionHead('营期对比', contextLabel(route) + '对比' + previousPeriodLabel(route) + '，全部对齐同一阶段') +
      (rows.length ? '<div class="data-table-wrap"><table class="data-table"><thead><tr><th>指标</th><th>当前实际</th><th>' +
        copy(previousPeriodLabel(route)) + '</th><th>变化</th><th>动作</th></tr></thead><tbody>' + rows.map(function (row) {
          var baseline = firstNumber(row.comparison, ['baseline', 'baseline_value', 'previous']);
          return '<tr><td><strong>' + copy(metricName(row.item.metricId)) + '</strong></td><td>' +
            copy(formatPlain(row.item.actual.value, row.item.metricId)) + '</td><td>' +
            copy(baseline == null ? '同阶段已纳入' : formatPlain(baseline, row.item.metricId)) + '</td><td>' +
            copy(deltaText(row.comparison, row.item.metricId)) + '</td><td>' + copy(themeFor(route.day).action) + '</td></tr>';
        }).join('') + '</tbody></table></div>' : '<div class="card copper"><h3>' + copy(resultSentence(route, true)) +
        '</h3><p>' + copy(themeFor(route.day).risk + ' ' + themeFor(route.day).action) + '</p></div>') + '</section>';
  }

  function renderClassRanking(route) {
    return '<section>' + sectionHead('班级排行', contextLabel(route) + ' · 按贡献、达成和结构识别领先与落后班级') +
      '<div class="card">' + classTable(route) + '</div><div class="section card copper"><h3>排行用于定位复盘对象</h3><p>' +
      copy(themeFor(route.day).focus + ' 点击班级可进入当前营期、当前时点的聚合详情。') + '</p></div></section>';
  }

  function renderStudentAnalysis(route) {
    var nodes = funnelNodes(route).filter(function (node) { return funnelGroup(node) === 'activation' || funnelGroup(node) === 'learning'; });
    return '<section>' + sectionHead('学员分析', contextLabel(route) + ' · 看规模、激活与学习阶段如何流转') +
      '<div class="card">' + (nodes.length ? '<div class="daily-metrics">' + nodes.slice(0, 8).map(function (node, index) {
        return funnelNodeCard(node, index ? nodes[index - 1] : null, route, false);
      }).join('') + '</div>' : '<div class="context-note"><strong>' + copy(themeFor(route.day).title) + '</strong><p>' +
        copy(themeFor(route.day).focus + ' 本页只保留聚合阶段，不展开个人记录。') + '</p></div>') +
      '</div><div class="section card copper"><h3>' + copy(riskSentence(route)) + '</h3><p>' + copy(themeFor(route.day).action) +
      '</p></div></section>';
  }

  function renderActivation(route) {
    var activeRoute = route.day === 'pre' || route.day === 'all' ? route : route;
    var nodes = funnelNodes(activeRoute).filter(function (node) { return funnelGroup(node) === 'activation'; });
    return '<section>' + sectionHead('激活漏斗', contextLabel(route) + ' · 规模、好友、进群、开口与首课') +
      '<div class="dashboard-grid"><article class="card span-8">' + (nodes.length ? '<div class="daily-metrics">' +
        nodes.map(function (node, index) { return funnelNodeCard(node, index ? nodes[index - 1] : null, route, false); }).join('') +
        '</div>' : '<div class="context-note"><strong>' + copy(themeFor(route.day).title) + '</strong><p>' +
        copy(themeFor(route.day).focus + ' 激活页随当前时点只保留已经发生的步骤。') + '</p></div>') +
      '</article><article class="card copper span-4"><span class="eyebrow">当前掉点</span><h3>' +
      copy(riskSentence(route)) + '</h3><p>' + copy(themeFor(route.day).action) + '</p></article></div></section>';
  }

  function renderLearningOverview(route) {
    var metrics = ['main_course_rate', 'daily_question_rate', 'homework_rate'];
    var rows = contextReadouts(route, metrics);
    var primaryMetric = rows[0] ? rows[0].metricId : 'main_course_rate';
    return '<section>' + sectionHead('学习总览', contextLabel(route) + ' · 整体学习健康度、核心掉点与后续动作') +
      '<div class="daily-metrics">' + (rows.length ? rows.map(function (item) { return metricCard(item.metricId, route); }).join('') :
        '<div class="card copper"><h3>' + copy(themeFor(route.day).title) + '</h3><p>' + copy(themeFor(route.day).focus) + '</p></div>') +
      '</div><div class="section dashboard-grid"><article class="card span-7"><div class="card-title"><span class="eyebrow">学习趋势</span></div>' +
      '<div class="chart-wrap">' + lineChart(trendPoints(primaryMetric, route, 'daily'), primaryMetric) + '</div></article>' +
      '<article class="card copper span-5"><h3>' + copy(riskSentence(route)) + '</h3><p>' + copy(themeFor(route.day).action) +
      '</p></article></div></section>';
  }

  function renderLive(route) {
    var attendance = readoutFor('live_attendance_rate', route, { mode: 'daily' });
    var completion = readoutFor('live_completion_rate', route, { mode: 'daily' });
    var rows = [attendance, completion].filter(Boolean);
    if (!rows.length) {
      return '<section>' + sectionHead('直播表现', contextLabel(route) + ' · 直播组件只随本时点真实安排出现') +
        '<div class="card copper"><h3>' + copy(themeFor(route.day).title) + '</h3><p>' +
        copy(themeFor(route.day).focus + ' 当前页面把经营注意力留给本时点应处理的学习或转化任务。') +
        '</p><p>' + copy(themeFor(route.day).action) + '</p></div></section>';
    }
    return '<section>' + sectionHead('直播表现', contextLabel(route) + ' · 到课、完课与场次趋势') +
      '<div class="daily-metrics">' + rows.map(function (readout) {
        var actual = factForReadout(readout);
        return metricCard(actual.metric_id, route, { mode: 'daily' });
      }).join('') + '</div><div class="section dashboard-grid"><article class="card span-7"><div class="card-title">' +
      '<span class="eyebrow">场次趋势</span></div><div class="chart-wrap">' +
      lineChart(trendPoints('live_attendance_rate', route, 'daily'), 'live_attendance_rate') + '</div></article>' +
      '<article class="card copper span-5"><h3>' + copy(riskSentence(route)) + '</h3><p>' +
      copy(themeFor(route.day).action) + '</p></article></div></section>';
  }

  function renderEfficiency(route) {
    var ltvReadout = readoutFor('ltv', route, { mode: 'cumulative' });
    var cacReadout = readoutFor('cac', route, { mode: 'cumulative' });
    var ltv = factForReadout(ltvReadout);
    var cac = factForReadout(cacReadout);
    if (!ltv || !cac || finite(cac.value) <= 0) {
      return '<section>' + sectionHead('经营效率', contextLabel(route) + ' · LTV/CAC 随整期结算时点呈现') +
        '<div class="card copper"><h3>' + copy(themeFor(route.day).title) + '</h3><p>' +
        copy(themeFor(route.day).focus + ' 当前时点先处理适用的经营结果，效率关系在整期或截单时点完整展开。') +
        '</p><p>' + copy(themeFor(route.day).action) + '</p></div></section>';
    }
    var ratio = finite(ltv.value) / finite(cac.value);
    var higherValue = ratio * 1.1;
    var lowerValue = ratio * 0.9;
    return '<section>' + sectionHead('经营效率', contextLabel(route) + ' · LTV/CAC 关系、趋势与敏感性') +
      '<div class="detail-fact-grid">' + detailFact('LTV/CAC', ratio.toFixed(2), '当前价值与获客成本的关系', exampleTag(ltvReadout, ltv)) +
      detailFact('改善情景', higherValue.toFixed(2), '价值提高或成本下降 10%') +
      detailFact('承压情景', lowerValue.toFixed(2), '价值下降或成本提高 10%') +
      '</div><div class="section dashboard-grid"><article class="card span-7"><h3>效率拆解</h3><p>LTV ' +
      copy(formatPlain(ltv.value, 'ltv') + '元/人') + '，CAC ' + copy(formatPlain(cac.value, 'cac') + '元/人') +
      '，两项均随当前营期和时点更新。</p></article><article class="card copper span-5"><h3>' +
      copy(riskSentence(route)) + '</h3><p>' + copy(themeFor(route.day).action) + '</p></article></div></section>';
  }

  function renderClassDetail(route) {
    var rows = classRows(route);
    var requested = String(route.params.class || '');
    var row = rows.find(function (item) { return String(item.id) === requested; });
    if (!row) {
      return '<section>' + sectionHead('班级排行', contextLabel(route) + ' · 当前班级对象已随营期切换') +
        '<div class="card"><p>请选择当前营期中的班级继续查看贡献、学习、财务与动作。</p>' + classTable(route) + '</div></section>';
    }
    var cards = [
      { label: '班级营收', value: row.revenue, metric: 'revenue' },
      { label: '班级学员', value: row.students, metric: 'students' },
      { label: '班级LTV', value: row.ltv, metric: 'ltv' }
    ].filter(function (item) { return item.value != null; });
    var touchRows = [
      { label: '加好友', value: row.addFriend }, { label: '进群', value: row.inGroup }, { label: '开口', value: row.opened }
    ].filter(function (item) { return item.value != null; });
    var touchMarkup = touchRows.length ? '<div class="progress-list">' + touchRows.map(function (item, index) {
      return '<div class="progress-row"><label>' + copy(item.label) + '</label><div class="progress-track"><div class="progress-fill ' +
        (index ? 'copper' : '') + '" style="width:' + Math.max(4, Math.min(100, finite(item.value) * 100)) +
        '%"></div></div><strong>' + copy(formatPlain(item.value, 'stage_rate')) + '</strong></div>';
    }).join('') + '</div>' : '<div class="context-note"><strong>' + copy(themeFor(route.day).title) + '</strong><p>' +
      copy(themeFor(route.day).focus + ' 班级触达与学习只按当前时点呈现。') + '</p></div>';
    return '<div><section>' + sectionHead(row.name + '详情', contextLabel(route) + ' · 目标、实际、漏斗、学习、财务与动作') +
      '<div class="detail-fact-grid">' + (cards.length ? cards.map(function (item) {
        return detailFact(item.label, valueMarkup(item.value, item.metric), '当前营期当前时点聚合');
      }).join('') : detailFact('当前任务', copy(themeFor(route.day).title), themeFor(route.day).focus)) +
      '</div></section><section class="section dashboard-grid"><article class="card span-7"><div class="card-title">' +
      '<span class="eyebrow">班级触达与学习</span></div>' + touchMarkup +
      '</article><article class="card copper span-5"><h3>' + copy(riskSentence(route)) + '</h3><p>' +
      copy(themeFor(route.day).action) + '</p></article></section></div>';
  }

  var QUESTION_EXAMPLES = [
    '当前营收与目标差多少？', '当前 LTV 达成怎样？', 'D4 直播到课率与目标差多少？',
    '主课学习率较前日如何？', '当前漏斗最大掉点在哪里？', '哪个班级贡献领先？'
  ];

  function questionContext(question, route) {
    var text = String(question || '');
    var periodMatch = text.match(/(60[1-7])期?/);
    var dayMatch = text.match(/D(?:1[01]|[1-9])/i);
    var day = dayMatch ? dayMatch[0].toUpperCase() : /开营前/.test(text) ? 'pre' : /截单|最终/.test(text) ? 'cutoff' : /整期/.test(text) ? 'all' : route.day;
    var aliases = [
      { id: 'live_attendance_rate', pattern: /直播.*到课|到课率/ },
      { id: 'live_completion_rate', pattern: /直播.*完课|完课率|有效观看/ },
      { id: 'daily_question_rate', pattern: /每日一问|互动率/ },
      { id: 'main_course_rate', pattern: /主课|学习率/ },
      { id: 'homework_rate', pattern: /作业/ },
      { id: 'ltv', pattern: /LTV|人均价值/i }, { id: 'cac', pattern: /CAC|获客成本/i },
      { id: 'revenue', pattern: /营收|收入/ }, { id: 'orders', pattern: /订单/ },
      { id: 'students', pattern: /学员|规模/ }, { id: 'cost', pattern: /招生费用|投入/ }
    ];
    var metric = aliases.find(function (item) { return item.pattern.test(text); });
    var intent = /漏斗|掉点|哪一步/.test(text) ? 'funnel' : /哪个班|班级.*贡献|班级.*领先|班级.*落后/.test(text) ? 'classes' : 'metric';
    return { period: periodMatch ? periodMatch[1] : route.period, day: day, metricId: metric && metric.id, intent: intent };
  }

  function answerForQuestion(question, route) {
    var context = questionContext(question, route);
    var answerRoute = routeWith(route, { period: context.period, day: context.day });
    if (context.intent === 'funnel') {
      var nodes = funnelNodes(answerRoute);
      var biggestDrop = null;
      nodes.forEach(function (node, index) {
        if (!index || nodes[index - 1].funnel_id !== node.funnel_id) return;
        var previousFact = FACT_BY_ID[nodes[index - 1].count_fact_id];
        var currentFact = FACT_BY_ID[node.count_fact_id];
        if (!previousFact || !currentFact) return;
        var drop = finite(previousFact.value) - finite(currentFact.value);
        if (!biggestDrop || drop > biggestDrop.drop) biggestDrop = { node: node, fact: currentFact, drop: drop };
      });
      if (biggestDrop) {
        var nodeTarget = finite(biggestDrop.node.target_count);
        return {
          period: context.period, day: context.day, supported: true,
          conclusion: contextLabel(answerRoute) + '最大掉点位于' + stageLabel(biggestDrop.node) + '，上一步流失 ' +
            formatPlain(biggestDrop.drop, 'students') + '人。',
          actual: formatPlain(biggestDrop.fact.value, biggestDrop.fact.metric_id) + '人',
          target: nodeTarget == null ? '按当前阶段目标推进' : formatPlain(nodeTarget, biggestDrop.fact.metric_id) + '人',
          achievement: finite(biggestDrop.node.achievement_rate) == null ? '按阶段进度观察' :
            formatPlain(biggestDrop.node.achievement_rate, 'achievement_rate'),
          comparison: previousPeriodLabel(answerRoute) + ' ' + formatPlain(biggestDrop.node.baseline_count, biggestDrop.fact.metric_id) + '人',
          breakdown: '上一步流失 ' + formatPlain(biggestDrop.drop, 'students') + '人，优先处理该段承接。',
          action: themeFor(context.day).action,
          href: routeHash(routeWith(answerRoute, { module: 'period', view: 'chain', params: { stage: biggestDrop.node.stage_id } }))
        };
      }
    }
    if (context.intent === 'classes') {
      var rows = classRows(answerRoute);
      var ranked = rows.filter(function (row) { return row.revenue != null; }).sort(function (a, b) { return finite(b.revenue) - finite(a.revenue); });
      if (ranked.length) {
        var leader = ranked[0];
        return {
          period: context.period, day: context.day, supported: true,
          conclusion: contextLabel(answerRoute) + '当前贡献领先的是' + leader.name + '。',
          actual: '营收 ' + formatPlain(leader.revenue, 'revenue') + '元',
          target: leader.students == null ? '按班级阶段目标推进' : '学员 ' + formatPlain(leader.students, 'students') + '人',
          achievement: leader.ltv == null ? '按当前贡献排序' : 'LTV ' + formatPlain(leader.ltv, 'ltv') + '元/人',
          comparison: '同营期班级贡献排序第 1',
          breakdown: leader.orders == null ? '从触达、学习和付款节奏继续拆解' : '折算订单 ' + formatPlain(leader.orders, 'orders') + '单',
          action: '对照相近规模班级，复盘触达、学习与付款节奏。',
          href: routeHash(routeWith(answerRoute, { module: 'people', view: 'class-detail', params: { class: leader.id } }))
        };
      }
      return {
        period: context.period, day: context.day, supported: true,
        conclusion: contextLabel(answerRoute) + '班级分析已锁定当前营期与时点，本时点先按经营主题推进。',
        actual: rows.length + '个班级对象已完成营期隔离', target: themeFor(context.day).title,
        achievement: '按当前阶段观察', comparison: previousPeriodLabel(answerRoute) + '已纳入同阶段比较',
        breakdown: themeFor(context.day).risk, action: themeFor(context.day).action,
        href: routeHash(routeWith(answerRoute, { module: 'people', view: 'classes', params: {} }))
      };
    }
    if (!context.metricId) {
      return {
        period: context.period, day: context.day, supported: false,
        conclusion: contextLabel(answerRoute) + '当前支持主指标、学习、直播、漏斗与班级聚合问题。',
        actual: '请从推荐问题选择一个经营指标', target: '问题中加入营期、时点和指标会更准确',
        achievement: '支持按目标进度回答', comparison: '支持上一营期与前日比较',
        breakdown: '支持班级、阶段与漏斗拆解', action: themeFor(context.day).action,
        href: routeHash(routeWith(answerRoute, { module: 'overview', view: 'home', params: {} }))
      };
    }
    var readout = readoutFor(context.metricId, answerRoute, { mode: context.metricId === 'ltv' ? 'cumulative' : undefined });
    var actual = factForReadout(readout);
    if (!actual) {
      return {
        period: context.period, day: context.day, supported: false,
        conclusion: contextLabel(answerRoute) + '此指标在当前经营时点不展开，页面已转向本时点核心任务。',
        actual: themeFor(context.day).title, target: themeFor(context.day).focus,
        achievement: '按阶段目标推进', comparison: '当前时点优先', breakdown: riskSentence(answerRoute),
        action: themeFor(context.day).action, href: metricRoute(context.metricId, answerRoute)
      };
    }
    var target = targetFor(readout, actual);
    var comparison = comparisonFor(readout, actual);
    var previous = previousDayFor(readout, actual);
    return {
      period: context.period, day: context.day, supported: true,
      conclusion: resultSentence(answerRoute, true),
      actual: formatPlain(actual.value, context.metricId) + (isRateMetric(context.metricId) ? '' : metricInfo(context.metricId).unit),
      target: target ? formatPlain(target.value, context.metricId) + (isRateMetric(context.metricId) ? '' : metricInfo(context.metricId).unit) : '按阶段目标推进',
      achievement: achievementText(readout, actual, target),
      comparison: previousPeriodLabel(answerRoute) + ' ' + deltaText(comparison, context.metricId) + '；前日 ' +
        (previous ? deltaText(previous, context.metricId) : context.day === 'D1' ? '首日建立基线' : '按当前时点观察'),
      breakdown: riskSentence(answerRoute), action: actionsFor(answerRoute, context.metricId)[0].text,
      href: metricRoute(context.metricId, answerRoute)
    };
  }

  function answerMarkup(answer) {
    var fields = [
      ['实际', answer.actual], ['目标', answer.target], ['达成', answer.achievement],
      ['同期与前日', answer.comparison], ['关键拆解', answer.breakdown], ['建议动作', answer.action]
    ];
    return '<div class="answer-grid"><div class="answer-item conclusion"><span>结论</span><strong>' +
      copy(answer.conclusion) + '</strong></div>' + fields.map(function (field) {
        return '<div class="answer-item"><span>' + copy(field[0]) + '</span><strong>' + copy(field[1]) + '</strong></div>';
      }).join('') + '<div class="answer-item"><span>继续查看</span><strong><a href="' + h(answer.href) + '">进入对应详情</a></strong></div></div>';
  }

  function renderAsk(route) {
    var question = route.params.question || (route.day === 'D4' ? QUESTION_EXAMPLES[2] : QUESTION_EXAMPLES[0]);
    var answer = answerForQuestion(question, route);
    return '<section>' + sectionHead('问数据', contextLabel(route) + ' · 用同一组事实回答经营问题') +
      '<div class="ask-layout"><aside class="card"><div class="card-title"><span class="eyebrow">推荐问题</span></div>' +
      '<div class="question-list">' + QUESTION_EXAMPLES.map(function (item) {
        return '<button type="button" class="question-button" data-question="' + h(item) + '">' + copy(item) + '</button>';
      }).join('') + '</div></aside><div class="card"><div class="ask-box"><input id="ask-input" value="' + h(question) +
      '" aria-label="输入数据问题"><button type="button" id="ask-submit" class="button primary">分析</button></div>' +
      '<div id="ask-answer" data-answer-period="' + h(answer.period) + '" data-answer-day="' + h(answer.day) + '">' +
      answerMarkup(answer) + '</div></div></div></section>';
  }

  function renderDefinitions(route) {
    return '<section>' + sectionHead('数据口径', contextLabel(route) + ' · 指标名称、单位与计算方式') +
      '<div class="card"><div class="data-table-wrap"><table class="data-table"><thead><tr><th>指标</th><th>单位</th><th>计算方式</th></tr></thead><tbody>' +
      list('metric_catalog').map(function (metric) {
        return '<tr><td><strong>' + copy(metric.metric_name || metric.display_name || metric.metric_id) + '</strong></td><td>' +
          copy(metric.unit || '比例') + '</td><td>' + copy(metric.business_definition || metric.formula_label || '按统一经营口径计算') + '</td></tr>';
      }).join('') + '</tbody></table></div></div></section>';
  }

  function renderRaw(route) {
    var rows = FACTS.filter(function (fact) {
      return String(fact.period_id) === String(route.period) && fact.day_key === route.day && fact.dimension_type === 'all';
    }).slice(0, 80);
    return '<section>' + sectionHead('聚合记录', contextLabel(route) + ' · 当前语义事实的只读聚合视图') +
      '<div class="card quality-list">' + rows.map(function (fact) {
        return '<div class="quality-row"><strong>' + copy(metricName(fact.metric_id)) + '</strong><p>' +
          copy(formatPlain(fact.value, fact.metric_id) + (isRateMetric(fact.metric_id) ? '' : metricInfo(fact.metric_id).unit)) + '</p></div>';
      }).join('') + '</div></section>';
  }

  function renderQuality(route) {
    var summary = DATA.status_summary || {};
    return '<section>' + sectionHead('数据质量', contextLabel(route) + ' · 事实完整性与校验结果') +
      '<div class="refresh-status"><div class="refresh-stat"><span>事实</span><strong>' + FACTS.length +
      '</strong></div><div class="refresh-stat"><span>读数</span><strong>' + READOUTS.length +
      '</strong></div><div class="refresh-stat"><span>班级</span><strong>' + classRows(route).length +
      '</strong></div><div class="refresh-stat"><span>漏斗节点</span><strong>' + funnelNodes(route).length +
      '</strong></div></div><div class="section card"><h3>当前校验状态</h3><p>' +
      copy(summary.business_summary || summary.label || '主键、累计、比率、班级汇总和漏斗关系按统一规则校验。') + '</p></div></section>';
  }

  function renderRefresh(route) {
    return '<section>' + sectionHead('数据刷新', contextLabel(route) + ' · 重建、验证与替换流程') +
      '<div class="dashboard-grid"><article class="card span-7"><div class="quality-list">' +
      '<div class="quality-row"><strong>1. 读取</strong><p>读取结构化经营资料与目标。</p></div>' +
      '<div class="quality-row"><strong>2. 校验</strong><p>检查主键、范围、累计、比率和漏斗关系。</p></div>' +
      '<div class="quality-row"><strong>3. 生成</strong><p>生成统一语义包与离线经营页面。</p></div>' +
      '</div></article><article class="card copper span-5"><h3>刷新后先验四项</h3><p>营期、时点、业务路由与问答必须同步更新，再进入经营使用。</p></article></div></section>';
  }

  function renderWorkspace(route) {
    var key = route.module + ':' + route.view;
    var renderers = {
      'overview:home': function () { return renderHome(route); },
      'overview:periods': function () { return renderPeriods(route); },
      'overview:alerts': function () { return renderAlerts(route); },
      'period:overview': function () { return renderPeriodOverview(route); },
      'period:daily': function () { return renderDaily(route); },
      'period:chain': function () { return renderChain(route); },
      'period:classes': function () { return renderPeriodClasses(route); },
      'period:students': function () { return renderPeriodStudents(route); },
      'period:learning': function () { return renderPeriodLearning(route); },
      'period:finance': function () { return renderPeriodFinance(route); },
      'comparison:overview': function () { return renderComparison(route); },
      'people:classes': function () { return renderClassRanking(route); },
      'people:students': function () { return renderStudentAnalysis(route); },
      'people:activation': function () { return renderActivation(route); },
      'people:class-detail': function () { return renderClassDetail(route); },
      'learning:overview': function () { return renderLearningOverview(route); },
      'learning:main-course': function () { return renderMetricDetail('main_course_rate', route, '主课学习'); },
      'learning:daily-question': function () { return renderMetricDetail('daily_question_rate', route, '每日一问'); },
      'learning:live': function () { return renderLive(route); },
      'finance:ltv': function () { return renderMetricDetail('ltv', route, 'LTV'); },
      'finance:cac': function () { return renderMetricDetail('cac', route, 'CAC'); },
      'finance:efficiency': function () { return renderEfficiency(route); },
      'finance:revenue': function () { return renderMetricDetail('revenue', route, '营收'); },
      'finance:orders': function () { return renderMetricDetail('orders', route, '折算订单'); },
      'finance:cost': function () { return renderMetricDetail('cost', route, '招生费用'); },
      'ask:recommended': function () { return renderAsk(route); },
      'tools:definitions': function () { return renderDefinitions(route); },
      'tools:raw': function () { return renderRaw(route); },
      'tools:quality': function () { return renderQuality(route); },
      'tools:refresh': function () { return renderRefresh(route); }
    };
    var renderer = renderers[key] || function () { return renderHome(routeWith(route, { module: 'overview', view: 'home', params: {} })); };
    return '<div data-route-ready="' + h(key) + '" data-period="' + h(route.period) + '" data-day="' + h(route.day) +
      '" data-module="' + h(route.module) + '" data-view-id="' + h(route.view) + '">' + renderer() + '</div>';
  }

  function moduleInfo(moduleId) {
    return PRIMARY_MODULES.find(function (item) { return item.id === moduleId; }) || PRIMARY_MODULES[0];
  }

  function viewInfo(moduleId, viewId) {
    return (CONTEXT_VIEWS[moduleId] || []).find(function (item) { return item.id === viewId; }) || (CONTEXT_VIEWS[moduleId] || [])[0];
  }

  function routeTitle(route) {
    if (route.module === 'people' && route.view === 'class-detail') return '班级详情';
    var view = viewInfo(route.module, route.view);
    return view ? view.label : moduleInfo(route.module).label;
  }

  function storedSidebarState() {
    try {
      var parsed = JSON.parse(localStorage.getItem('v1_5_sidebar_state') || '{}');
      return { global: parsed.global === true, context: parsed.context === true };
    } catch (_) {
      return { global: false, context: false };
    }
  }

  function renderGlobalSidebar(route) {
    return '<aside class="global-sidebar"><div class="brand-row"><div class="brand"><strong>10天</strong><span>点燃孩子内驱力</span></div>' +
      '<button class="side-toggle" type="button" data-toggle="global" aria-label="折叠一级侧栏" title="折叠一级侧栏">‹</button></div>' +
      '<nav class="global-nav" aria-label="一级业务导航">' + PRIMARY_MODULES.map(function (item) {
        var firstView = CONTEXT_VIEWS[item.id][0].id;
        var target = routeWith(route, { module: item.id, view: firstView, params: {} });
        return '<a href="' + h(routeHash(target)) + '" data-primary-module="' + h(item.id) + '" class="' +
          (route.module === item.id ? 'active' : '') + '" aria-label="' + h(item.label) + '" title="' + h(item.label) + '">' +
          '<span class="nav-icon">' + h(item.icon) + '</span><span class="nav-label">' + copy(item.label) + '</span></a>';
      }).join('') + '</nav><div class="side-card"><strong>' + h(route.period) +
      '期</strong>页面版本 V1.5.5<br>' + copy(dayInfo(route.day).label + ' · ' + themeFor(route.day).stage) + '</div></aside>';
  }

  function renderContextSidebar(route) {
    var primary = moduleInfo(route.module);
    var views = CONTEXT_VIEWS[route.module] || [];
    return '<aside class="context-sidebar"><div class="context-heading"><h2>' + copy(primary.label) +
      '</h2><button class="side-toggle" type="button" data-toggle="context" aria-label="折叠二级侧栏" title="折叠二级侧栏">‹</button></div>' +
      '<details class="period-switcher"><summary class="period-select-summary"><span><small>当前营期</small><strong>' +
      h(route.period) + '期</strong></span><span class="period-chevron" aria-hidden="true">⌄</span></summary><div class="period-options">' +
      selectablePeriods().slice().reverse().map(function (period) {
        var target = routeWith(route, { period: period.period_id });
        return '<a class="period-option ' + (String(route.period) === String(period.period_id) ? 'active' : '') +
          '" href="' + h(routeHash(target)) + '" data-period-option="' + h(period.period_id) + '"><span>' +
          h(period.period_id) + '期</span><small>' + copy(dayInfo(route.day).label) + '</small></a>';
      }).join('') + '</div></details><nav class="context-nav" aria-label="二级任务导航">' + views.map(function (item) {
        var target = routeWith(route, { module: route.module, view: item.id, params: {} });
        var active = route.view === item.id || (route.view === 'class-detail' && item.id === 'classes');
        return '<a href="' + h(routeHash(target)) + '" class="' + (active ? 'active' : '') + '" aria-label="' +
          h(item.label) + '" title="' + h(item.label) + '"><span class="nav-icon context-icon">' + h(item.icon) +
          '</span><span class="nav-label">' + copy(item.label) + '</span></a>';
      }).join('') + '</nav><div class="sidebar-meta">' + copy(contextLabel(route) + ' · 页面内容随营期和时点同步更新。') + '</div></aside>';
  }

  function renderTimeline(route) {
    return '<div class="day-timeline-wrap"><nav class="day-timeline" aria-label="营期时点切换">' + visibleDays().map(function (day) {
      var target = routeWith(route, { day: day.day_key });
      return '<a href="' + h(routeHash(target)) + '" class="day-pill ' + (route.day === day.day_key ? 'active' : '') +
        '" data-day-key="' + h(day.day_key) + '">' + copy(day.label || DAY_META[day.day_key].label) + '</a>';
    }).join('') + '</nav></div>';
  }

  function renderApp(route) {
    var period = periodInfo(route.period);
    var state = storedSidebarState();
    var shellClass = 'app-shell' + (state.global ? ' global-collapsed' : '') + (state.context ? ' context-collapsed' : '');
    var dateRange = period.start_date && period.end_date ? period.start_date + ' ~ ' + period.end_date : route.period + '期经营周期';
    var fixtureBadge = period.mode === 'fixture' ?
      ' <span class="tag assumed" data-status="assumed">示例</span>' : '';
    return '<div class="' + shellClass + '">' + renderGlobalSidebar(route) + renderContextSidebar(route) +
      '<main class="workspace"><div class="workspace-inner"><header class="workspace-header"><div><div class="breadcrumbs">' +
      copy(contextLabel(route) + ' / ' + moduleInfo(route.module).label) + '</div><h1>' + copy(routeTitle(route)) +
      '</h1><p class="workspace-subtitle">' + copy(themeFor(route.day).title + ' · V1.5.5 选修作业与同比梯形漏斗') + fixtureBadge + '</p></div>' +
      '<div class="header-actions"><span class="date-chip">' + copy(dateRange) +
      '</span><button class="button primary" type="button" data-print>打印 / 另存 PDF</button></div></header>' +
      renderTimeline(route) + renderWorkspace(route) + '</div></main></div>';
  }

  function bindInteractions(route) {
    document.querySelectorAll('[data-toggle]').forEach(function (button) {
      button.addEventListener('click', function () {
        var shell = document.querySelector('.app-shell');
        var key = button.dataset.toggle;
        shell.classList.toggle(key + '-collapsed');
        var state = {
          global: shell.classList.contains('global-collapsed'),
          context: shell.classList.contains('context-collapsed')
        };
        localStorage.setItem('v1_5_sidebar_state', JSON.stringify(state));
        button.setAttribute('aria-expanded', String(!state[key]));
      });
    });
    var activeDay = document.querySelector('.day-pill.active');
    if (activeDay) activeDay.scrollIntoView({ block: 'nearest', inline: 'center' });
    var printButton = document.querySelector('[data-print]');
    if (printButton) printButton.addEventListener('click', function () { window.print(); });
    document.querySelectorAll('[data-chart-mode]').forEach(function (button) {
      button.addEventListener('click', function () {
        var next = routeWith(route, { params: Object.assign({}, route.params, { mode: button.dataset.chartMode }) });
        window.location.hash = routeHash(next);
      });
    });
    var input = document.getElementById('ask-input');
    var answerNode = document.getElementById('ask-answer');
    function runQuestion(question) {
      if (!input || !answerNode) return;
      var answer = answerForQuestion(question, route);
      input.value = question;
      answerNode.dataset.answerPeriod = answer.period;
      answerNode.dataset.answerDay = answer.day;
      answerNode.innerHTML = answerMarkup(answer);
    }
    document.querySelectorAll('[data-question]').forEach(function (button) {
      button.addEventListener('click', function () { runQuestion(button.dataset.question); });
    });
    var submit = document.getElementById('ask-submit');
    if (submit) submit.addEventListener('click', function () { runQuestion(input.value); });
    if (input) input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') runQuestion(input.value);
    });
    var trendTooltip = document.querySelector('[data-trend-tooltip]');
    if (trendTooltip) {
      document.querySelectorAll('[data-trend-point]').forEach(function (point) {
        function showTrendTooltip() {
          var wrap = point.closest('.daily-trend-wrap');
          if (!wrap) return;
          var pointRect = point.getBoundingClientRect();
          var wrapRect = wrap.getBoundingClientRect();
          var desiredLeft = pointRect.left - wrapRect.left + pointRect.width / 2;
          trendTooltip.textContent = point.dataset.tooltip || '';
          trendTooltip.hidden = false;
          trendTooltip.style.left = Math.max(76, Math.min(wrapRect.width - 76, desiredLeft)) + 'px';
          trendTooltip.style.top = (pointRect.top - wrapRect.top - 8) + 'px';
        }
        function hideTrendTooltip() { trendTooltip.hidden = true; }
        point.addEventListener('mouseenter', showTrendTooltip);
        point.addEventListener('focus', showTrendTooltip);
        point.addEventListener('mouseleave', hideTrendTooltip);
        point.addEventListener('blur', hideTrendTooltip);
      });
    }
  }

  function normalizeRoute(route) {
    var periods = selectablePeriods().map(function (period) { return String(period.period_id); });
    var days = visibleDays().map(function (day) { return day.day_key; });
    if (!periods.includes(String(route.period))) route.period = periods[0] || '601';
    if (!days.includes(route.day)) route.day = 'all';
    return route;
  }

  function boot() {
    var route = normalizeRoute(C.parseRoute());
    if (!window.location.hash) history.replaceState(null, '', routeHash(route));
    document.getElementById('app').innerHTML = renderApp(route);
    bindInteractions(route);
  }

  window.addEventListener('hashchange', boot);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
