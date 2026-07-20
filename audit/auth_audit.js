const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const util = require('util');

const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = path.join(__dirname, 'auth-screenshots');
const OUTPUT_DIR = __dirname;

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

// Credentials (in order of preference)
const CREDENTIALS = [
  { email: 'digitaldondhatchinamoorthi@gmail.com', password: 'Aaruraan@73' },
  { email: 'digitaldoncodes@gmail.com', password: 'Muruga@321' },
];

const STATE_PATH = path.join(OUTPUT_DIR, 'auth-state.json');

// ---- Route list (all routes that need auth are included; public routes too) ----
const ROUTES = [
  // Public pages (accessible without auth)
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/about',
  '/privacy',
  '/terms',
  '/creator',

  // Standalone protected
  '/support',
  '/subscribe',
  '/search',
  '/briefing',

  // Legacy redirects
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

  // Me / Life workspace
  '/me',
  '/me/planner',
  '/me/settings',
  '/me/journal',
  '/me/reflection',

  // Finance workspace
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

// ---- Accumulators ----
const results = {};
const allConsoleErrors = [];
const allConsoleWarnings = [];
const allNetworkFailures = [];
const allSlowRequests = [];
const allJSErrors = [];
const allAuthRedirects = [];

function sanitizeRoute(route) {
  return route === '/' ? 'index' : route.replace(/[/?&=]/g, '_').replace(/^_/, '');
}

async function tryLogin(page) {
  for (const creds of CREDENTIALS) {
    console.log(`\nAttempting login with: ${creds.email}`);
    await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    // Fill form
    await page.fill('input[id="email"]', creds.email);
    await page.fill('input[id="password"]', creds.password);

    // Click submit
    await page.click('button[type="submit"]');

    // Wait for navigation — either redirect to dashboard or error toast
    try {
      await page.waitForURL((url) => {
        const path = url.pathname;
        return path !== '/login' && path !== '/';
      }, { timeout: 15000 });
    } catch {
      // Might still be on login page — check for toast
      const toastEl = await page.$('.datad-toast');
      if (toastEl) {
        const toastText = await toastEl.textContent();
        console.log(`  Login failed: ${toastText}`);
        continue;
      }
    }

    // Check if we're still on login
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log(`  Still on login page — credential set failed`);
      continue;
    }

    // Wait for dashboard to fully render
    await page.waitForTimeout(2000);
    try {
      await page.waitForFunction(() => {
        // Wait until no spinners/loaders visible and main content is present
        const loaders = document.querySelectorAll('.loader, [class*="spinner"], [class*="skeleton"]');
        return loaders.length === 0 || document.querySelector('[data-testid="dashboard"]') || document.querySelector('main');
      }, { timeout: 10000 });
    } catch {
      // ignore — dashboard may not have those selectors
    }
    await page.waitForTimeout(1000);

    console.log(`  Login successful! Final URL: ${page.url()}`);
    return true;
  }
  return false;
}

