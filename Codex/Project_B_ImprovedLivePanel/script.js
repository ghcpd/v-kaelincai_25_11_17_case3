const scenarioPresets = {
  "normal-flow": {
    installationState: "NORMAL",
    network: "good",
    health: "Nominal",
    programs: ["Pulse Current", "River Echo"],
    messages: ["Welcome to the riverfront wall", "Vote closes in 5 min"],
    queueLength: 4,
    queueTone: "Short wait"
  },
  "weak-network": {
    installationState: "NORMAL",
    network: "weak",
    health: "Sensors throttled",
    programs: ["Aurora Sync"],
    messages: ["Weak link detected"],
    queueLength: 9,
    queueTone: "Expect short delays"
  },
  "state-restriction": {
    installationState: "PAUSED",
    network: "good",
    health: "Paused for calibration",
    programs: ["Morning Bloom"],
    messages: ["Paused for choreography upload"],
    queueLength: 14,
    queueTone: "Queue frozen"
  },
  "crowded-state": {
    installationState: "CROWDED",
    network: "good",
    health: "Nominal",
    programs: ["Skywave"],
    messages: ["Queue is 45 mins"],
    queueLength: 38,
    queueTone: "High wait"
  },
  "empty-state": {
    installationState: "NORMAL",
    network: "good",
    health: "Nominal",
    programs: [],
    messages: ["Next slot at 21:00"],
    queueLength: 2,
    queueTone: "Relaxed"
  },
  "accessibility-nav": {
    installationState: "NORMAL",
    network: "good",
    health: "Nominal",
    programs: ["Pulse Current"],
    messages: ["Use keyboard to navigate"],
    queueLength: 1,
    queueTone: "Walk-up"
  }
};

const networkProfiles = {
  good: { latency: 350, failFirst: false },
  weak: { latency: 1600, failFirst: true }
};

const stateCopy = {
  NORMAL: {
    message: "Pick a program and engage live.",
    meter: 35,
    tone: "Comfortable"
  },
  CROWDED: {
    message: "High demand. Manual refresh recommended.",
    meter: 85,
    tone: "Crowded"
  },
  PAUSED: {
    message: "Service paused. Actions disabled.",
    meter: 5,
    tone: "Offline"
  },
  MAINTENANCE: {
    message: "Maintenance ongoing.",
    meter: 5,
    tone: "Offline"
  }
};

const clone = (value) => typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
const scenarioKey = getScenarioFromQuery();
let currentData = clone(scenarioPresets[scenarioKey]);
let failOnce = networkProfiles[currentData.network]?.failFirst ?? false;

const ui = {
  stateValue: document.getElementById("stateValue"),
  statusMessage: document.getElementById("statusMessage"),
  crowdValue: document.getElementById("crowdValue"),
  crowdMeter: document.getElementById("crowdMeter"),
  queueValue: document.getElementById("queueValue"),
  queueTone: document.getElementById("queueTone"),
  healthState: document.getElementById("healthState"),
  lastUpdated: document.getElementById("lastUpdated"),
  refreshBtn: document.querySelector('[data-testid="manual-refresh"]'),
  tabs: Array.from(document.querySelectorAll('.tab')),
  programList: document.getElementById("programList"),
  programSelect: document.getElementById("programSelect"),
  voteBtn: document.getElementById("voteBtn"),
  voteResult: document.getElementById("voteResult"),
  messageList: document.getElementById("messageList"),
  wallInput: document.getElementById("wallInput"),
  wallBtn: document.getElementById("wallBtn"),
  wallRetry: document.getElementById("wallRetry"),
  wallResult: document.getElementById("wallResult"),
  queueDescription: document.getElementById("queueDescription"),
  queueForm: document.getElementById("queueForm"),
  queueResult: document.getElementById("queueResult"),
  nameInput: document.getElementById("nameInput"),
  slotInput: document.getElementById("slotInput")
};

renderAll();
attachEvents();

