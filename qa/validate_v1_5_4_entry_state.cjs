const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const ROOT = path.resolve(__dirname, '..');
const ENTRY = path.join(ROOT, 'index.html');
const PAGE = path.join(ROOT, 'dist', 'dashboard.html');
const SCREENSHOT = path.join(ROOT, 'screenshots', 'V1_5_4_602默认首页_桌面.png');
const MOBILE_SCREENSHOT = path.join(ROOT, 'screenshots', 'V1_5_4_602默认首页_手机.png');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

function loadChromium() {
  const candidates = [process.env.PLAYWRIGHT_MODULE_PATH, 'playwright', 'playwright-core'].filter(Boolean);
  const npxRoot = path.join(os.homedir(), '.npm', '_npx');
  if (fs.existsSync(npxRoot)) {
    for (const entry of fs.readdirSync(npxRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const cached = path.join(npxRoot, entry.name, 'node_modules', 'playwright');
      if (fs.existsSync(path.join(cached, 'package.json'))) candidates.push(cached);
    }
  }
  for (const candidate of candidates) {
    try { return require(candidate).chromium; } catch (_) {}
  }
  throw new Error('Playwright is required');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  fs.mkdirSync(path.dirname(SCREENSHOT), { recursive: true });
  const browser = await loadChromium().launch({
    headless: true,
    executablePath: fs.existsSync(CHROME) ? CHROME : undefined,
  });
  try {
    const routeContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const routePage = await routeContext.newPage();
    const directUrl = pathToFileURL(PAGE).href;
    await routePage.goto(directUrl, { waitUntil: 'load' });
    await routePage.waitForSelector('[data-route-ready="overview:home"][data-period="602"][data-day="all"]');

    const deepUrl = `${directUrl}#period=606&day=all&module=overview&view=periods`;
    await routePage.goto(deepUrl, { waitUntil: 'load' });
    await routePage.waitForSelector('[data-route-ready="overview:periods"][data-period="606"]');
    await routePage.reload({ waitUntil: 'load' });
    await routePage.waitForSelector('[data-route-ready="overview:periods"][data-period="606"]');

    await routePage.goto(directUrl, { waitUntil: 'load' });
    await routePage.waitForSelector('[data-route-ready="overview:home"]');
    assert((await routePage.locator('[data-route-ready]').getAttribute('data-period')) === '602',
      'opening the fixed URL without a hash must reset stale route state to 602');
    assert((await routePage.locator('[data-route-ready]').getAttribute('data-day')) === 'all',
      'opening the fixed URL without a hash must use the full-period view');
    await routeContext.close();

    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    await page.goto(pathToFileURL(ENTRY).href, { waitUntil: 'load' });
    await page.locator('a.primary').click();
    await page.waitForSelector('[data-route-ready="overview:home"]');

    const selector = page.locator('details.period-switcher');
    assert(!(await selector.getAttribute('open')), 'period selector must be closed initially');
    assert((await page.locator('.period-select-summary').innerText()).includes('602期'), 'current period row must show 602期');
    assert(!(await page.locator('.period-options').isVisible()), 'period list must stay hidden until expanded');

    await page.locator('.period-select-summary').click();
    assert(await page.locator('.period-options').isVisible(), 'period list must expand on click');
    assert(await page.locator('[data-period-option]').count() === 7, 'period list must contain 601-607');

    const bodyText = await page.locator('body').innerText();
    for (const label of ['每日经营三指标', '当日新增LTV', '必修作业率', '到课率（主课观看）', '总配额占比漏斗', '班级营收前五', '直接问经营问题']) {
      assert(bodyText.includes(label), `missing restored block: ${label}`);
    }
    assert(!bodyText.includes('紧凑经营漏斗'), 'duplicate horizontal funnel must be removed');
    assert(!bodyText.includes('开营前激活'), 'old activation card must be replaced');
    assert((await page.locator('.quota-funnel-head strong').innerText()) === '总配额 1,021人',
      '602 denominator must be the 1,021-person common quota');
    const shares = await page.locator('.quota-funnel-share strong').allInnerTexts();
    assert(shares[0] === '97.8%', '602 add-friend share must use the common quota');
    assert(shares[shares.length - 1] === '7.0%', '602 full-payment share must use the common quota');
    assert(await page.locator('.quota-funnel').count() === 1, 'home must render one quota funnel');
    assert(await page.locator('.quota-funnel-stage').count() === 8, 'quota funnel must render eight business stages');
    const funnelGap = await page.locator('.quota-funnel').evaluate((node) => getComputedStyle(node).gap);
    assert(funnelGap === '0px', `funnel layers must connect without gaps: ${funnelGap}`);
    const geometry = await page.locator('.quota-funnel-shape').evaluateAll((nodes) => nodes.map((node) => ({
      top: parseFloat(node.style.getPropertyValue('--quota-top')),
      bottom: parseFloat(node.style.getPropertyValue('--quota-bottom')),
      clipPath: getComputedStyle(node).clipPath,
    })));
    assert(Math.abs(geometry[0].top - 97.8) < 0.1, `first stage top must match 97.8%: ${geometry[0].top}`);
    assert(Math.abs(geometry[geometry.length - 1].top - 7.0) < 0.1,
      `last stage top must match 7.0%: ${geometry[geometry.length - 1].top}`);
    geometry.slice(0, -1).forEach((stage, index) => {
      assert(Math.abs(stage.bottom - geometry[index + 1].top) < 0.1,
        `adjacent funnel layers must share one edge at ${index}: ${stage.bottom} vs ${geometry[index + 1].top}`);
    });
    assert(geometry.every((stage) => stage.clipPath && stage.clipPath !== 'none'),
      'every funnel layer must use trapezoid clipping');
    assert(await page.locator('.daily-operating-trend [data-series="daily-ltv"]').count() === 1,
      'daily LTV line must render');
    assert(await page.locator('.daily-operating-trend [data-series="homework-rate"]').count() === 1,
      'homework line must render');
    assert(await page.locator('.daily-operating-trend [data-series="attendance-rate"]').count() === 1,
      'attendance line must render');
    assert(await page.locator('.daily-operating-trend circle title').count() >= 30,
      'daily trend points must expose values through SVG titles');
    const ltvPoint = page.locator('circle[data-trend-point="daily-ltv"]').nth(5);
    await ltvPoint.hover();
    const ltvTooltip = page.locator('[data-trend-tooltip]');
    assert(await ltvTooltip.isVisible(), 'hovering an LTV point must show the custom tooltip');
    assert((await ltvTooltip.innerText()).includes('元/人'), 'LTV tooltip must show yuan per person');
    const homeworkPoint = page.locator('circle[data-trend-point="homework-rate"]').nth(4);
    await homeworkPoint.hover();
    assert((await ltvTooltip.innerText()).includes('必修作业率'), 'homework point must update the custom tooltip');
    assert(await page.locator('.mature-home-grid .data-table tbody tr').count() === 5, 'home ranking must show five classes');

    await page.locator('.quota-funnel-stage').first().click();
    await page.waitForSelector('[data-route-ready="period:chain"]');
    assert(page.url().includes('stage=add_friend'), 'funnel stage must open its chain detail');

    await page.goto(`${pathToFileURL(PAGE).href}#period=601&day=all&module=overview&view=home`, { waitUntil: 'load' });
    await page.waitForSelector('[data-route-ready="overview:home"]');
    assert((await page.locator('.quota-funnel-head strong').innerText()) === '总配额 840人',
      'period switch must update the common quota');
    assert((await page.locator('.quota-funnel-share strong').first().innerText()) === '97.4%',
      'period switch must update quota shares');

    await page.goto(`${pathToFileURL(PAGE).href}#period=602&day=all&module=overview&view=home`, { waitUntil: 'load' });
    await page.waitForSelector('[data-route-ready="overview:home"]');

    await page.locator('.period-select-summary').click();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert(overflow <= 1, `page-level horizontal overflow: ${overflow}px`);
    await page.screenshot({ path: SCREENSHOT, fullPage: true });
    await page.close();

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobile.goto(`${pathToFileURL(PAGE).href}#period=602&day=all&module=overview&view=home`, { waitUntil: 'load' });
    await mobile.waitForSelector('[data-route-ready="overview:home"]');
    const mobileOverflow = await mobile.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert(mobileOverflow <= 1, `mobile page-level horizontal overflow: ${mobileOverflow}px`);
    assert(await mobile.locator('.quota-funnel-stage').count() === 8, 'mobile view must retain all eight stages');
    await mobile.screenshot({ path: MOBILE_SCREENSHOT, fullPage: true });
    await mobile.close();
  } finally {
    await browser.close();
  }
  console.log('V1.5.4 entry-state browser QA: PASS');
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exit(1);
});
