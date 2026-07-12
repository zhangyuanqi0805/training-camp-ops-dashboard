(function () {
  'use strict';

  var dataNode = document.getElementById('dashboard-data');
  var DATA = dataNode ? JSON.parse(dataNode.textContent || '{}') : {};
  var VISIBLE_PERIOD_IDS = ['601', '602', '603', '604', '605', '606', '607'];
  var VISIBLE_DAY_KEYS = [
    'all', 'pre', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'cutoff'
  ];
  var ROUTE_KEYS = ['period', 'day', 'module', 'view'];
  var STORAGE_KEYS = {
    route: 'training-camp-dashboard:v1.5:last-route',
    sidebars: 'v1_5_sidebar_state'
  };

  [
    'periods', 'days', 'metric_catalog', 'facts', 'metric_readouts', 'attainments',
    'comparisons', 'comparison_gaps', 'classes', 'funnels', 'actions', 'assumptions',
    'sources', 'query_examples'
  ].forEach(function (key) {
    if (!Array.isArray(DATA[key])) DATA[key] = [];
  });
  if (!DATA.metadata || typeof DATA.metadata !== 'object') DATA.metadata = {};

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
      { id: 'home', label: '经营总览', shortLabel: '总' },
      { id: 'periods', label: '营期列表', shortLabel: '期' },
      { id: 'alerts', label: '关键异常', shortLabel: '警' }
    ],
    period: [
      { id: 'overview', label: '营期概览', shortLabel: '览' },
      { id: 'daily', label: '每日经营', shortLabel: '日' },
      { id: 'chain', label: '经营链路', shortLabel: '链' },
      { id: 'classes', label: '班级结果', shortLabel: '班' },
      { id: 'students', label: '学员规模', shortLabel: '员' },
      { id: 'learning', label: '学习表现', shortLabel: '学' },
      { id: 'finance', label: '财务结果', shortLabel: '财' }
    ],
    comparison: [{ id: 'overview', label: '营期对比', shortLabel: '比' }],
    people: [
      { id: 'classes', label: '班级排行', shortLabel: '排' },
      { id: 'students', label: '学员分析', shortLabel: '群' },
      { id: 'activation', label: '激活漏斗', shortLabel: '活' }
    ],
    learning: [
      { id: 'overview', label: '学习总览', shortLabel: '览' },
      { id: 'main-course', label: '主课学习', shortLabel: '课' },
      { id: 'daily-question', label: '每日一问', shortLabel: '问' },
      { id: 'live', label: '直播表现', shortLabel: '播' }
    ],
    finance: [
      { id: 'ltv', label: 'LTV', shortLabel: 'L' },
      { id: 'cac', label: 'CAC', shortLabel: 'C' },
      { id: 'efficiency', label: '经营效率', shortLabel: '效' },
      { id: 'revenue', label: '营收', shortLabel: '收' },
      { id: 'orders', label: '折算订单', shortLabel: '单' },
      { id: 'cost', label: '招生费用', shortLabel: '费' }
    ],
    ask: [{ id: 'recommended', label: '问数据', shortLabel: '问' }],
    tools: [
      { id: 'definitions', label: '数据口径', shortLabel: '口' },
      { id: 'raw', label: '原始数据', shortLabel: '数' },
      { id: 'quality', label: '数据质量', shortLabel: '质' },
      { id: 'refresh', label: '数据刷新', shortLabel: '刷' }
    ]
  };

  function safeStorageGet(key) {
    try {
      return window.localStorage ? window.localStorage.getItem(key) : null;
    } catch (_) {
      return null;
    }
  }

  function safeStorageSet(key, value) {
    try {
      if (window.localStorage) window.localStorage.setItem(key, value);
    } catch (_) {
      // Local files can run with storage disabled; URL state still remains authoritative.
    }
  }

  function readStoredObject(key) {
    var raw = safeStorageGet(key);
    if (!raw) return {};
    try {
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function selectablePeriods() {
    var byId = {};
    DATA.periods.forEach(function (period) {
      if (!period || !VISIBLE_PERIOD_IDS.includes(String(period.period_id))) return;
      if (period.visible === false || period.selectable === false) return;
      if (['comparison_only', 'hidden', 'baseline_only', 'hidden_fixture_baseline'].includes(period.mode)) return;
      byId[String(period.period_id)] = period;
    });
    return VISIBLE_PERIOD_IDS.map(function (periodId) { return byId[periodId]; }).filter(Boolean);
  }

  function defaultPeriodId() {
    var allowed = selectablePeriods().map(function (period) { return period.period_id; });
    var candidates = [DATA.metadata.default_period, DATA.metadata.current_period_id, '602'];
    for (var index = 0; index < candidates.length; index += 1) {
      if (allowed.includes(String(candidates[index] || ''))) return String(candidates[index]);
    }
    return allowed[0] || '601';
  }

  function defaultDayKey() {
    var candidates = [DATA.metadata.default_day, 'all'];
    for (var index = 0; index < candidates.length; index += 1) {
      if (VISIBLE_DAY_KEYS.includes(String(candidates[index] || ''))) return String(candidates[index]);
    }
    return 'all';
  }

  function directEntryRoute() {
    return {
      period: '602',
      day: 'all',
      module: 'overview',
      view: 'home',
      params: {}
    };
  }

  var DEFAULT_ROUTE = {
    period: defaultPeriodId(),
    day: defaultDayKey(),
    module: 'overview',
    view: 'home',
    params: {}
  };

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function classExists(periodId, classRef) {
    if (!classRef) return false;
    var expected = String(classRef);
    return DATA.classes.some(function (item) {
      if (!item || String(item.period_id || periodId) !== String(periodId)) return false;
      return [item.dimension_id, item.class_id, item.class_name, item.label]
        .filter(Boolean)
        .some(function (value) { return String(value) === expected; });
    });
  }

  function normalizeRoute(route) {
    var candidate = route || {};
    var allowedPeriods = selectablePeriods().map(function (period) { return String(period.period_id); });
    var normalized = {
      period: String(candidate.period || DEFAULT_ROUTE.period),
      day: String(candidate.day || DEFAULT_ROUTE.day),
      module: String(candidate.module || DEFAULT_ROUTE.module),
      view: String(candidate.view || DEFAULT_ROUTE.view),
      params: Object.assign({}, candidate.params || {})
    };

    if (!allowedPeriods.includes(normalized.period)) normalized.period = defaultPeriodId();
    if (!VISIBLE_DAY_KEYS.includes(normalized.day)) normalized.day = 'all';
    if (!PRIMARY_MODULES.some(function (item) { return item.id === normalized.module; })) {
      normalized.module = DEFAULT_ROUTE.module;
    }

    var allowedViews = CONTEXT_VIEWS[normalized.module] || [];
    var isClassDetail = normalized.module === 'people' && normalized.view === 'class-detail';
    if (!isClassDetail && !allowedViews.some(function (item) { return item.id === normalized.view; })) {
      normalized.view = allowedViews[0] ? allowedViews[0].id : DEFAULT_ROUTE.view;
      normalized.params = {};
    }
    if (isClassDetail) {
      var classRef = normalized.params.class || normalized.params.class_id || normalized.params.dimension_id;
      if (!classExists(normalized.period, classRef)) {
        normalized.view = 'classes';
        normalized.params = {};
      }
    }
    return normalized;
  }

  function parseRoute(hash) {
    var readsWindowLocation = hash == null;
    var raw = String(readsWindowLocation ? window.location.hash : hash).replace(/^.*#/, '');
    var search = new URLSearchParams(raw);
    var entry = directEntryRoute();
    var route = raw ? {
      period: search.get('period') || entry.period,
      day: search.get('day') || entry.day,
      module: search.get('module') || entry.module,
      view: search.get('view') || entry.view,
      params: {}
    } : entry;
    search.forEach(function (value, key) {
      if (!ROUTE_KEYS.includes(key)) route.params[key] = value;
    });
    route = normalizeRoute(route);
    safeStorageSet(STORAGE_KEYS.route, JSON.stringify(route));
    if (readsWindowLocation && typeof history !== 'undefined' && history.replaceState) {
      var canonicalHash = routeHash(route);
      if ('#' + raw !== canonicalHash) history.replaceState(null, '', canonicalHash);
    }
    return route;
  }

  function routeHash(route) {
    var normalized = normalizeRoute(route);
    var search = new URLSearchParams();
    search.set('period', normalized.period);
    search.set('day', normalized.day);
    search.set('module', normalized.module);
    search.set('view', normalized.view);
    Object.keys(normalized.params || {}).sort().forEach(function (key) {
      var value = normalized.params[key];
      if (value != null && value !== '') search.set(key, value);
    });
    return '#' + search.toString();
  }

  function routeWith(route, changes) {
    var current = normalizeRoute(route);
    var next = {
      period: current.period,
      day: current.day,
      module: current.module,
      view: current.view,
      params: Object.assign({}, current.params)
    };
    Object.keys(changes || {}).forEach(function (key) {
      if (key === 'params') next.params = Object.assign({}, changes.params || {});
      else next[key] = changes[key];
    });
    return normalizeRoute(next);
  }

  function navigate(route, options) {
    var hash = routeHash(route);
    if (options && options.replace) history.replaceState(null, '', hash);
    else window.location.hash = hash;
    return hash;
  }

  function dayRoute(route, dayKey) {
    return routeHash(routeWith(route, {
      day: dayKey,
      params: Object.assign({}, route.params || {})
    }));
  }

  function catalog(metricId) {
    return DATA.metric_catalog.find(function (item) { return item.metric_id === metricId; }) || null;
  }

  function facts(filter) {
    return DATA.facts.filter(function (fact) {
      return Object.keys(filter || {}).every(function (key) {
        return filter[key] == null || fact[key] === filter[key];
      });
    });
  }

  function factById(factId) {
    return DATA.facts.find(function (fact) { return fact.fact_id === factId; }) || null;
  }

  function cutoffRank(value) {
    var text = String(value || '').toUpperCase();
    if (!text) return 0;
    if (text === 'PERIOD_END' || /最终|截单/.test(text)) return 10000;
    if (text === 'EOD') return 2400;
    var timeMatch = text.match(/(?:^|\s)(\d{1,2}):(\d{2})(?:$|\s)/) || text.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) return Number(timeMatch[1]) * 100 + Number(timeMatch[2]);
    var dayMatch = text.match(/D(1[01]|[1-9])/);
    if (dayMatch) return Number(dayMatch[1]) * 100;
    var numberMatch = text.match(/(\d+)/);
    return numberMatch ? Number(numberMatch[1]) : 0;
  }

  function latestFact(filter) {
    var matches = facts(filter);
    if (!matches.length) return null;
    return matches.slice().sort(function (left, right) {
      var rightRank = cutoffRank(right.cutoff_key || right.cutoff_time);
      var leftRank = cutoffRank(left.cutoff_key || left.cutoff_time);
      return rightRank - leftRank;
    })[0];
  }

  function readoutFor(actualFact) {
    if (!actualFact) return null;
    return DATA.metric_readouts.find(function (item) {
      if (item.actual_fact_id) return item.actual_fact_id === actualFact.fact_id;
      return item.period_id === actualFact.period_id &&
        item.day_key === actualFact.day_key &&
        item.metric_id === actualFact.metric_id &&
        (!item.value_kind || item.value_kind === actualFact.value_kind) &&
        (!item.scope_id || item.scope_id === actualFact.scope_id);
    }) || null;
  }

  function targetFor(actualFact) {
    if (!actualFact) return null;
    var readout = readoutFor(actualFact);
    if (readout && readout.target_fact_id) return factById(readout.target_fact_id);
    var targetKind = String(actualFact.value_kind || '').replace(/^actual_/, 'target_');
    var filter = {
      period_id: actualFact.period_id,
      day_key: actualFact.day_key,
      metric_id: actualFact.metric_id,
      value_kind: targetKind,
      scope_id: actualFact.scope_id
    };
    if (actualFact.dimension_type != null) filter.dimension_type = actualFact.dimension_type;
    if (actualFact.dimension_id != null) filter.dimension_id = actualFact.dimension_id;
    else if (actualFact.dimension_value != null) filter.dimension_value = actualFact.dimension_value;
    return latestFact(filter);
  }

  function attainmentFor(actualFact) {
    if (!actualFact) return null;
    var readout = readoutFor(actualFact);
    if (readout && readout.achievement) {
      var achievement = Object.assign({}, readout.achievement);
      if (achievement.rate == null && achievement.achievement_rate != null) {
        achievement.rate = achievement.achievement_rate;
      }
      if (!achievement.status && typeof achievement.achieved === 'boolean') {
        achievement.status = achievement.achieved ? 'achieved' : 'below_target';
      }
      return achievement;
    }
    return DATA.attainments.find(function (item) {
      return item.period_id === actualFact.period_id &&
        item.day_key === actualFact.day_key &&
        item.metric_id === actualFact.metric_id &&
        item.value_kind === actualFact.value_kind &&
        item.scope_id === actualFact.scope_id;
    }) || null;
  }

  function comparisonFor(actualFact) {
    if (!actualFact) return null;
    var readout = readoutFor(actualFact);
    if (readout && readout.period_comparison) return readout.period_comparison;
    return DATA.comparisons.find(function (item) {
      return item.period_id === actualFact.period_id &&
        item.day_key === actualFact.day_key &&
        item.metric_id === actualFact.metric_id &&
        (!item.value_kind || item.value_kind === actualFact.value_kind) &&
        (!item.scope_id || item.scope_id === actualFact.scope_id);
    }) || null;
  }

  function previousDayFor(actualFact) {
    var readout = readoutFor(actualFact);
    return readout && readout.previous_day_comparison ? readout.previous_day_comparison : null;
  }

  function gaps(filter) {
    return DATA.comparison_gaps.filter(function (gap) {
      return Object.keys(filter || {}).every(function (key) {
        return filter[key] == null || gap[key] === filter[key];
      });
    });
  }

  function isFiniteNumber(value) {
    return value !== '' && value != null && Number.isFinite(Number(value));
  }

  function formatValue(value, metricId, digits) {
    if (!isFiniteNumber(value)) return '—';
    var metric = catalog(metricId) || { metric_type: 'amount', unit: '' };
    var metricType = metric.metric_type || metric.type;
    if (metricType === 'rate') return (Number(value) * 100).toFixed(digits == null ? 1 : digits) + '%';
    var maximumDigits = digits == null ? (Number(value) % 1 ? 2 : 0) : digits;
    return Number(value).toLocaleString('zh-CN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: maximumDigits
    });
  }

  function metricUnit(metricId) {
    var metric = catalog(metricId);
    return metric ? metric.unit || '' : '';
  }

  function statusLabel(status) {
    var labels = {
      real: '真实数据',
      derived: '计算',
      derived_real: '计算',
      assumed: '示例',
      derived_assumed: '示例',
      mixed: '含补齐值',
      configured: '有目标',
      not_configured: '规划参考',
      not_started: '阶段尚未开始',
      stage_only: '阶段进度',
      stage: '阶段进度',
      reference: '规划参考',
      assumed_strict: '含补齐值',
      achieved: '已达标',
      below_target: '未达标',
      above_target: '高于目标',
      comparable: '可比',
      not_comparable: '参考比较',
      cutoff_mismatch: '时点参考',
      active: '生效中',
      replaced_by_real: '已由真实值替换'
    };
    return labels[status] || (status ? String(status) : '参考');
  }

  function periodInfo(period) {
    return DATA.periods.find(function (item) { return String(item.period_id) === String(period); }) || null;
  }

  function dayInfo(day) {
    return DATA.days.find(function (item) { return item.day_key === day; }) || null;
  }

  function primaryInfo(moduleId) {
    return PRIMARY_MODULES.find(function (item) { return item.id === moduleId; }) || null;
  }

  function viewInfo(moduleId, viewId) {
    return (CONTEXT_VIEWS[moduleId] || []).find(function (item) { return item.id === viewId; }) || null;
  }

  function metricRoute(metricId, route) {
    var metric = catalog(metricId) || {};
    var fallbackRoutes = {
      ltv: 'finance:ltv',
      cac: 'finance:cac',
      revenue: 'finance:revenue',
      students: 'period:students',
      cost: 'finance:cost',
      orders: 'finance:orders',
      main_course_rate: 'learning:main-course',
      daily_question_rate: 'learning:daily-question',
      live_attendance_rate: 'learning:live',
      live_completion_rate: 'learning:live'
    };
    var detailRoute = metric.detail_route || fallbackRoutes[metricId];
    if (!detailRoute || !String(detailRoute).includes(':')) return routeHash(route);
    var parts = String(detailRoute).split(':');
    return routeHash(routeWith(route, { module: parts[0], view: parts[1], params: {} }));
  }

  function sourceById(sourceId) {
    return DATA.sources.find(function (item) { return item.source_id === sourceId; }) || null;
  }

  function visibleDays() {
    var byKey = {};
    DATA.days.forEach(function (item) {
      if (item && item.timeline_visible !== false && VISIBLE_DAY_KEYS.includes(item.day_key)) {
        byKey[item.day_key] = item;
      }
    });
    return VISIBLE_DAY_KEYS.map(function (dayKey) { return byKey[dayKey]; }).filter(Boolean);
  }

  function routeTitle(route) {
    if (route.module === 'people' && route.view === 'class-detail') {
      return String(route.params.class || route.params.class_id || '班级') + '详情';
    }
    var view = viewInfo(route.module, route.view);
    var primary = primaryInfo(route.module);
    return view ? view.label : primary ? primary.label : '经营总览';
  }

  function statusClass(status) {
    if (['achieved', 'real', 'derived_real', 'configured', 'comparable'].includes(status)) return 'positive';
    if (['below_target', 'above_target', 'cutoff_mismatch'].includes(status)) return 'warning';
    if (['assumed', 'derived_assumed', 'mixed'].includes(status)) return 'assumed';
    return 'neutral';
  }

  function normalizeSidebarState(value) {
    var state = value || {};
    return { global: state.global === true, context: state.context === true };
  }

  function getSidebarState() {
    return normalizeSidebarState(readStoredObject(STORAGE_KEYS.sidebars));
  }

  function sidebarStateFromShell(shell) {
    if (!shell || !shell.classList) return getSidebarState();
    return {
      global: shell.classList.contains('global-collapsed'),
      context: shell.classList.contains('context-collapsed')
    };
  }

  function applySidebarState(root, value) {
    var shell = root && root.matches && root.matches('.app-shell') ? root :
      (root || document).querySelector ? (root || document).querySelector('.app-shell') : null;
    var state = normalizeSidebarState(value || getSidebarState());
    if (!shell) return state;
    shell.classList.toggle('global-collapsed', state.global);
    shell.classList.toggle('context-collapsed', state.context);
    return state;
  }

  function setSidebarState(value, root) {
    var state = normalizeSidebarState(value);
    safeStorageSet(STORAGE_KEYS.sidebars, JSON.stringify(state));
    applySidebarState(root || document, state);
    return state;
  }

  function toggleSidebar(side, root) {
    var state = getSidebarState();
    if (side === 'global' || side === 'context') state[side] = !state[side];
    return setSidebarState(state, root || document);
  }

  function syncSidebarState(root) {
    var shell = root && root.matches && root.matches('.app-shell') ? root :
      (root || document).querySelector ? (root || document).querySelector('.app-shell') : null;
    if (!shell) return getSidebarState();
    return setSidebarState(sidebarStateFromShell(shell), shell);
  }

  function enhanceSidebar(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var route = parseRoute();
    scope.querySelectorAll('.global-nav [data-primary-module], .global-nav a').forEach(function (link) {
      var moduleId = link.getAttribute('data-primary-module');
      if (!moduleId) {
        var linkSearch = new URLSearchParams(String(link.getAttribute('href') || '').replace(/^.*#/, ''));
        moduleId = linkSearch.get('module');
      }
      var info = primaryInfo(moduleId);
      if (!info) return;
      var targetSearch = new URLSearchParams(String(link.getAttribute('href') || '').replace(/^.*#/, ''));
      var targetView = targetSearch.get('view') || (CONTEXT_VIEWS[moduleId] && CONTEXT_VIEWS[moduleId][0] ?
        CONTEXT_VIEWS[moduleId][0].id : DEFAULT_ROUTE.view);
      link.setAttribute('href', routeHash(routeWith(route, {
        module: moduleId,
        view: targetView,
        params: {}
      })));
      link.setAttribute('title', info.label);
      link.setAttribute('aria-label', info.label);
    });
    scope.querySelectorAll('[data-period-option]').forEach(function (option) {
      if (!VISIBLE_PERIOD_IDS.includes(option.getAttribute('data-period-option'))) option.remove();
    });
    scope.querySelectorAll('.context-nav a').forEach(function (link) {
      var search = new URLSearchParams(String(link.getAttribute('href') || '').replace(/^.*#/, ''));
      var moduleId = search.get('module') || route.module;
      var viewId = search.get('view');
      var info = viewInfo(moduleId, viewId);
      if (!info) return;
      link.setAttribute('title', info.label);
      link.setAttribute('aria-label', info.label);
      if (!link.querySelector('.nav-icon, .nav-short, [data-context-short-label], [data-short-label]')) {
        var icon = document.createElement('span');
        icon.className = 'nav-icon context-nav-icon';
        icon.setAttribute('data-context-short-label', info.shortLabel || info.label.slice(0, 1));
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = info.shortLabel || info.label.slice(0, 1);
        link.insertBefore(icon, link.firstChild);
      }
    });
    scope.querySelectorAll('[data-toggle="global"], [data-toggle="context"]').forEach(function (button) {
      var side = button.getAttribute('data-toggle');
      var collapsed = getSidebarState()[side];
      var label = (collapsed ? '展开' : '折叠') + (side === 'global' ? '一级侧栏' : '二级侧栏');
      button.setAttribute('aria-label', label);
      button.setAttribute('title', label);
    });
  }

  function enhancePrintActions(root) {
    var scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('[data-export], [data-print]').forEach(function (button) {
      var label = '打印 / 另存 PDF';
      button.setAttribute('aria-label', label);
      button.setAttribute('title', label);
      button.setAttribute('data-print', 'true');
      if (/导出/.test(button.textContent || '')) button.textContent = label;
    });
  }

  function enhanceRenderedApp() {
    var shell = document.querySelector('.app-shell');
    if (!shell) return;
    applySidebarState(shell);
    enhanceSidebar(shell);
    enhancePrintActions(shell);
  }

  function installStateBridge() {
    if (!document || !document.addEventListener) return;
    document.addEventListener('click', function (event) {
      var target = event.target && event.target.closest ? event.target.closest('[data-toggle]') : null;
      if (!target || !['global', 'context'].includes(target.getAttribute('data-toggle'))) return;
      window.setTimeout(function () {
        syncSidebarState(document);
        enhanceSidebar(document);
      }, 0);
    });
    if (typeof MutationObserver === 'function') {
      var observer = new MutationObserver(function () { enhanceRenderedApp(); });
      var start = function () {
        var root = document.getElementById('app') || document.body || document.documentElement;
        if (root) observer.observe(root, { childList: true, subtree: true });
        enhanceRenderedApp();
      };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
      else start();
    } else {
      document.addEventListener('DOMContentLoaded', enhanceRenderedApp, { once: true });
    }
  }

  function printDocument() {
    window.print();
  }

  window.DashboardCore = {
    DATA: DATA,
    PRIMARY_MODULES: PRIMARY_MODULES,
    CONTEXT_VIEWS: CONTEXT_VIEWS,
    VISIBLE_PERIOD_IDS: VISIBLE_PERIOD_IDS,
    VISIBLE_DAY_KEYS: VISIBLE_DAY_KEYS,
    DEFAULT_ROUTE: DEFAULT_ROUTE,
    directEntryRoute: directEntryRoute,
    STORAGE_KEYS: STORAGE_KEYS,
    escapeHtml: escapeHtml,
    normalizeRoute: normalizeRoute,
    parseRoute: parseRoute,
    routeHash: routeHash,
    routeWith: routeWith,
    navigate: navigate,
    dayRoute: dayRoute,
    catalog: catalog,
    facts: facts,
    factById: factById,
    latestFact: latestFact,
    readoutFor: readoutFor,
    targetFor: targetFor,
    attainmentFor: attainmentFor,
    comparisonFor: comparisonFor,
    previousDayFor: previousDayFor,
    gaps: gaps,
    formatValue: formatValue,
    metricUnit: metricUnit,
    statusLabel: statusLabel,
    statusClass: statusClass,
    periodInfo: periodInfo,
    dayInfo: dayInfo,
    primaryInfo: primaryInfo,
    viewInfo: viewInfo,
    metricRoute: metricRoute,
    sourceById: sourceById,
    visibleDays: visibleDays,
    selectablePeriods: selectablePeriods,
    routeTitle: routeTitle,
    cutoffRank: cutoffRank,
    getSidebarState: getSidebarState,
    setSidebarState: setSidebarState,
    toggleSidebar: toggleSidebar,
    applySidebarState: applySidebarState,
    syncSidebarState: syncSidebarState,
    enhanceRenderedApp: enhanceRenderedApp,
    printDocument: printDocument
  };

  installStateBridge();
})();
