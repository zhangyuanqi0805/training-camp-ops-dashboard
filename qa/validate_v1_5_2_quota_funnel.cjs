const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const ROOT = path.resolve(__dirname, '..');
const ENTRY = path.join(ROOT, 'index.html');
const PAGE = path.join(ROOT, 'dist', 'dashboard.html');
const SCREENSHOT = path.join(ROOT, 'screenshots', 'V1_5_2_602整期总览_桌面.png');
const MOBILE_SCREENSHOT = path.join(ROOT, 'screenshots', 'V1_5_2_602整期总览_手机.png');
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
    for (const label of ['累计营收 vs 目标', '总配额占比漏斗', '班级营收前五', '直接问经营问题']) {
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
    const widths = await page.locator('.quota-funnel-shape').evaluateAll((nodes) =>
      nodes.map((node) => node.getBoundingClientRect().width));
    assert(widths.every((width, index) => index === 0 || width <= widths[index - 1] + 1),
      `funnel widths must narrow by quota share: ${widths.join(', ')}`);
    assert(widths[widths.length - 1] < widths[0] * 0.6, 'last stage must be visibly narrower than first stage');
    assert(await page.locator('.mature-home-grid polyline[stroke="#bc5b27"]').count() === 1,
      'revenue chart must render the available target line');
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
  console.log('V1.5.2 quota-funnel browser QA: PASS');
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exit(1);
});
