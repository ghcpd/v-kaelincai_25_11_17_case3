const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const axeCore = require("axe-core");

const mode = process.env.RESULT_MODE || "pre";
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

async function runScenario(page, scenario) {
  const statusSelector = "#status-grid";
  const voteButton = page.locator("#vote-theme");
  const sendButton = page.locator("#send-message");
  const feedback = page.locator("#interaction-feedback");
  const programs = scenario.initialState.programs || [];

  await page.selectOption("#scenario-selector", scenario.id);
  await page.click("#load-scenario");
  await page.waitForTimeout(600);

  const statusText = await page.textContent(statusSelector);
  assert(statusText && statusText.includes(scenario.initialState.installationState), "Status does not surface the correct installation state");
  assert(statusText.includes(String(scenario.initialState.queueLength)), "Queue length missing from status");

  if (programs.length === 0) {
    const programText = await page.textContent("#program-list");
    assert(programText && programText.toLowerCase().includes("no programs"), "Empty state not described");
  } else {
    const firstProgram = programs[0].name;
    const programListText = await page.textContent("#program-list");
    assert(programListText && programListText.includes(firstProgram), "Program list missing expected entry");
  }

  const actionsEnabled = scenario.initialState.installationState === "NORMAL";
  const voteDisabled = await voteButton.isDisabled();
  const sendDisabled = await sendButton.isDisabled();
  assert(voteDisabled === !actionsEnabled, "Vote button state does not match installation availability");
  assert(sendDisabled === !actionsEnabled, "Message button state does not match installation availability");

  await page.setViewportSize({ width: 375, height: 800 });
  const statusVisibleOnMobile = await page.isVisible(statusSelector);
  assert(statusVisibleOnMobile, "Status grid should remain visible on mobile layout");
  await page.setViewportSize({ width: 1280, height: 720 });

  if (actionsEnabled) {
    await voteButton.click();
    await page.waitForTimeout(900);
    const voteFeedback = await feedback.textContent();
    const expectedVoteOutcome = scenario.networkBehavior.vote.outcome;
    if (expectedVoteOutcome === "success") {
      assert(voteFeedback.toLowerCase().includes("vote"), "Vote feedback missing success indication");
    }

    const testMessage = `Automated message ${scenario.id}`;
    await page.fill("#message-input", testMessage);
    await sendButton.click();
    await page.waitForTimeout(900);
    const messageFeedback = await feedback.textContent();
    assert(messageFeedback.toLowerCase().includes("message"), "Message feedback should include reference to result");
  }

  if (scenario.classification === "accessibility") {
    await page.addScriptTag({ content: axeCore.source });
    const axeResults = await page.evaluate(async () => {
      return await axe.run();
    });
    const violations = axeResults.violations || [];
    log(`Accessibility scan: ${violations.length} violation(s)`);
    assert(violations.length === 0, `Accessibility issues detected: ${violations.map((v) => v.id).join(", ")}`);
  }
}

(async () => {
  const raw = fs.readFileSync(scenarioPath, "utf-8");
  const data = JSON.parse(raw);
  const scenarios = data.scenarios || [];
  const edgeScenarios = scenarios.filter((s) => s.classification !== "normal");

  let browser;
  const scenarioResults = [];
  let accessibilityChecks = 0;
  let accessibilityPasses = 0;

  try {
    browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });

    for (const scenario of scenarios) {
      const result = { id: scenario.id, label: scenario.label, classification: scenario.classification, passed: true, issues: [] };
      try {
        log(`Running scenario ${scenario.id}`);
        await runScenario(page, scenario);
      } catch (error) {
        result.passed = false;
        result.issues.push(error.message);
        log(`Scenario ${scenario.id} failed: ${error.message}`);
      }
      scenarioResults.push(result);
      if (scenario.classification === "accessibility") {
        accessibilityChecks += 1;
        if (result.passed) {
          accessibilityPasses += 1;
        }
      }
    }

    const summary = {
      scenariosExecuted: scenarios.length,
      passed: scenarioResults.filter((row) => row.passed).length,
      failed: scenarioResults.filter((row) => !row.passed).length,
      edgeCaseCoverage: Number((edgeScenarios.length / scenarios.length).toFixed(2)),
      accessibilityChecks: accessibilityChecks,
      accessibilityPasses: accessibilityPasses,
    };

    const record = { summary, scenarios: scenarioResults };
    fs.writeFileSync(resultsPath, JSON.stringify(record, null, 2));
    log(`Saved results to ${resultsPath}`);
  } catch (error) {
    log(`Execution error: ${error.message}`);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    logStream.end();
  }
})();
