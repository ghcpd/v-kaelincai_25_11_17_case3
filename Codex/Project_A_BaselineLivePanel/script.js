const scenarioPresets = {
  "normal-flow": {
    installationState: "NORMAL",
    network: "good",
    programs: ["Pulse Current", "River Echo"],
    messages: ["Welcome!", "Sunset wave just launched"],
    queueLength: 4
  },
  "weak-network": {
    installationState: "NORMAL",
    network: "weak",
    programs: ["Aurora Sync"],
    messages: ["Laggy tonight"],
    queueLength: 9
  },
  "state-restriction": {
    installationState: "PAUSED",
    network: "good",
    programs: ["Morning Bloom"],
    messages: [],
    queueLength: 14
  },
  "crowded-state": {
    installationState: "CROWDED",
    network: "good",
    programs: ["Skywave"],
    messages: ["Queue is 45 mins"],
    queueLength: 38
  },
  "empty-state": {
    installationState: "NORMAL",
    network: "good",
    programs: [],
    messages: ["New schedule at 21:00"],
    queueLength: 2
  },
  "accessibility-nav": {
    installationState: "NORMAL",
    network: "good",
    programs: ["Pulse Current"],
    messages: ["Tap to start"],
    queueLength: 1
  }
};

const networkProfiles = {
  good: { latency: 300, failFirst: false },
  weak: { latency: 1400, failFirst: true }
};

let currentScenarioKey = getScenarioFromQuery();
let currentData = JSON.parse(JSON.stringify(scenarioPresets[currentScenarioKey]));
let hasFailedOnce = currentData.network === "weak";

const els = {
  stateValue: document.getElementById("stateValue"),
  crowdValue: document.getElementById("crowdValue"),
  queueValue: document.getElementById("queueValue"),
  statusMessage: document.getElementById("statusMessage"),
  programList: document.getElementById("programList"),
  programSelect: document.getElementById("programSelect"),
  voteBtn: document.getElementById("voteBtn"),
  voteResult: document.getElementById("voteResult"),
  messageList: document.getElementById("messageList"),
  wallInput: document.getElementById("wallInput"),
  wallBtn: document.getElementById("wallBtn"),
  wallResult: document.getElementById("wallResult"),
  queueDescription: document.getElementById("queueDescription"),
  queueForm: document.getElementById("queueForm"),
  queueResult: document.getElementById("queueResult"),
  refreshBtn: document.getElementById("refreshBtn"),
  nameInput: document.getElementById("nameInput"),
  slotInput: document.getElementById("slotInput")
};

render();
setupEvents();

function getScenarioFromQuery() {
  const params = new URLSearchParams(location.search);
  const key = params.get("scenario");
  if (key && scenarioPresets[key]) {
    return key;
  }
  return "normal-flow";
}

function render() {
  els.stateValue.textContent = currentData.installationState;
  els.crowdValue.textContent = formatCrowd(currentData.installationState);
  els.queueValue.textContent = currentData.queueLength + " people";
  els.statusMessage.textContent = buildStatusMessage();
  renderPrograms();
  renderMessages();
  renderQueue();
  toggleInteractivity();
}

function setupEvents() {
  els.refreshBtn.addEventListener("click", () => {
    manualRefresh();
  });

  els.voteBtn.addEventListener("click", () => {
    if (els.voteBtn.disabled) return;
    const selected = els.programSelect.value;
    if (!selected) {
      els.voteResult.textContent = "Pick a program first.";
      return;
    }
    els.voteResult.textContent = "Submitting vote...";
    fakeRequest().then(() => {
      els.voteResult.textContent = `Vote for ${selected} recorded.`;
    }).catch(() => {
      els.voteResult.textContent = "Network lost. Try again.";
    });
  });

  els.wallBtn.addEventListener("click", submitMessage);
  els.wallInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      submitMessage();
    }
  });

  els.queueForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (els.queueForm.classList.contains("disabled")) return;
    const name = els.nameInput.value.trim();
    const slot = els.slotInput.value;
    if (!name || !slot) {
      els.queueResult.textContent = "Fill both fields.";
      return;
    }
    els.queueResult.textContent = "Reserving...";
    fakeRequest().then(() => {
      els.queueResult.textContent = `${name} added to queue for ${slot}.`;
      els.nameInput.value = "";
      els.slotInput.value = "";
    }).catch(() => {
      els.queueResult.textContent = "Reservation failed.";
    });
  });
}

