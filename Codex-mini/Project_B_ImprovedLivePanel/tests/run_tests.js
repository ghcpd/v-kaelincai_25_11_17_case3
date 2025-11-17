const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const axeCore = require("axe-core");

const mode = process.env.RESULT_MODE || "post";
const projectRoot = path.resolve(__dirname, "..");
const logPath = path.join(projectRoot, "logs", `log_${mode}.txt`);
const resultsPath = path.join(projectRoot, "results", `results_${mode}.json`);
const scenarioPath = path.join(projectRoot, "data", "test_scenarios.json");

const logStream = fs.createWriteStream(logPath, { flags: "w" });
function log(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  logStream.write(line + "\n");
  console.log(line);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function validateTabs(page) {
  await page.click('button[data-tab="live"]');
  await page.waitForTimeout(200);
  assert(await page.isVisible("#tab-live"), "Live tab should be visible when activated");
  await page.click('button[data-tab="queue"]');
  await page.waitForTimeout(200);
  assert(await page.isVisible("#tab-queue"), "Queue tab should show queue data");
  await page.click('button[data-tab="program"]');
  await page.waitForTimeout(200);
}

async function runScenario(page, scenario) {
  await page.selectOption("#scenario-selector", scenario.id);
  await page.click("#load-scenario");
  await page.waitForTimeout(600);

  const name = await page.textContent("#installation-name");
  assert(name.includes(scenario.initialState.installationName), "Installation name mismatch");
  const stateText = await page.textContent("#status-state");
  assert(stateText.includes(scenario.initialState.installationState), "Installation state missing");

  await page.click("#refresh-now");
  await page.waitForTimeout(500);
  const refreshHint = await page.textContent("#refresh-hint");
  assert(/Last update/i.test(refreshHint), "Refresh hint did not update");

  await validateTabs(page);

  const actionsEnabled = scenario.initialState.installationState === "NORMAL";
  const voteDisabled = await page.isDisabled("#vote-theme");
  const messageDisabled = await page.isDisabled("#send-message");
  assert(voteDisabled === !actionsEnabled, "Vote button availability mismatch");
  assert(messageDisabled === !actionsEnabled, "Message button availability mismatch");

  if (actionsEnabled) {
    await page.click("#vote-theme");
    await page.waitForTimeout(900);
    const feedback = await page.textContent("#action-feedback");
    assert(/vote/i.test(feedback), "Vote feedback missing vote text");

    const testMessage = `Improved message ${scenario.id}`;
    await page.fill("#message-input", testMessage);
    await page.click("#send-message");
    await page.waitForTimeout(900);
    const messageFeedback = await page.textContent("#action-feedback");
    assert(/message/i.test(messageFeedback), "Message feedback missing text");
    if (scenario.networkBehavior.message.outcome === "failure") {
      assert(await page.isVisible("#retry-message"), "Retry button should show after failure");
    }
  }

  if (scenario.classification === "accessibility") {
    await page.addScriptTag({ content: axeCore.source });
    const axeResults = await page.evaluate(async () => await axe.run());
    const violations = axeResults.violations || [];
    log(`Accessibility check: ${violations.length} issues`);
    assert(violations.length === 0, `Accessibility violations: ${violations.map((v) => v.id).join(", ")}`);
  }
}

(async () => {
  const raw = fs.readFileSync(scenarioPath, "utf-8");
  const data = JSON.parse(raw);
  const scenarios = data.scenarios || [];
  const edgeScenarios = scenarios.filter((s) => s.classification !== "normal");

  const scenarioResults = [];
  let browser;
  let accessibilityChecks = 0;
  let accessibilityPasses = 0;

  try {
    browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });

    for (const scenario of scenarios) {
      const entry = { id: scenario.id, label: scenario.label, classification: scenario.classification, passed: true, issues: [] };
      try {
        log(`Evaluating scenario ${scenario.id}`);
        await runScenario(page, scenario);
      } catch (error) {
        entry.passed = false;
        entry.issues.push(error.message);
        log(`Scenario ${scenario.id} failed: ${error.message}`);
      }
      scenarioResults.push(entry);
      if (scenario.classification === "accessibility") {
        accessibilityChecks += 1;
        if (entry.passed) accessibilityPasses += 1;
      }
    }

    const summary = {
      scenariosExecuted: scenarios.length,
      passed: scenarioResults.filter((r) => r.passed).length,
      failed: scenarioResults.filter((r) => !r.passed).length,
      edgeCaseCoverage: Number((edgeScenarios.length / scenarios.length).toFixed(2)),
      accessibilityChecks,
      accessibilityPasses,
    };
    const record = { summary, scenarios: scenarioResults };
    fs.writeFileSync(resultsPath, JSON.stringify(record, null, 2));
    log(`Saved improved results to ${resultsPath}`);
  } catch (error) {
    log(`Execution error: ${error.message}`);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    logStream.end();
  }
})();
