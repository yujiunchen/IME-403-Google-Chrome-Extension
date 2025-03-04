document.addEventListener("DOMContentLoaded", () => {
  /***************************************************************
   * Shared Countdown Helpers
   ***************************************************************/
  function getRemainingTime(timer) {
    if (!timer.dailyLimit || timer.dailyLimit <= 0) return Infinity;
    const spent = timer.timeSpentToday || 0;
    const lastUpdated = timer.lastUpdated || Date.now();
    const elapsed = Math.floor((Date.now() - lastUpdated) / 1000);
    let remaining = timer.dailyLimit - (spent + elapsed);
    return remaining < 0 ? 0 : remaining;
  }

  function updateTimerCountdown(element, timer) {
    if (!timer.enabled) {
      element.textContent = "Timer paused";
      return;
    }
    const remaining = getRemainingTime(timer);
    if (remaining === Infinity) {
      element.textContent = "Unlimited";
      return;
    }
    const hours = Math.floor(remaining / 3600);
    const remainder = remaining % 3600;
    const minutes = Math.floor(remainder / 60);
    const seconds = remainder % 60;
    element.textContent = `${hours}h ${minutes}m ${seconds}s remaining`;
  }

  function getLiveRemaining(timer) {
    if (!timer.dailyLimit || timer.dailyLimit <= 0) return Infinity;
    const spent = timer.timeSpentToday || 0;
    const lastUpdated = timer.lastUpdated || Date.now();
    const elapsed = Math.floor((Date.now() - lastUpdated) / 1000);
    let remaining = timer.dailyLimit - (spent + elapsed);
    return remaining < 0 ? 0 : remaining;
  }

  /***************************************************************
   * Global Variables & DOM References
   ***************************************************************/
  let timers = []; // will be loaded from storage

  // Tab Switching Elements
  const tabButtons = document.querySelectorAll(".tab-btn");
  const homeTab = document.getElementById("home");
  const screenTimeTab = document.getElementById("screenTime");
  const analyticsTab = document.getElementById("analytics");

  // Timer page elements
  const addTimerBtn = document.getElementById("addTimerBtn");
  const enableAllBtn = document.getElementById("enableAllBtn");
  const timersFilter = document.getElementById("timersFilter");
  const timersList = document.getElementById("timersList");
  const timersCount = document.getElementById("timersCount");

  // Add Timer Modal elements
  const addTimerModal = document.getElementById("addTimerModal");
  const closeAddModalBtn = document.getElementById("closeAddModal");
  const displayNameInput = document.getElementById("displayName");
  const newSiteURLInput = document.getElementById("newSiteURL");
  const limitHoursSelect = document.getElementById("limitHours");
  const limitMinutesSelect = document.getElementById("limitMinutes");
  const limitSecondsSelect = document.getElementById("limitSeconds");
  const saveAddTimerBtn = document.getElementById("saveAddTimer");

  // Edit Timer Modal elements
  const editTimerModal = document.getElementById("editTimerModal");
  const closeEditModal = document.getElementById("closeEditModal");
  const editTimerUrl = document.getElementById("editTimerUrl");
  const editTimerLimit = document.getElementById("editTimerLimit");
  const saveEditTimer = document.getElementById("saveEditTimer");
  let currentEditId = null;

  // Motivational Messages
  const shuffleBtn = document.getElementById("shuffleBtn");
  const motivationEl = document.getElementById("motivationMessage");
  const motivationalMessages = [
    "Believe in yourself and all that you are.",
    "Small steps can lead to big changes.",
    "Progress is progress, no matter how small.",
    "Every day is a chance to get better.",
    "Stay positive; work hard; make it happen.",
    "Your potential is endless.",
    "One day at a time, one task at a time.",
    "Focus on the journey, not just the destination.",
    "Difficult roads often lead to beautiful destinations.",
    "Strive for progress, not perfection.",
    "Believe you can and you're halfway there."
    // ... (expand up to 500 messages as needed)
  ];

  /***************************************************************
   * Tab Switching Logic
   ***************************************************************/
  tabButtons.forEach(btn => {
    btn.addEventListener("click", function () {
      tabButtons.forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(tc => tc.classList.remove("active"));
      const targetTab = this.getAttribute("data-tab");
      document.getElementById(targetTab).classList.add("active");
      this.classList.add("active");
      if (targetTab === "analytics") {
        loadAnalytics();
      }
    });
  });

  /***************************************************************
   * Countdown Update Interval (Every Second)
   ***************************************************************/
  setInterval(() => {
    const countdownElements = document.querySelectorAll(".timer-middle[data-timer-id]");
    countdownElements.forEach(el => {
      const timerId = el.getAttribute("data-timer-id");
      const timer = timers.find(t => t.id === timerId);
      if (timer) {
        updateTimerCountdown(el, timer);
      }
    });
  }, 1000);

  /***************************************************************
   * Time Dropdown Initialization
   ***************************************************************/
  function populateTimeDropdowns() {
    // Hours (0-23)
    limitHoursSelect.innerHTML = "";
    for (let i = 0; i < 24; i++) {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = i.toString();
      limitHoursSelect.appendChild(opt);
    }
    // Minutes (0-59)
    limitMinutesSelect.innerHTML = "";
    for (let i = 0; i < 60; i++) {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = i.toString();
      limitMinutesSelect.appendChild(opt);
    }
    // Seconds (0-59)
    limitSecondsSelect.innerHTML = "";
    for (let i = 0; i < 60; i++) {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = i.toString();
      limitSecondsSelect.appendChild(opt);
    }
  }

  /***************************************************************
   * Add Timer Modal Logic
   ***************************************************************/
  addTimerBtn.addEventListener("click", () => {
    displayNameInput.value = "";
    newSiteURLInput.value = "";
    limitHoursSelect.value = 0;
    limitMinutesSelect.value = 0;
    limitSecondsSelect.value = 0;
    populateTimeDropdowns();
    addTimerModal.classList.remove("hidden");
  });

  closeAddModalBtn.addEventListener("click", () => {
    addTimerModal.classList.add("hidden");
  });

  saveAddTimerBtn.addEventListener("click", () => {
    const displayName = displayNameInput.value.trim();
    const url = newSiteURLInput.value.trim();
    const hours = parseInt(limitHoursSelect.value, 10) || 0;
    const minutes = parseInt(limitMinutesSelect.value, 10) || 0;
    const seconds = parseInt(limitSecondsSelect.value, 10) || 0;
    const dailyLimitInSeconds = hours * 3600 + minutes * 60 + seconds;
    if (!url) {
      alert("Please enter a valid site URL.");
      return;
    }
    const newTimer = {
      id: Date.now().toString(),
      title: displayName || url,
      urlPattern: url,
      dailyLimit: dailyLimitInSeconds,
      enabled: true,
      timeSpentToday: 0,
      daysOfWeek: {
        Monday: false,
        Tuesday: false,
        Wednesday: false,
        Thursday: false,
        Friday: false,
        Saturday: false,
        Sunday: false
      }
    };
    timers.push(newTimer);
    chrome.storage.sync.set({ timers }, () => {
      addTimerModal.classList.add("hidden");
      renderTimers();
    });
  });

  /***************************************************************
   * Enable All Timers
   ***************************************************************/
  enableAllBtn.addEventListener("click", () => {
    timers.forEach(t => t.enabled = true);
    chrome.storage.sync.set({ timers }, () => {
      renderTimers();
    });
  });

  /***************************************************************
   * Timer Filter
   ***************************************************************/
  timersFilter.addEventListener("change", () => {
    renderTimers();
  });

  /***************************************************************
   * Timer CRUD & Rendering
   ***************************************************************/
  function renderTimers() {
    const filterVal = timersFilter.value;
    const filtered = timers.filter(t => {
      if (filterVal === "enabled") return t.enabled;
      if (filterVal === "disabled") return !t.enabled;
      return true;
    });
    timersCount.textContent = `(${filtered.length})`;
    timersList.innerHTML = "";
    filtered.forEach(timer => {
      timersList.appendChild(createTimerRow(timer));
    });
  }

  function createTimerRow(timer) {
    const row = document.createElement("div");
    row.classList.add("timer-row");

    // Left Section: Timer Title
    const leftDiv = document.createElement("div");
    leftDiv.classList.add("timer-left");
    const titleSpan = document.createElement("span");
    titleSpan.classList.add("timer-title");
    titleSpan.textContent = timer.title;
    titleSpan.style.color = timer.color;
    leftDiv.appendChild(titleSpan);

    // Middle Section: Countdown & Warning Bar
    const middleDiv = document.createElement("div");
    middleDiv.classList.add("timer-middle");
    middleDiv.setAttribute("data-timer-id", timer.id);
    updateTimerCountdown(middleDiv, timer);

    // Create Warning Bar Element (initially hidden)
    const warningBar = document.createElement("div");
    warningBar.classList.add("warning-bar");
    warningBar.style.display = "none";
    middleDiv.appendChild(warningBar);

    // Right Section: Controls
    const rightDiv = document.createElement("div");
    rightDiv.classList.add("timer-right");

    // Toggle Switch for Pause/Resume
    const toggleInput = document.createElement("input");
    toggleInput.type = "checkbox";
    toggleInput.classList.add("toggle-timer");
    toggleInput.checked = timer.enabled;
    toggleInput.addEventListener("change", () => {
      if (toggleInput.checked) {
        timer.enabled = true;
        timer.timeSpentToday = 0;
        timer.lastUpdated = Date.now();
      } else {
        timer.enabled = false;
        timer.timeSpentToday = 0;
        timer.lastUpdated = Date.now();
      }
      chrome.storage.sync.set({ timers }, () => {
        renderTimers();
      });
    });
    rightDiv.appendChild(toggleInput);

    // Unblock Button – when pressed, sends message to unblock and refresh the site
    const unblockBtn = document.createElement("button");
    unblockBtn.classList.add("unblock-btn");
    unblockBtn.textContent = "Unblock";
    unblockBtn.addEventListener("click", () => {
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        if (tabs.length > 0) {
          const originalUrl = timer.urlPattern;
          chrome.runtime.sendMessage(
            { type: "unblockSite", originalUrl: originalUrl },
            response => {
              console.log("Unblock response:", response);
              chrome.tabs.update(tabs[0].id, { url: originalUrl });
            }
          );
        }
      });
    });
    rightDiv.appendChild(unblockBtn);

    // Edit Button
    const editBtn = document.createElement("button");
    editBtn.classList.add("edit-timer");
    const editImg = document.createElement("img");
    editImg.src = "setting.png";
    editImg.alt = "Edit Timer";
    editImg.style.width = "18px";
    editBtn.appendChild(editImg);
    editBtn.addEventListener("click", () => {
      showEditModal(timer);
    });
    rightDiv.appendChild(editBtn);

    // Delete Button
    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("delete-timer");
    const deleteImg = document.createElement("img");
    deleteImg.src = "cross.png";
    deleteImg.alt = "Delete Timer";
    deleteImg.style.width = "18px";
    deleteBtn.appendChild(deleteImg);
    deleteBtn.addEventListener("click", () => {
      timers = timers.filter(t => t.id !== timer.id);
      chrome.storage.sync.set({ timers }, () => {
        renderTimers();
      });
    });
    rightDiv.appendChild(deleteBtn);

    row.appendChild(leftDiv);
    row.appendChild(middleDiv);
    row.appendChild(rightDiv);

    // Update countdown and warning bar for this row every second
    setInterval(() => {
      updateTimerCountdown(middleDiv, timer);
      const remaining = getRemainingTime(timer);
      if (remaining <= 300 && timer.enabled) { // 5 minutes or less
        warningBar.style.display = "block";
        const m = Math.floor(remaining / 60);
        const s = remaining % 60;
        warningBar.textContent = `Warning: ${m}m ${s}s remaining`;
        warningBar.style.backgroundColor = "rgba(255, 0, 0, 0.7)";
        warningBar.style.color = "white";
        warningBar.style.padding = "5px";
        warningBar.style.textAlign = "center";
      } else {
        warningBar.style.display = "none";
      }
    }, 1000);

    return row;
  }

  /***************************************************************
   * Show Edit Timer Modal
   ***************************************************************/
  function showEditModal(timer) {
    if (!timer.daysOfWeek) {
      timer.daysOfWeek = {
        Monday: false, Tuesday: false, Wednesday: false,
        Thursday: false, Friday: false, Saturday: false, Sunday: false
      };
    }
    const totalSeconds = timer.dailyLimit || 0;
    const existingHours = Math.floor(totalSeconds / 3600);
    const remainderH = totalSeconds % 3600;
    const existingMinutes = Math.floor(remainderH / 60);
    const existingSeconds = remainderH % 60;

    const modal = document.createElement("div");
    modal.classList.add("modal");
    const modalContent = document.createElement("div");
    modalContent.classList.add("modal-content");

    const header = document.createElement("h3");
    header.textContent = "Edit Timer";
    modalContent.appendChild(header);

    const form = document.createElement("form");
    form.classList.add("minimal-form");

    // Title field
    const titleLabel = document.createElement("label");
    titleLabel.classList.add("input-label");
    titleLabel.textContent = "Title (A name or description)";
    form.appendChild(titleLabel);
    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.classList.add("text-input");
    titleInput.value = timer.title;
    form.appendChild(titleInput);

    // URL field
    const urlLabel = document.createElement("label");
    urlLabel.classList.add("input-label");
    urlLabel.textContent = "URL (e.g., https://example.com)";
    form.appendChild(urlLabel);
    const urlInput = document.createElement("input");
    urlInput.type = "text";
    urlInput.classList.add("text-input");
    urlInput.value = timer.urlPattern;
    form.appendChild(urlInput);

    // Daily Limit field (Time pickers)
    const limitLabel = document.createElement("label");
    limitLabel.classList.add("input-label");
    limitLabel.textContent = "Daily Limit";
    form.appendChild(limitLabel);

    const timePickerContainer = document.createElement("div");
    timePickerContainer.style.display = "flex";
    timePickerContainer.style.gap = "10px";
    form.appendChild(timePickerContainer);

    // Hours picker
    const hoursSelect = document.createElement("select");
    hoursSelect.style.width = "80px";
    for (let i = 0; i < 24; i++) {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = i.toString();
      if (i === existingHours) opt.selected = true;
      hoursSelect.appendChild(opt);
    }
    timePickerContainer.appendChild(hoursSelect);
    const hoursLabel = document.createElement("label");
    hoursLabel.textContent = "Hours";
    hoursLabel.style.alignSelf = "center";
    timePickerContainer.appendChild(hoursLabel);

    // Minutes picker
    const minutesSelect = document.createElement("select");
    minutesSelect.style.width = "80px";
    for (let i = 0; i < 60; i++) {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = i.toString();
      if (i === existingMinutes) opt.selected = true;
      minutesSelect.appendChild(opt);
    }
    timePickerContainer.appendChild(minutesSelect);
    const minutesLabel = document.createElement("label");
    minutesLabel.textContent = "Minutes";
    minutesLabel.style.alignSelf = "center";
    timePickerContainer.appendChild(minutesLabel);

    // Seconds picker
    const secondsSelect = document.createElement("select");
    secondsSelect.style.width = "80px";
    for (let i = 0; i < 60; i++) {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = i.toString();
      if (i === existingSeconds) opt.selected = true;
      secondsSelect.appendChild(opt);
    }
    timePickerContainer.appendChild(secondsSelect);
    const secondsLabel = document.createElement("label");
    secondsLabel.textContent = "Seconds";
    secondsLabel.style.alignSelf = "center";
    timePickerContainer.appendChild(secondsLabel);

    // Basic Save Button
    const basicSaveBtn = document.createElement("button");
    basicSaveBtn.type = "button";
    basicSaveBtn.classList.add("primary-btn");
    basicSaveBtn.textContent = "Save";
    basicSaveBtn.addEventListener("click", () => {
      timer.title = titleInput.value.trim() || timer.title;
      timer.urlPattern = urlInput.value.trim() || timer.urlPattern;
      const h = parseInt(hoursSelect.value, 10) || 0;
      const m = parseInt(minutesSelect.value, 10) || 0;
      const s = parseInt(secondsSelect.value, 10) || 0;
      timer.dailyLimit = h * 3600 + m * 60 + s;
      chrome.storage.sync.set({ timers }, () => {
        renderTimers();
        document.body.removeChild(modal);
      });
    });
    form.appendChild(basicSaveBtn);
    modalContent.appendChild(form);

    // Advanced Section (Optional)
    const advancedHeader = document.createElement("h3");
    advancedHeader.textContent = "Advanced";
    advancedHeader.style.marginTop = "20px";
    modalContent.appendChild(advancedHeader);
    const advancedInfo = document.createElement("p");
    advancedInfo.textContent = "Custom time blocks for days of the week.";
    modalContent.appendChild(advancedInfo);
    const daysContainer = document.createElement("div");
    daysContainer.style.display = "flex";
    daysContainer.style.flexWrap = "wrap";
    daysContainer.style.gap = "10px";
    modalContent.appendChild(daysContainer);
    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    daysOfWeek.forEach(day => {
      const label = document.createElement("label");
      label.style.display = "flex";
      label.style.alignItems = "center";
      label.style.gap = "5px";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = timer.daysOfWeek[day];
      checkbox.addEventListener("change", () => {
        timer.daysOfWeek[day] = checkbox.checked;
      });
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(day));
      daysContainer.appendChild(label);
    });
    const advancedSaveBtn = document.createElement("button");
    advancedSaveBtn.type = "button";
    advancedSaveBtn.classList.add("primary-btn");
    advancedSaveBtn.textContent = "Save";
    advancedSaveBtn.style.marginTop = "10px";
    advancedSaveBtn.addEventListener("click", () => {
      chrome.storage.sync.set({ timers }, () => {
        renderTimers();
        document.body.removeChild(modal);
      });
    });
    modalContent.appendChild(advancedSaveBtn);

    modal.appendChild(modalContent);
    document.body.appendChild(modal);
  }

  /***************************************************************
   * Load Timers from Storage on Startup
   ***************************************************************/
  chrome.storage.sync.get("timers", data => {
    if (chrome.runtime.lastError) {
      console.error("Error retrieving timers:", chrome.runtime.lastError);
      timers = [];
    } else {
      timers = data.timers || [];
    }
    renderTimers();
  });

  /***************************************************************
   * Analytics Logic
   ***************************************************************/
  document.getElementById("analyticsPeriod").addEventListener("change", loadAnalytics);
  function loadAnalytics() {
    const periodSelect = document.getElementById("analyticsPeriod");
    const period = periodSelect.value;
    chrome.storage.sync.get(["dailyUsage"], data => {
      if (chrome.runtime.lastError) {
        console.error("Error retrieving dailyUsage:", chrome.runtime.lastError);
        return;
      }
      let dailyUsage = data.dailyUsage || {};
      const today = new Date().toISOString().slice(0, 10);
      if (period === "today") {
        if (!dailyUsage[today]) {
          dailyUsage[today] = { "default.com": 0 };
          chrome.storage.sync.set({ dailyUsage });
        }
        let todayUsage = dailyUsage[today];
        renderChart(todayUsage);
        displayUsageTable(todayUsage);
      } else if (period === "daily") {
        let dayLabels = [];
        let dayValues = [];
        Object.keys(dailyUsage).forEach(dateStr => {
          let totalForDay = 0;
          let usageObj = dailyUsage[dateStr] || {};
          Object.values(usageObj).forEach(seconds => {
            totalForDay += seconds;
          });
          dayLabels.push(dateStr);
          dayValues.push(totalForDay);
        });
        renderDailyBarChart(dayLabels, dayValues);
      }
    });
  }

  function renderChart(data) {
    const canvas = document.getElementById("timeChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (window.myChart instanceof Chart) {
      window.myChart.destroy();
    }
    const labels = Object.keys(data);
    const values = labels.map(site => data[site] || 0);
    const colors = [
      "#FF6384", "#36A2EB", "#FFCE56", "#4CAF50",
      "#9C27B0", "#FF9800", "#795548", "#CDDC39",
      "#00BCD4", "#E91E63"
    ];
    window.myChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors.slice(0, labels.length)
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: true, position: "right" } }
      }
    });
  }

  function displayUsageTable(data) {
    const tableContainer = document.getElementById("usageTable");
    if (!tableContainer) return;
    tableContainer.innerHTML = "";
    const entries = Object.entries(data);
    let totalTime = entries.reduce((sum, [_, time]) => sum + time, 0);
    entries.sort((a, b) => b[1] - a[1]);
    entries.forEach(([site, time]) => {
      let percent = totalTime ? (time / totalTime) * 100 : 0;
      const row = document.createElement("div");
      row.classList.add("usage-row");
      const siteTitle = document.createElement("span");
      siteTitle.classList.add("site-title");
      siteTitle.textContent = site;
      row.appendChild(siteTitle);
      const progressBar = document.createElement("div");
      progressBar.classList.add("progress-bar");
      const progressFill = document.createElement("div");
      progressFill.classList.add("progress-fill");
      progressFill.style.width = percent.toFixed(2) + "%";
      progressBar.appendChild(progressFill);
      row.appendChild(progressBar);
      const timeText = document.createElement("span");
      timeText.classList.add("site-time");
      timeText.textContent = formatTime(time);
      row.appendChild(timeText);
      tableContainer.appendChild(row);
    });
  }

  function renderDailyBarChart(labels, values) {
    const canvas = document.getElementById("timeChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (window.myChart instanceof Chart) {
      window.myChart.destroy();
    }
    window.myChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{
          label: "Total Time",
          data: values,
          backgroundColor: "rgba(54, 162, 235, 0.6)"
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                const m = Math.floor(value / 60);
                const s = value % 60;
                return `${m}m ${s}s`;
              }
            },
            title: { display: true, text: "Time" }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.parsed.y;
                const m = Math.floor(value / 60);
                const s = value % 60;
                return `${m}m ${s}s`;
              }
            }
          }
        }
      }
    });
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  }

  /***************************************************************
   * Home Page Updates
   ***************************************************************/
  function updateHomeUsage() {
    chrome.storage.sync.get("dailyUsage", data => {
      const dailyUsage = data.dailyUsage || {};
      const today = new Date().toISOString().slice(0, 10);
      const todayUsage = dailyUsage[today] || {};
      const totalSeconds = Object.values(todayUsage).reduce((sum, sec) => sum + sec, 0);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const formattedTime =
        String(hours).padStart(2, "0") + ":" +
        String(minutes).padStart(2, "0") + ":" +
        String(seconds).padStart(2, "0");
      const homeScreenTimeEl = document.getElementById("homeScreenTime");
      if (homeScreenTimeEl) {
        homeScreenTimeEl.textContent = formattedTime;
      } else {
        console.error("Element with id 'homeScreenTime' not found.");
      }
    });
  }

  function updateHomeStats() {
    chrome.storage.sync.get("dailyUsage", data => {
      const dailyUsage = data.dailyUsage || {};
      const dates = Object.keys(dailyUsage);
      let totalUsageAllDays = 0;
      dates.forEach(date => {
        const usageForDate = dailyUsage[date] || {};
        const dayTotal = Object.values(usageForDate).reduce((sum, sec) => sum + sec, 0);
        totalUsageAllDays += dayTotal;
      });
      const daysCount = dates.length;
      const averageUsage = daysCount > 0 ? totalUsageAllDays / daysCount : 0;
      const avgHours = Math.floor(averageUsage / 3600);
      const avgMinutes = Math.floor((averageUsage % 3600) / 60);
      const avgSeconds = Math.floor(averageUsage % 60);
      const formattedAvg =
        String(avgHours).padStart(2, "0") + ":" +
        String(avgMinutes).padStart(2, "0") + ":" +
        String(avgSeconds).padStart(2, "0");
      const averageTimeEl = document.getElementById("averageTime");
      if (averageTimeEl) {
        averageTimeEl.textContent = formattedAvg;
      } else {
        console.error("Element with id 'averageTime' not found.");
      }
      // Top used website for today (only top one)
      const today = new Date().toISOString().slice(0, 10);
      const todayUsage = dailyUsage[today] || {};
      const sortedSites = Object.entries(todayUsage).sort((a, b) => b[1] - a[1]);
      const topWebsiteEl = document.getElementById("topWebsite");
      if (topWebsiteEl) {
        topWebsiteEl.innerHTML = "";
        if (sortedSites.length > 0) {
          const [topSite, seconds] = sortedSites[0];
          const m = Math.floor(seconds / 60);
          const s = seconds % 60;
          topWebsiteEl.textContent = `${topSite}: ${m}m ${s}s`;
        } else {
          topWebsiteEl.textContent = "No usage data";
        }
      }
    });
  }

  updateHomeUsage();
  updateHomeStats();
  setInterval(() => {
    updateHomeUsage();
    updateHomeStats();
  }, 30000);

  /***************************************************************
   * Motivational Messages
   ***************************************************************/
  if (motivationEl) {
    const initialIndex = Math.floor(Math.random() * motivationalMessages.length);
    motivationEl.textContent = motivationalMessages[initialIndex];
  }
  if (shuffleBtn && motivationEl) {
    shuffleBtn.addEventListener("click", () => {
      const randomIndex = Math.floor(Math.random() * motivationalMessages.length);
      motivationEl.textContent = motivationalMessages[randomIndex];
      console.log("Shuffle clicked, new message index:", randomIndex);
    });
  } else {
    console.error("Shuffle button or motivation element not found.");
  }
});
