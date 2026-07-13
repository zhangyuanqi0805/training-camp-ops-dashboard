const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const ROOT = path.resolve(__dirname, '..');
const PAGE = path.join(ROOT, 'dist', 'dashboard.html');
const DESKTOP_DIR = path.join(ROOT, 'screenshots', 'V1_5_6_30页桌面验收');
const MOBILE_DIR = path.join(ROOT, 'screenshots', 'V1_5_6_8模块手机验收');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const ROUTES = [
  ['overview', 'home'], ['overview', 'periods'], ['overview', 'alerts'],
  ['period', 'overview'], ['period', 'daily'], ['period', 'chain'], ['period', 'classes'],
  ['period', 'students'], ['period', 'learning'], ['period', 'finance'],
  ['comparison', 'overview'],
  ['people', 'classes'], ['people', 'students'], ['people', 'activation'], ['people', 'class-detail', 'class=602-class-63'],
  ['learning', 'overview'], ['learning', 'main-course'], ['learning', 'daily-question'], ['learning', 'live'],
  ['finance', 'ltv'], ['finance', 'cac'], ['finance', 'efficiency'], ['finance', 'revenue'], ['finance', 'orders'], ['finance', 'cost'],
  ['ask', 'recommended'],
  ['tools', 'definitions'], ['tools', 'raw'], ['tools', 'quality'], ['tools', 'refresh'],
];

const MOBILE_ROUTES = [
  ['overview', 'home'], ['period', 'daily'], ['comparison', 'overview'], ['people', 'classes'],
  ['learning', 'overview'], ['finance', 'ltv'], ['ask', 'recommended'], ['tools', 'quality'],
];

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

function urlFor(module, view, extra) {
  return `${pathToFileURL(PAGE).href}#period=602&day=all&module=${module}&view=${view}${extra ? `&${extra}` : ''}`;
}

async function verifySurface(page, module, view) {
  const key = `${module}:${view}`;
  await page.waitForSelector(`[data-route-ready="${key}"]`);
  const state = await page.evaluate(() => {
    const workspace = document.querySelector('.workspace');
    const card = document.querySelector('.card, .kpi-card, .detail-fact, .data-table-wrap');
    const cardStyle = card ? getComputedStyle(card) : null;
    return {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      workspaceBackground: workspace ? getComputedStyle(workspace).backgroundImage : '',
      cardBackground: cardStyle ? cardStyle.backgroundColor : '',
      cardBackgroundImage: cardStyle ? cardStyle.backgroundImage : '',
      title: document.title,
      text: document.body.innerText,
    };
  });
  assert(state.overflow <= 1, `${key} horizontal overflow: ${state.overflow}px`);
  assert(state.workspaceBackground.includes('gradient'), `${key} is missing the aurora workspace background`);
  const hasSolidSurface = state.cardBackground && state.cardBackground !== 'rgba(0, 0, 0, 0)';
  const hasImageSurface = state.cardBackgroundImage && state.cardBackgroundImage !== 'none';
  assert(hasSolidSurface || hasImageSurface, `${key} has a transparent primary surface`);
  assert(state.title.includes('V1.5.6'), `${key} is not branded V1.5.6`);
  assert(state.text.trim().length > 80, `${key} rendered as an empty shell`);
}

async function main() {
  fs.rmSync(DESKTOP_DIR, { recursive: true, force: true });
  fs.rmSync(MOBILE_DIR, { recursive: true, force: true });
  fs.mkdirSync(DESKTOP_DIR, { recursive: true });
  fs.mkdirSync(MOBILE_DIR, { recursive: true });
  const chromium = loadChromium();
  const browser = await chromium.launch({ headless: true, executablePath: fs.existsSync(CHROME) ? CHROME : undefined });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', (error) => errors.push(error.message));
    for (let index = 0; index < ROUTES.length; index += 1) {
      const [module, view, extra] = ROUTES[index];
      await page.goto(urlFor(module, view, extra), { waitUntil: 'load' });
      await verifySurface(page, module, view);
      const number = String(index + 1).padStart(2, '0');
      await page.screenshot({
        path: path.join(DESKTOP_DIR, `${number}_${module}_${view}.jpg`),
        fullPage: true,
        type: 'jpeg',
        quality: 78,
      });
    }
    await page.close();

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    mobile.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    mobile.on('pageerror', (error) => errors.push(error.message));
    for (let index = 0; index < MOBILE_ROUTES.length; index += 1) {
      const [module, view] = MOBILE_ROUTES[index];
      await mobile.goto(urlFor(module, view), { waitUntil: 'load' });
      await verifySurface(mobile, module, view);
      const number = String(index + 1).padStart(2, '0');
      await mobile.screenshot({
        path: path.join(MOBILE_DIR, `${number}_${module}_${view}.jpg`),
        fullPage: true,
        type: 'jpeg',
        quality: 76,
      });
    }
    await mobile.close();
  } finally {
    await browser.close();
  }
  assert(errors.length === 0, `browser errors:\n${errors.join('\n')}`);
  assert(fs.readdirSync(DESKTOP_DIR).length === 30, 'desktop route evidence must contain 30 screenshots');
  assert(fs.readdirSync(MOBILE_DIR).length === 8, 'mobile route evidence must contain 8 screenshots');
  console.log('V1.5.6 all-route aurora theme QA: PASS (30 desktop + 8 mobile)');
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exit(1);
});
