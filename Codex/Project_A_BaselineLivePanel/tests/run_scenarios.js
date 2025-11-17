import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, value] = arg.replace(/^--/, "").split("=");
  return [key, value ?? true];
}));
const mode = args.mode || "pre";
const resultsPath = args.results || path.resolve(__dirname, "../results", mode === "pre" ? "results_pre.json" : "results_post.json");
const logPath = args.log || path.resolve(__dirname, "../logs", mode === "pre" ? "log_pre.txt" : "log_post.txt");
const scenarioPath = path.resolve(__dirname, "../../test_scenarios.json");

const scenarios = JSON.parse(fs.readFileSync(scenarioPath, "utf8"));
const logLines = [];

const viewports = {
  mobile: { width: 390, height: 780 },
  desktop: { width: 1280, height: 800 }
};

const results = [];
let accessibilityChecks = 0;
let accessibilityPass = 0;

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  logLines.push(line);
  console.log(line);
}

async function requireElement(page, selector, description) {
  const handle = await page.$(selector);
  if (!handle) {
    throw new Error(`${description} (${selector}) missing`);
  }
  return handle;
}

async function runScenario(page, meta) {
  await page.goto(`http://localhost:3000/?scenario=${meta.id}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(200);
  await page.waitForSelector('[data-testid="status-area"]');

  const assertions = [];

  const statusVisible = await page.isVisible('[data-testid="status-area"]');
  const programVisible = await page.isVisible('[data-testid="program-panel"]');
  if (!statusVisible || !programVisible) {
    throw new Error("Missing core status/action areas");
  }
  assertions.push("Status/action sections rendered");

  switch (meta.id) {
    case "normal-flow":
      await page.selectOption('[data-testid="program-select"]', { index: 0 }).catch(() => {
        throw new Error("No program available to select");
      });
      await page.click('[data-testid="vote-button"]');
      await page.waitForFunction(() => {
        const el = document.getElementById("voteResult");
        return el && /Vote/.test(el.textContent || "");
      }, null, { timeout: 4000 });
      assertions.push("Vote confirmation visible");
      break;
    case "weak-network":
      await page.click('[data-testid="manual-refresh"]');
      await page.waitForTimeout(200);
      const statusText = await page.textContent('#statusMessage');
      if (!statusText?.toLowerCase().includes("refresh")) {
        throw new Error("Refresh message missing");
      }
      await page.fill('[data-testid="wall-input"]', 'Network echo');
      await page.click('[data-testid="wall-send"]');
      await page.waitForTimeout(1000);
      const failureText = await page.textContent('#wallResult');
      if (!failureText?.toLowerCase().includes("fail")) {
        throw new Error("Weak network failure message missing");
      }
      const retryButton = await page.$('#retryWall, [data-testid="retry-action"]');
      if (!retryButton) {
        throw new Error("Retry control missing");
      }
      await retryButton.click();
      await page.waitForFunction(() => {
        const el = document.getElementById('wallResult');
        return el && /Sent/.test(el.textContent || "");
      }, null, { timeout: 5000 });
      assertions.push("Retry succeeded");
      break;
    case "state-restriction":
      const voteDisabled = await page.getAttribute('[data-testid="vote-button"]', 'disabled');
      const queueDisabled = await page.getAttribute('[data-testid="queue-submit"]', 'disabled');
      if (!voteDisabled || !queueDisabled) {
        throw new Error("Actions should be disabled in paused state");
      }
      assertions.push("Pause disables controls");
      break;
    case "crowded-state":
      await requireElement(page, '[data-testid="tab-queue"]', "Reservation tab");
      await page.click('[data-testid="tab-queue"]');
      const queueText = await page.textContent('#queueDescription');
      if (!queueText?.toLowerCase().includes("queue")) {
        throw new Error("Queue metrics missing");
      }
      const queueWarning = await page.locator('[data-testid="queue-panel"]').textContent();
      if (!queueWarning?.toLowerCase().includes("queue")) {
        throw new Error("Crowded warning absent");
      }
      await page.fill('[data-testid="queue-name"]', 'Ava');
      await page.fill('[data-testid="queue-slot"]', '21:00');
      await page.click('[data-testid="queue-submit"]');
      await page.waitForFunction(() => {
        const el = document.getElementById('queueResult');
        return el && /Ava/.test(el.textContent || "");
      }, null, { timeout: 5000 });
      assertions.push("Reservation feedback visible");
      break;
    case "empty-state":
      const emptyText = await page.textContent('#programPanel');
      if (!emptyText?.toLowerCase().includes("no live programs")) {
        throw new Error("Empty state copy not found");
      }
      const voteDisabledEmpty = await page.getAttribute('[data-testid="vote-button"]', 'disabled');
      if (!voteDisabledEmpty) {
        throw new Error("Vote button should be disabled when there are no programs");
      }
      assertions.push("Empty state rendered");
      break;
    case "accessibility-nav":
      const wallTab = await page.$('[data-testid="tab-wall"]');
      if (wallTab) {
        await wallTab.focus();
        await page.keyboard.press('Enter');
      }
      await page.focus('[data-testid="wall-input"]');
      const focused = await page.evaluate(() => document.activeElement?.dataset?.testid);
      if (focused !== "wall-input") {
        throw new Error("Wall input not focusable via keyboard");
      }
      await page.keyboard.type('Accessibility ping', { delay: 10 });
      await page.keyboard.press('Control+Enter');
      await page.waitForFunction(() => {
        const el = document.getElementById('wallResult');
        return el && /Sent/.test(el.textContent || "");
      }, null, { timeout: 4000 });
      assertions.push("Keyboard submission works");
      break;
    default:
      throw new Error(`Scenario ${meta.id} not mapped`);
  }

  return assertions;
}

async function runAccessibilitySnapshot(page) {
  const snapshot = await page.evaluate(() => {
    const focusable = Array.from(document.querySelectorAll('button, a, input, select, textarea'))
      .filter((el) => !el.hasAttribute('disabled'))
      .length;
    const hasAriaStatus = !!document.querySelector('[role="status"]');
    const tabControls = document.querySelectorAll('[data-testid^="tab-"]').length;
    return { focusable, hasAriaStatus, tabControls };
  });
  accessibilityChecks += 1;
  if (snapshot.hasAriaStatus && snapshot.focusable >= 3) {
    accessibilityPass += 1;
  }
  return snapshot;
}

(async () => {
  const browser = await chromium.launch();
  try {
    for (const scenario of scenarios) {
      for (const vp of scenario.viewports) {
        const context = await browser.newContext({ viewport: viewports[vp] });
        const page = await context.newPage();
        const entry = {
          scenario: scenario.id,
          classification: scenario.classification,
          viewport: vp,
          passed: false,
          assertions: []
        };
        try {
          const assertions = await runScenario(page, scenario);
          const accessibility = await runAccessibilitySnapshot(page);
          entry.assertions = assertions;
          entry.accessibility = accessibility;
          entry.passed = true;
          log(`Scenario ${scenario.id} on ${vp} passed`);
        } catch (error) {
          entry.error = error.message;
          log(`Scenario ${scenario.id} on ${vp} failed: ${error.message}`);
        }
        results.push(entry);
        await context.close();
      }
    }
  } finally {
    await browser.close();
    const summary = {
      totalRuns: results.length,
      passed: results.filter((r) => r.passed).length,
      failed: results.filter((r) => !r.passed).length,
      edgeCaseRuns: results.filter((r) => r.classification !== 'normal').length,
      accessibilityChecks,
      accessibilityPass
    };
    fs.writeFileSync(resultsPath, JSON.stringify({ summary, results }, null, 2));
    fs.writeFileSync(logPath, logLines.join('\n'));
  }
})();