function submitMessage() {
  if (els.wallBtn.disabled) return;
  const text = els.wallInput.value.trim();
  if (!text) {
    els.wallResult.textContent = "Enter a message";
    return;
  }
  els.wallResult.textContent = "Sending...";
  fakeRequest().then(() => {
    currentData.messages.unshift(text);
    renderMessages();
    els.wallInput.value = "";
    els.wallResult.textContent = "Sent to the live wall.";
  }).catch(() => {
    els.wallResult.innerHTML = 'Failed to send. <button type="button" id="retryWall" class="inline">Retry</button>';
    const retry = document.getElementById("retryWall");
    retry?.addEventListener("click", submitMessage);
  });
}

function renderPrograms() {
  els.programList.innerHTML = "";
  els.programSelect.innerHTML = "";
  if (!currentData.programs.length) {
    els.programList.innerHTML = '<p class="empty">No live programs right now.</p>';
    els.programSelect.disabled = true;
    els.voteBtn.disabled = true;
    return;
  }
  currentData.programs.forEach((program) => {
    const item = document.createElement("div");
    item.textContent = program;
    item.className = "program-item";
    els.programList.appendChild(item);

    const option = document.createElement("option");
    option.value = program;
    option.textContent = program;
    els.programSelect.appendChild(option);
  });
  els.programSelect.disabled = false;
  els.voteBtn.disabled = false;
}

function renderMessages() {
  els.messageList.innerHTML = "";
  currentData.messages.forEach((msg) => {
    const li = document.createElement("li");
    li.textContent = msg;
    els.messageList.appendChild(li);
  });
}

function renderQueue() {
  if (currentData.queueLength === 0) {
    els.queueDescription.textContent = "No wait time.";
  } else {
    els.queueDescription.textContent = `Queue currently ~${currentData.queueLength} visitors.`;
  }
}

function toggleInteractivity() {
  const disabled = ["PAUSED", "MAINTENANCE"].includes(currentData.installationState);
  [els.voteBtn, els.wallBtn].forEach((btn) => {
    btn.disabled = disabled;
  });
  els.wallInput.disabled = disabled;
  els.programSelect.disabled = disabled || !currentData.programs.length;
  els.queueForm.classList.toggle("disabled", disabled);
  Array.from(els.queueForm.elements).forEach((el) => {
    el.disabled = disabled;
  });
  if (disabled) {
    els.statusMessage.textContent = "Interactions unavailable during service pause.";
  }
}

function buildStatusMessage() {
  switch (currentData.installationState) {
    case "CROWDED":
      return "High demand. Expect longer waits.";
    case "PAUSED":
      return "Program paused, please stand by.";
    case "MAINTENANCE":
      return "Under maintenance. Actions offline.";
    default:
      return "Live and stable.";
  }
}

function manualRefresh() {
  els.statusMessage.textContent = "Refreshing status...";
  fakeRequest().then(() => {
    currentData = JSON.parse(JSON.stringify(scenarioPresets[currentScenarioKey]));
    hasFailedOnce = currentData.network === "weak";
    render();
  }).catch(() => {
    els.statusMessage.textContent = "Refresh failed.";
  });
}

function fakeRequest() {
  const profile = networkProfiles[currentData.network] || networkProfiles.good;
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (profile.failFirst && hasFailedOnce) {
        hasFailedOnce = false;
        reject(new Error("fail"));
        return;
      }
      resolve();
    }, profile.latency);
  });
}

function formatCrowd(state) {
  if (state === "CROWDED") return "Crowded";
  if (state === "PAUSED" || state === "MAINTENANCE") return "Offline";
  return "Comfortable";
}
