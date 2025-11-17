const selectors = {
  scenarioSelector: document.getElementById("scenario-selector"),
  loadScenario: document.getElementById("load-scenario"),
  refresh: document.getElementById("refresh-data"),
  statusGrid: document.getElementById("status-grid"),
  programList: document.getElementById("program-list"),
  liveMessages: document.getElementById("live-messages"),
  themeSelect: document.getElementById("theme-select"),
  voteButton: document.getElementById("vote-theme"),
  messageInput: document.getElementById("message-input"),
  sendButton: document.getElementById("send-message"),
  feedback: document.getElementById("interaction-feedback"),
};

let scenarios = [];
let currentScenario = null;

function logFeedback(message, tone = "info") {
  selectors.feedback.textContent = message;
  selectors.feedback.dataset.tone = tone;
}

function renderStatusTiles(state) {
  const mapping = [
    { label: "Installation", value: state.installationName },
    { label: "State", value: state.installationState },
    { label: "Crowd", value: `${state.crowdStatus} • ${state.queueLength} in queue` },
    { label: "Next program", value: state.nextProgram || "Not scheduled" },
    { label: "Network", value: state.networkCondition },
  ];
  selectors.statusGrid.innerHTML = mapping
    .map(
      ({ label, value }) =>
        `<article class="status-card"><strong>${label}</strong><p>${value}</p></article>`
    )
    .join(" ");
}

function renderPrograms(state) {
  if (!state.programs?.length) {
    selectors.programList.innerHTML = "<li class=\"empty\">No programs are scheduled soon.</li>";
    return;
  }
  selectors.programList.innerHTML = state.programs
    .map(
      (program) =>
        `<li><span class=\"program-name\">${program.name}</span><span class=\"program-time\">${program.time}</span></li>`
    )
    .join("\n");
}

function renderMessages(state) {
  selectors.liveMessages.innerHTML = state.messages
    .map((message) => `<li>${message}</li>`)
    .join("\n");
}

function renderThemeOptions(state) {
  const themes = state.programs?.[0]?.themes || ["City Glow", "Ambient Pulse"].slice(0, 2);
  selectors.themeSelect.innerHTML = themes.map((value) => `<option>${value}</option>`).join("\n");
}

function updateActionAvailability(state) {
  const disabled = state.installationState !== "NORMAL";
  selectors.voteButton.disabled = disabled;
  selectors.sendButton.disabled = disabled;
  selectors.messageInput.disabled = disabled;
  if (state.actionHint && disabled) {
    logFeedback(state.actionHint, "error");
  }
}

function loadScenarioById(id) {
  const scenario = scenarios.find((record) => record.id === id);
  if (!scenario) {
    logFeedback("Scenario not found", "error");
    return;
  }
  currentScenario = scenario;
  renderStatusTiles(scenario.initialState);
  renderPrograms(scenario.initialState);
  renderMessages(scenario.initialState);
  renderThemeOptions(scenario.initialState);
  updateActionAvailability(scenario.initialState);
  if (scenario.initialState.installationState === "NORMAL") {
    logFeedback(`Loaded ${scenario.label} — interactions enabled`, "success");
  } else {
    logFeedback(`Loaded ${scenario.label} — ${scenario.initialState.actionHint || "Interactions paused"}`, "error");
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function simulateNetworkAction(action) {
  const behavior = (currentScenario?.networkBehavior?.[action]) || { latency: 400, outcome: "success" };
  return delay(behavior.latency).then(() => {
    if (behavior.outcome === "success") {
      return behavior.result || "ok";
    }
    return Promise.reject(new Error(behavior.message || "Network failure"));
  });
}

selectors.loadScenario.addEventListener("click", () => {
  const selected = selectors.scenarioSelector.value;
  loadScenarioById(selected);
});

selectors.refresh.addEventListener("click", async () => {
  if (!currentScenario) return;
  logFeedback("Refreshing data...", "pending");
  await delay(300);
  renderStatusTiles(currentScenario.initialState);
  logFeedback("Data refreshed", "info");
});

selectors.voteButton.addEventListener("click", async () => {
  if (!currentScenario) return;
  selectors.voteButton.disabled = true;
  logFeedback("Submitting your vote...", "pending");
  try {
    await simulateNetworkAction("vote");
    logFeedback("Vote received. Thanks!", "success");
  } catch (error) {
    logFeedback(error.message, "error");
  } finally {
    selectors.voteButton.disabled = currentScenario.initialState.installationState !== "NORMAL";
  }
});

selectors.sendButton.addEventListener("click", async () => {
  if (!currentScenario) return;
  const message = selectors.messageInput.value.trim();
  if (!message) {
    logFeedback("Type a message before sending.", "error");
    return;
  }
  selectors.sendButton.disabled = true;
  logFeedback("Pushing to live wall...", "pending");
  try {
    await simulateNetworkAction("message");
    selectors.liveMessages.insertAdjacentHTML("afterbegin", `<li><strong>You:</strong> ${message}</li>`);
    selectors.messageInput.value = "";
    logFeedback("Message live!", "success");
  } catch (error) {
    logFeedback(error.message, "error");
  } finally {
    selectors.sendButton.disabled = currentScenario.initialState.installationState !== "NORMAL";
  }
});

fetch("data/test_scenarios.json")
  .then((res) => res.json())
  .then((data) => {
    scenarios = data.scenarios || [];
    scenarios.forEach((record) => {
      const option = document.createElement("option");
      option.value = record.id;
      option.textContent = `${record.id} · ${record.label}`;
      selectors.scenarioSelector.appendChild(option);
    });
    if (scenarios.length) {
      selectors.scenarioSelector.value = scenarios[0].id;
      loadScenarioById(scenarios[0].id);
    }
  })
  .catch((error) => {
    logFeedback(`Unable to load scenarios: ${error.message}`, "error");
  });
