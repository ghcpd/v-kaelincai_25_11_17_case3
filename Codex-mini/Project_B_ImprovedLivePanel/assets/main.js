const selectors = {
  scenarioSelector: document.getElementById("scenario-selector"),
  loadButton: document.getElementById("load-scenario"),
  contrastToggle: document.getElementById("contrast-toggle"),
  refreshButton: document.getElementById("refresh-now"),
  statusState: document.getElementById("status-state"),
  installationName: document.getElementById("installation-name"),
  statusHint: document.getElementById("status-hint"),
  refreshHint: document.getElementById("refresh-hint"),
  statusCards: document.getElementById("status-cards"),
  themeSelect: document.getElementById("theme-select"),
  voteButton: document.getElementById("vote-theme"),
  messageInput: document.getElementById("message-input"),
  sendButton: document.getElementById("send-message"),
  retryButton: document.getElementById("retry-message"),
  feedback: document.getElementById("action-feedback"),
  optimisticHint: document.getElementById("optimistic-hint"),
  liveMessages: document.getElementById("live-messages"),
  queueLength: document.getElementById("queue-length"),
  queueNote: document.getElementById("queue-note"),
  queueSummary: document.getElementById("queue-summary"),
  programName: document.getElementById("program-name"),
  programTime: document.getElementById("program-time"),
};
const tabs = document.querySelectorAll(".tab-button");
const tabPanels = document.querySelectorAll(".tab-panel");
let scenarios = [];
let currentScenario = null;
let lastFailedMessage = "";

function logFeedback(message, tone = "info") {
  selectors.feedback.textContent = message;
  selectors.feedback.dataset.tone = tone;
}

function setTab(name) {
  tabs.forEach((tab) => {
    const isActive = tab.dataset.tab === name;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", isActive ? "true" : "false");
  });
  tabPanels.forEach((panel) => {
    panel.classList.toggle("hidden", panel.id !== `tab-${name}`);
  });
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    setTab(tab.dataset.tab);
  });
});
setTab("program");

function updateStatusCards(state) {
  const cards = [
    { title: "Crowd", value: `${state.crowdStatus} · ${state.queueLength} in queue`, tone: state.crowdStatus },
    { title: "Queue", value: `${state.queueLength}`, detail: state.queueNote || "Projected steady flow" },
    { title: "Network", value: state.networkCondition, detail: "Latency aware" },
    { title: "Next Program", value: state.nextProgram || "No program soon", detail: state.nextProgram ? "Reserve now" : "Explore others" },
  ];
  selectors.statusCards.innerHTML = cards
    .map(
      (card) => `
      <article class="rounded-2xl border border-white/5 bg-slate-900/80 p-4 shadow-lg shadow-black/50">
        <p class="text-xs uppercase tracking-[0.4em] text-slate-400">${card.title}</p>
        <p class="text-xl font-semibold text-white">${card.value}</p>
        <p class="text-sm text-slate-400">${card.detail || ""}</p>
      </article>`
    )
    .join("\n");
}

function renderPrograms(state) {
  const programs = state.programs || [];
  const primary = programs[0] || { name: "Upcoming program", time: "—", themes: ["City Pulse", "Lumen"] };
  selectors.programName.textContent = primary.name;
  selectors.programTime.textContent = primary.time;
  selectors.themeSelect.innerHTML = primary.themes
    .map((theme) => `<option value="${theme}">${theme}</option>`)
    .join("\n");
  selectors.optimisticHint.textContent = state.optimisticHint || "Actions show optimistic updates under weak networks.";
}

function renderLiveWall(state) {
  const messages = state.messages || [];
  selectors.liveMessages.innerHTML = messages
    .map((message) => `<li class="rounded-xl border border-white/5 bg-slate-900/80 px-3 py-2">${message}</li>`)
    .join("\n");
}

function renderQueue(state) {
  selectors.queueLength.textContent = state.queueLength;
  selectors.queueNote.textContent = state.queueNote || "Next slot showing soon.";
  selectors.queueSummary.innerHTML = `
    <p>State: <strong>${state.installationState}</strong></p>
    <p>Hint: ${state.actionHint || "Queue operates adaptively."}</p>
  `;
}

function setActionAvailability(state) {
  const disabled = state.installationState !== "NORMAL";
  selectors.voteButton.disabled = disabled;
  selectors.sendButton.disabled = disabled;
  selectors.messageInput.disabled = disabled;
  selectors.retryButton.disabled = disabled;
}