function getScenarioFromQuery() {
  const params = new URLSearchParams(location.search);
  const key = params.get("scenario");
  return scenarioPresets[key] ? key : "normal-flow";
}

function renderAll() {
  const decorations = stateCopy[currentData.installationState] || stateCopy.NORMAL;
  ui.stateValue.textContent = currentData.installationState;
  ui.statusMessage.textContent = decorations.message;
  ui.crowdValue.textContent = decorations.tone;
  ui.crowdMeter.style.width = `${decorations.meter}%`;
  ui.queueValue.textContent = `${currentData.queueLength} visitors`;
  ui.queueTone.textContent = currentData.queueTone;
  ui.healthState.textContent = currentData.health;
  ui.lastUpdated.textContent = `Updated ${new Date().toLocaleTimeString()}`;
  renderPrograms();
  renderMessages();
  renderQueue();
  toggleActionAvailability();
}

function attachEvents() {
  ui.refreshBtn.addEventListener("click", () => {
    manualRefresh();
  });
  ui.tabs.forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab));
    tab.addEventListener("keydown", (evt) => {
      if (!['ArrowRight', 'ArrowLeft'].includes(evt.key)) return;
      evt.preventDefault();
      const idx = ui.tabs.indexOf(tab);
      const nextIdx = evt.key === 'ArrowRight' ? (idx + 1) % ui.tabs.length : (idx - 1 + ui.tabs.length) % ui.tabs.length;
      switchTab(ui.tabs[nextIdx], true);
      ui.tabs[nextIdx].focus();
    });
  });
  ui.voteBtn.addEventListener("click", handleVote);
  ui.wallBtn.addEventListener("click", () => handleMessage());
  ui.wallRetry.addEventListener("click", () => handleMessage(true));
  ui.wallInput.addEventListener("keydown", (evt) => {
    if (evt.key === "Enter" && (evt.ctrlKey || evt.metaKey)) {
      evt.preventDefault();
      handleMessage();
    }
  });
  ui.queueForm.addEventListener("submit", (evt) => {
    evt.preventDefault();
    handleReservation();
  });
}

function switchTab(tab, silent = false) {
  ui.tabs.forEach((btn) => btn.setAttribute("aria-selected", String(btn === tab)));
  document.querySelectorAll('.panel').forEach((panel) => {
    panel.classList.toggle('active', panel.id === tab.getAttribute("aria-controls"));
  });
  if (!silent) {
    const announce = `${tab.textContent?.trim()} view active`;
    ui.statusMessage.textContent = announce;
    setTimeout(renderStatusMessage, 1200);
  }
}

function renderStatusMessage() {
  ui.statusMessage.textContent = stateCopy[currentData.installationState]?.message ?? "";
}

function renderPrograms() {
  ui.programList.innerHTML = "";
  ui.programSelect.innerHTML = "";
  if (!currentData.programs.length) {
    const card = document.createElement("div");
    card.className = "message-card text-slate-200";
    card.textContent = "No upcoming programs. Explore other installations nearby.";
    ui.programList.appendChild(card);
    ui.programSelect.disabled = true;
    ui.voteBtn.disabled = true;
    return;
  }
  currentData.programs.forEach((program, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "message-card text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-300";
    card.dataset.program = program;
    card.textContent = program;
    card.addEventListener("click", () => {
      ui.programSelect.value = program;
    });
    ui.programList.appendChild(card);

    const option = document.createElement("option");
    option.value = program;
    option.textContent = program;
    if (index === 0) option.selected = true;
    ui.programSelect.appendChild(option);
  });
  ui.programSelect.disabled = false;
  ui.voteBtn.disabled = false;
}

function renderMessages() {
  ui.messageList.innerHTML = "";
  currentData.messages.forEach((text) => {
    const li = document.createElement("li");
    li.textContent = text;
    li.className = "message-card";
    ui.messageList.appendChild(li);
  });
}

function renderQueue() {
  ui.queueDescription.textContent = currentData.queueLength > 0
    ? `Queue currently ~${currentData.queueLength} people. ${currentData.queueTone}`
    : "No wait. Walk right in.";
}