async function auditRoute(page, route) {
  const entry = {
    route,
    status: 'pending',
    finalUrl: null,
    statusCode: null,
    authRedirected: false,
    consoleErrors: [],
    consoleWarnings: [],
    networkFailures: [],
    slowRequests: [],
    jsErrors: [],
    timing: null,
    screenshot: null,
  };

  const startTime = Date.now();

  // Console listener
  const pageConsoleErrors = [];
  const pageConsoleWarnings = [];
  const onConsole = (msg) => {
    const text = msg.text();
    const location = msg.location();
    // Filter extension noise
    if (text.includes('chrome-extension') || text.includes('moz-extension')) return;
    if (msg.type() === 'error') {
      pageConsoleErrors.push({ text, location });
    } else if (msg.type() === 'warning') {
      pageConsoleWarnings.push({ text, location });
    }
  };
  page.on('console', onConsole);

  // Page error listener
  const pageJSErrors = [];
  const onPageError = (err) => {
    pageJSErrors.push({ message: err.message, stack: err.stack });
  };
  page.on('pageerror', onPageError);

  // Request failed listener
  const pageNetworkFailures = [];
  const onRequestFailed = (req) => {
    const url = req.url();
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

  // Slow request detection
  const pageSlowRequests = [];
  const requestStarts = {};
  const onRequest = (req) => {
    if (req.url().startsWith('http')) {
      requestStarts[req.url()] = Date.now();
    }
  };
  const onResponse = (res) => {
    const url = res.url();
    if (!url.startsWith('http')) return;
    const start = requestStarts[url];
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

    // Extra settle time for dynamic content
    await page.waitForTimeout(2500);

    const timing = Date.now() - startTime;
    entry.timing = timing;
    entry.finalUrl = page.url();
    entry.statusCode = response?.status() || null;

    // Check for auth redirect
    const finalPath = entry.finalUrl.replace(BASE_URL, '');
    if (finalPath.startsWith('/login')) {
      entry.authRedirected = true;
      allAuthRedirects.push({ route, finalUrl: entry.finalUrl });
    }

    // Screenshot
    const screenshotName = `${sanitizeRoute(route)}.png`;
    const screenshotPath = path.join(SCREENSHOT_DIR, screenshotName);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    entry.screenshot = screenshotName;
  } catch (err) {
    entry.status = 'crashed';
    entry.error = err.message;
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
  for (const e of pageConsoleErrors) allConsoleErrors.push({ ...e, route });
  for (const e of pageConsoleWarnings) allConsoleWarnings.push({ ...e, route });
  for (const e of pageNetworkFailures) allNetworkFailures.push({ ...e, route });
  for (const e of pageSlowRequests) allSlowRequests.push({ ...e, route });
  for (const e of pageJSErrors) allJSErrors.push({ ...e, route });

  // Cleanup
  page.off('console', onConsole);
  page.off('pageerror', onPageError);
  page.off('requestfailed', onRequestFailed);
  page.off('request', onRequest);
  page.off('response', onResponse);

  const authFlag = entry.authRedirected ? ' ⚠ AUTH REDIRECT' : '';
  entry.status = authFlag ? 'auth_redirect' : 'visited';
  results[route] = entry;

  console.log(`[${entry.statusCode}] ${route} → ${entry.finalUrl.replace(BASE_URL, '')} (${entry.timing}ms, ${pageConsoleErrors.length} errs, ${pageNetworkFailures.length} net failures)${authFlag}`);
}

async function main() {
  console.log('=== DATAD Authenticated Playwright Runtime Audit ===\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  });

  // ---- LOGIN PHASE ----
  console.log('--- Login Phase ---');
  const loginPage = await context.newPage();
  // Suppress browser console noise
  loginPage.on('console', () => {});

  const loggedIn = await tryLogin(loginPage);

  if (!loggedIn) {
    console.log('\n❌ All login attempts failed. Audit cannot proceed.');
    await browser.close();
    process.exit(1);
  }

  // Save auth state
  await context.storageState({ path: STATE_PATH });
  console.log(`\nAuth state saved to ${STATE_PATH}`);
  await loginPage.close();

  // ---- AUDIT PHASE ----
  console.log('\n--- Route Audit Phase ---');
  console.log(`Visiting ${ROUTES.length} routes with authenticated session...\n`);

  // Create new context from saved state
  const auditContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    storageState: STATE_PATH,
    ignoreHTTPSErrors: true,
  });

  const page = await auditContext.newPage();

  for (const route of ROUTES) {
    await auditRoute(page, route);
    await page.waitForTimeout(300);
  }

  await auditContext.close();
  await browser.close();

  // ---- WRITE RAW DATA ----
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'auth-audit-raw.json'),
    JSON.stringify({ results, allConsoleErrors, allConsoleWarnings, allNetworkFailures, allSlowRequests, allJSErrors, allAuthRedirects }, null, 2)
  );

  // ---- PRINT SUMMARY ----
  console.log('\n=== Audit Complete ===');
  console.log(`Total routes: ${ROUTES.length}`);
  console.log(`Auth redirects (unexpected): ${allAuthRedirects.length}`);
  console.log(`Console errors: ${allConsoleErrors.length}`);
  console.log(`Console warnings: ${allConsoleWarnings.length}`);
  console.log(`Network failures: ${allNetworkFailures.length}`);
  console.log(`Slow requests (>1s): ${allSlowRequests.length}`);
  console.log(`JS exceptions: ${allJSErrors.length}`);
  if (allAuthRedirects.length > 0) {
    console.log('\nAuth redirect details:');
    for (const ar of allAuthRedirects) {
      console.log(`  ${ar.route} → ${ar.finalUrl}`);
    }
  }
  console.log(`\nScreenshots: ${SCREENSHOT_DIR}`);
  console.log(`Raw data: ${path.join(OUTPUT_DIR, 'auth-audit-raw.json')}`);
}

main().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