function loadScenarioData(scenario) {
  currentScenario = scenario;
  selectors.statusState.textContent = scenario.initialState.installationState;
  selectors.installationName.textContent = scenario.initialState.installationName;
  selectors.statusHint.textContent = scenario.initialState.actionHint || "Status updated. Move between tabs to explore.";
  updateStatusCards(scenario.initialState);
  renderPrograms(scenario.initialState);
  renderLiveWall(scenario.initialState);
  renderQueue(scenario.initialState);
  setActionAvailability(scenario.initialState);
  logFeedback(`Loaded ${scenario.label}.`, scenario.initialState.installationState === "NORMAL" ? "success" : "error");
  updateRefreshHint();
}

function updateRefreshHint() {
  selectors.refreshHint.textContent = `Last update: ${new Date().toLocaleTimeString()}`;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getNetworkBehavior(action) {
  return currentScenario.networkBehavior?.[action] || { latency: 400, outcome: "success" };
}

async function simulateNetworkAction(action) {
  const behavior = getNetworkBehavior(action);
  await delay(behavior.latency);
  if (behavior.outcome === "success") {
    return behavior.result || "ok";
  }
  throw new Error(behavior.message || "Network error");
}

selectors.voteButton.addEventListener("click", async () => {
  if (!currentScenario) return;
  selectors.voteButton.disabled = true;
  const selection = selectors.themeSelect.value;
  logFeedback(`Voting for ${selection} — optimistic update...`, "pending");
  try {
    await simulateNetworkAction("vote");
    logFeedback(`Vote for ${selection} confirmed!`, "success");
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
  selectors.retryButton.classList.add("hidden");
  logFeedback("Sending message with optimistic write...", "pending");
  lastFailedMessage = message;
  try {
    await simulateNetworkAction("message");
    selectors.liveMessages.insertAdjacentHTML("afterbegin", `<li class="rounded-xl border border-white/5 bg-slate-900/80 px-3 py-2"><strong>You:</strong> ${message}</li>`);
    logFeedback("Message delivered live!", "success");
    selectors.messageInput.value = "";
  } catch (error) {
    logFeedback(error.message, "error");
    selectors.retryButton.classList.remove("hidden");
  } finally {
    selectors.sendButton.disabled = currentScenario.initialState.installationState !== "NORMAL";
    selectors.retryButton.disabled = currentScenario.initialState.installationState !== "NORMAL";
  }
});

selectors.retryButton.addEventListener("click", async () => {
  if (!lastFailedMessage) {
    logFeedback("Nothing to retry.", "info");
    return;
  }
  selectors.retryButton.disabled = true;
  selectors.retryButton.classList.add("hidden");
  selectors.messageInput.value = lastFailedMessage;
  selectors.sendButton.click();
});

selectors.refreshButton.addEventListener("click", async () => {
  if (!currentScenario) return;
  logFeedback("Manual refresh triggered...", "pending");
  selectors.refreshButton.disabled = true;
  await delay(450);
  loadScenarioData(currentScenario);
  selectors.refreshButton.disabled = false;
});

selectors.loadButton.addEventListener("click", () => {
  const selected = selectors.scenarioSelector.value;
  const scenario = scenarios.find((record) => record.id === selected);
  if (scenario) {
    loadScenarioData(scenario);
  }
});

selectors.contrastToggle.addEventListener("click", () => {
  const isHigh = document.body.getAttribute("data-high-contrast") === "true";
  document.body.setAttribute("data-high-contrast", isHigh ? "false" : "true");
  selectors.contrastToggle.textContent = isHigh ? "High contrast" : "Normal contrast";
});

fetch("data/test_scenarios.json")
  .then((res) => res.json())
  .then((data) => {
    scenarios = data.scenarios || [];
    scenarios.forEach((scenario) => {
      const option = document.createElement("option");
      option.value = scenario.id;
      option.textContent = `${scenario.id} · ${scenario.label}`;
      selectors.scenarioSelector.appendChild(option);
    });
    if (scenarios.length) {
      selectors.scenarioSelector.value = scenarios[0].id;
      loadScenarioData(scenarios[0]);
    }
  })
  .catch((error) => {
    logFeedback(`Failed to load scenarios: ${error.message}`, "error");
  });