function toggleActionAvailability() {
  const disabled = ["PAUSED", "MAINTENANCE"].includes(currentData.installationState);
  [ui.voteBtn, ui.wallBtn, ui.wallRetry].forEach((btn) => {
    btn.disabled = disabled;
  });
  [ui.wallInput, ui.programSelect, ui.nameInput, ui.slotInput].forEach((el) => {
    el.disabled = disabled || (el === ui.programSelect && !currentData.programs.length);
  });
  ui.queueForm.querySelector('[data-testid="queue-submit"]').disabled = disabled;
  if (disabled) {
    ui.voteResult.textContent = "Interactions disabled during pause.";
    ui.wallResult.textContent = "Unavailable";
    ui.queueResult.textContent = "Unavailable";
  } else {
    ui.voteResult.textContent = "";
    ui.wallResult.textContent = "";
    ui.queueResult.textContent = "";
  }
}

function manualRefresh() {
  ui.refreshBtn.disabled = true;
  ui.refreshBtn.textContent = "Refreshing...";
  simulateNetwork("refresh").then(() => {
    currentData = clone(scenarioPresets[scenarioKey]);
    failOnce = networkProfiles[currentData.network]?.failFirst ?? false;
    renderAll();
  }).catch(() => {
    ui.statusMessage.textContent = "Refresh failed. Retry soon.";
  }).finally(() => {
    ui.refreshBtn.disabled = false;
    ui.refreshBtn.textContent = "Refresh Status";
  });
}

function handleVote() {
  if (ui.voteBtn.disabled) return;
  const selected = ui.programSelect.value;
  ui.voteResult.dataset.state = "";
  if (!selected) {
    ui.voteResult.textContent = "Pick a program";
    return;
  }
  ui.voteResult.textContent = "Submitting vote...";
  simulateNetwork("vote").then(() => {
    ui.voteResult.dataset.state = "success";
    ui.voteResult.textContent = `Vote for ${selected} locked in.`;
  }).catch(() => {
    ui.voteResult.dataset.state = "error";
    ui.voteResult.textContent = "Failed to submit vote.";
  });
}

function handleMessage(isRetry = false) {
  if (ui.wallBtn.disabled) return;
  const text = ui.wallInput.value.trim();
  if (!text) {
    ui.wallResult.textContent = "Add a message";
    return;
  }
  if (!isRetry) {
    currentData.messages.unshift(`${text} (sending...)`);
    renderMessages();
  }
  ui.wallResult.textContent = "Sending...";
  ui.wallRetry.classList.add("hidden");
  simulateNetwork("message").then(() => {
    currentData.messages[0] = text;
    renderMessages();
    ui.wallInput.value = "";
    ui.wallResult.dataset.state = "success";
    ui.wallResult.textContent = "Message posted";
  }).catch(() => {
    ui.wallResult.dataset.state = "error";
    ui.wallResult.textContent = "Failed to post.";
    ui.wallRetry.classList.remove("hidden");
  });
}

function handleReservation() {
  if (ui.queueForm.querySelector('[data-testid="queue-submit"]').disabled) return;
  const name = ui.nameInput.value.trim();
  const slot = ui.slotInput.value;
  if (!name || !slot) {
    ui.queueResult.textContent = "Fill name and slot";
    return;
  }
  ui.queueResult.textContent = "Submitting...";
  simulateNetwork("queue").then(() => {
    ui.queueResult.dataset.state = "success";
    ui.queueResult.textContent = `${name} added for ${slot}`;
    ui.nameInput.value = "";
    ui.slotInput.value = "";
  }).catch(() => {
    ui.queueResult.dataset.state = "error";
    ui.queueResult.textContent = "Queue request failed";
  });
}

function simulateNetwork(type) {
  const profile = networkProfiles[currentData.network] || networkProfiles.good;
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (profile.failFirst && failOnce && type === "message") {
        failOnce = false;
        reject(new Error("network"));
        return;
      }
      resolve();
    }, profile.latency);
  });
}
