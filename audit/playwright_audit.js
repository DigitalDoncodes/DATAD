const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
const OUTPUT_DIR = __dirname;

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

// All registered routes from App.jsx
const ROUTES = [
  // Auth / Public
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',

  // Public pages
  '/about',
  '/privacy',
  '/terms',
  '/support',
  '/subscribe',
  '/creator',

  // Legacy redirects (verify they 301 → new path)
  '/news',
  '/notes',
  '/planner',
  '/journal',
  '/reflection',
  '/finance',
  '/settings',
  '/resume',
  '/companies',
  '/albums',
  '/entertainment',
  '/me/wellbeing',

  // Study workspace
  '/study',
  '/study/notes',
  '/study/notes/new',
  '/study/work',
  '/study/subject',
  '/study/resources',
  '/study/focus',

  // Career workspace
  '/career',
  '/career/resume',
  '/career/resume/preview',
  '/career/companies',
  '/career/questions',
  '/career/opportunities',
  '/career/pivot',
  '/career/stories',

  // Community workspace
  '/community',
  '/community/announcements',
  '/community/feed',
  '/community/memories',
  '/community/directory',
  '/community/events',
  '/community/marketplace',
  '/community/skills',

  // Me workspace
  '/me',
  '/me/planner',
  '/me/settings',
  '/me/journal',
  '/me/reflection',
  '/me/finance',
  '/me/finance/tracker',
  '/me/finance/calculator',
  '/me/finance/learn',
  '/me/finance/roi',

  // Wellbeing workspace (independent of /me)
  '/wellbeing',
  '/wellbeing/study',
  '/wellbeing/memory',
  '/wellbeing/routines',
  '/wellbeing/support',

  // Standalone
  '/briefing',
  '/search',

  // Admin
  '/admin',
  '/admin/students',
  '/admin/studio',
  '/admin/announcements',
  '/admin/logs',
  '/admin/referrals',
  '/admin/archive',
  '/admin/companies',
  '/admin/cases',
  '/admin/automation',
  '/admin/ai-center',
  '/admin/ai-runtime',
  '/admin/subscriptions',

  // 404 test
  '/nonexistent-route-test-xyz',
];

// Results accumulator
const results = {};
const allConsoleErrors = [];
const allNetworkFailures = [];
const allSlowRequests = [];
const allJSErrors = [];

function sanitizeRoute(route) {
  return route === '/' ? 'index' : route.replace(/[/?&=]/g, '_').replace(/^_/, '');
}

async function auditRoute(page, route) {
  const entry = {
    route,
    status: 'pending',
    finalUrl: null,
    statusCode: null,
    consoleErrors: [],
    consoleWarnings: [],
    networkFailures: [],
    slowRequests: [],
    jsErrors: [],
    redirectChain: [],
    timing: null,
    screenshot: null,
  };

  const startTime = Date.now();

  // Console listener
  const pageConsoleErrors = [];
  const pageConsoleWarnings = [];
  const onConsole = (msg) => {
    if (msg.type() === 'error') {
      pageConsoleErrors.push({ text: msg.text(), location: msg.location() });
    } else if (msg.type() === 'warning') {
      pageConsoleWarnings.push({ text: msg.text(), location: msg.location() });
    }
  };
  page.on('console', onConsole);

  // Page error listener (unhandled JS exceptions)
  const pageJSErrors = [];
  const onPageError = (err) => {
    pageJSErrors.push({ message: err.message, stack: err.stack });
  };
  page.on('pageerror', onPageError);

  // Request failed listener
  const pageNetworkFailures = [];
  const onRequestFailed = (req) => {
    const url = req.url();
    // Filter out extension and data URLs
    if (url.startsWith('http')) {
      pageNetworkFailures.push({
        url,
        method: req.method(),
        resourceType: req.resourceType(),
        failure: req.failure()?.errorText || 'unknown',
      });
    }
  };
  page.on('requestfailed', onRequestFailed);

  // Response listener for slow requests + 4xx/5xx
  const pageSlowRequests = [];
  const responseTimestamps = {};
  const onRequest = (req) => {
    if (req.url().startsWith('http')) {
      responseTimestamps[req.url()] = Date.now();
    }
  };
  const onResponse = (res) => {
    const url = res.url();
    if (!url.startsWith('http')) return;
    const start = responseTimestamps[url];
    if (start) {
      const duration = Date.now() - start;
      if (duration > 1000) {
        pageSlowRequests.push({
          url,
          status: res.status(),
          method: res.request().method(),
          durationMs: duration,
          resourceType: res.request().resourceType(),
        });
      }
    }
  };
  page.on('request', onRequest);
  page.on('response', onResponse);

  try {
    const response = await page.goto(BASE_URL + route, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Wait a bit more for any dynamic content
    await page.waitForTimeout(1500);

    const timing = Date.now() - startTime;
    entry.timing = timing;
    entry.finalUrl = page.url();
    entry.statusCode = response?.status() || null;

    // Detect redirect
    if (entry.finalUrl !== BASE_URL + route && !entry.finalUrl.endsWith(route)) {
      const redirectUrl = entry.finalUrl.replace(BASE_URL, '');
      entry.redirectChain.push({ from: route, to: redirectUrl });
    }

    // Screenshot
    const screenshotName = `${sanitizeRoute(route)}.png`;
    const screenshotPath = path.join(SCREENSHOT_DIR, screenshotName);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    entry.screenshot = screenshotName;
  } catch (err) {
    entry.status = 'crashed';
    entry.error = err.message;
    // Try screenshot even on crash
    try {
      const screenshotName = `${sanitizeRoute(route)}.png`;
      const screenshotPath = path.join(SCREENSHOT_DIR, screenshotName);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      entry.screenshot = screenshotName;
    } catch (_) {}
  }

  entry.consoleErrors = [...pageConsoleErrors];
  entry.consoleWarnings = [...pageConsoleWarnings];
  entry.networkFailures = [...pageNetworkFailures];
  entry.slowRequests = [...pageSlowRequests];
  entry.jsErrors = [...pageJSErrors];

  // Aggregate
  allConsoleErrors.push(...pageConsoleErrors.map(e => ({ ...e, route })));
  allNetworkFailures.push(...pageNetworkFailures.map(e => ({ ...e, route })));
  allSlowRequests.push(...pageSlowRequests.map(e => ({ ...e, route })));
  allJSErrors.push(...pageJSErrors.map(e => ({ ...e, route })));

  // Cleanup listeners
  page.off('console', onConsole);
  page.off('pageerror', onPageError);
  page.off('requestfailed', onRequestFailed);
  page.off('request', onRequest);
  page.off('response', onResponse);

  entry.status = 'visited';
  results[route] = entry;

  console.log(`[${entry.statusCode}] ${route} → ${entry.finalUrl.replace(BASE_URL, '')} (${entry.timing}ms, ${pageConsoleErrors.length} errs, ${pageNetworkFailures.length} net failures)`);
}

async function main() {
  console.log('=== DATAD Playwright Runtime Audit ===\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  });

  const page = await context.newPage();

  // Suppress non-error console from the browser
  page.on('console', (msg) => {
    // Only log page errors during audit
    if (msg.type() === 'error') {
      // Already captured per-route
    }
  });

  for (const route of ROUTES) {
    await auditRoute(page, route);
    // Brief pause between routes to let resources settle
    await page.waitForTimeout(300);
  }

  await browser.close();

  // Write raw data
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'audit-raw.json'),
    JSON.stringify({ results, allConsoleErrors, allNetworkFailures, allSlowRequests, allJSErrors }, null, 2)
  );

  console.log('\n=== Audit Complete ===');
  console.log(`Total routes: ${ROUTES.length}`);
  console.log(`Console errors: ${allConsoleErrors.length}`);
  console.log(`Network failures: ${allNetworkFailures.length}`);
  console.log(`Slow requests (>1s): ${allSlowRequests.length}`);
  console.log(`JS exceptions: ${allJSErrors.length}`);
  console.log(`Screenshots saved to: ${SCREENSHOT_DIR}`);
  console.log(`Raw data: ${path.join(OUTPUT_DIR, 'audit-raw.json')}`);
}

main().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
